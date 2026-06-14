from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ============ Setup ============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGO = "HS256"
JWT_SECRET = os.environ['JWT_SECRET']
ACCESS_TOKEN_HOURS = 12

app = FastAPI(title="Employee Churn Prediction & Retention System")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("hrms")


# ============ Utility helpers ============
def now_utc():
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now_utc() + timedelta(hours=ACCESS_TOKEN_HOURS),
        "iat": now_utc(),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "HR_ADMIN":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


# ============ Models ============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Literal["HR_ADMIN", "EMPLOYEE"] = "EMPLOYEE"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    token: str
    user: dict


class EmployeeIn(BaseModel):
    name: str
    email: EmailStr
    department: str
    position: str
    salary: float = 0
    join_date: Optional[str] = None
    overtime_hours: float = 0
    avatar: Optional[str] = None
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"


class AttendanceIn(BaseModel):
    employee_id: str
    date: str  # YYYY-MM-DD
    status: Literal["PRESENT", "ABSENT", "LATE", "WFH"]
    note: Optional[str] = None


class LeaveIn(BaseModel):
    employee_id: str
    leave_type: Literal["SICK", "CASUAL", "ANNUAL", "UNPAID"]
    start_date: str
    end_date: str
    reason: Optional[str] = ""


class LeaveDecisionIn(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    note: Optional[str] = ""


class PerformanceIn(BaseModel):
    employee_id: str
    rating: float = Field(ge=1, le=5)
    period: str  # e.g. "2025-Q4"
    review: str
    reviewer: Optional[str] = ""


class SurveyIn(BaseModel):
    employee_id: str
    work_life_balance: int = Field(ge=1, le=5)
    salary_satisfaction: int = Field(ge=1, le=5)
    career_growth: int = Field(ge=1, le=5)
    manager_support: int = Field(ge=1, le=5)
    overall_satisfaction: int = Field(ge=1, le=5)
    comments: Optional[str] = ""


# ============ Churn engine (rule-based) ============
def compute_churn_for_employee(emp: dict, attendance_pct: float, leave_freq: int,
                               perf_rating: float, overtime_hours: float,
                               satisfaction_avg: float) -> dict:
    """Return dict with score (0-100), risk, factors."""
    # weight scoring — higher score = higher risk of leaving
    score = 0.0
    factors = []

    # Attendance (25 pts max)
    att_score = max(0, (100 - attendance_pct)) * 0.25  # 100% attendance → 0pts; 60% → 10pts
    score += att_score
    if attendance_pct < 80:
        factors.append(f"Low attendance ({attendance_pct:.1f}%)")

    # Leave frequency (15 pts max). >6 leaves = max
    lf_score = min(15.0, leave_freq * 2.5)
    score += lf_score
    if leave_freq >= 4:
        factors.append(f"Frequent leaves ({leave_freq})")

    # Performance (25 pts max). 5→0 ; 1→25
    perf_score = (5 - perf_rating) * 6.25
    score += perf_score
    if perf_rating < 3:
        factors.append(f"Low performance ({perf_rating:.1f})")

    # Overtime (15 pts max). >40h/mo → max
    ot_score = min(15.0, overtime_hours * 0.375)
    score += ot_score
    if overtime_hours > 30:
        factors.append(f"High overtime ({overtime_hours:.0f}h)")

    # Satisfaction (20 pts max). 5→0; 1→20
    sat_score = (5 - satisfaction_avg) * 5
    score += sat_score
    if satisfaction_avg < 3:
        factors.append(f"Low satisfaction ({satisfaction_avg:.1f})")

    score = round(max(0, min(100, score)), 1)
    if score >= 65:
        risk = "HIGH"
    elif score >= 35:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "score": score,
        "risk": risk,
        "factors": factors,
        "metrics": {
            "attendance_pct": round(attendance_pct, 1),
            "leave_freq": leave_freq,
            "performance": round(perf_rating, 2),
            "overtime_hours": overtime_hours,
            "satisfaction_avg": round(satisfaction_avg, 2),
        },
    }


def generate_recommendations(churn: dict) -> List[str]:
    recs = []
    factors = " ".join(churn["factors"]).lower()
    m = churn["metrics"]
    if "overtime" in factors or m["overtime_hours"] > 30:
        recs.append("Reduce workload — redistribute responsibilities and limit overtime.")
    if "satisfaction" in factors or m["satisfaction_avg"] < 3.5:
        recs.append("HR counseling session — schedule 1:1 to understand concerns.")
    if "performance" in factors or m["performance"] < 3.5:
        recs.append("Targeted training program — upskill in role-relevant areas.")
    if churn["risk"] == "HIGH":
        recs.append("Promotion / compensation review — flag for retention discussion.")
    if "attendance" in factors or m["attendance_pct"] < 85:
        recs.append("Employee engagement activities — improve workplace connection.")
    if not recs:
        recs.append("Continue regular check-ins — employee in stable zone.")
    return recs


async def compute_employee_churn(employee_id: str) -> dict:
    emp = await db.employees.find_one({"id": employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Attendance percentage (last 30 days)
    att_records = await db.attendance.find({"employee_id": employee_id}).to_list(1000)
    total = len(att_records)
    if total > 0:
        present = sum(1 for r in att_records if r["status"] in ("PRESENT", "WFH"))
        attendance_pct = (present / total) * 100
    else:
        attendance_pct = 100.0

    # Leave frequency (count of approved leaves in last 6 months)
    leaves = await db.leaves.find({"employee_id": employee_id, "status": "APPROVED"}).to_list(1000)
    leave_freq = len(leaves)

    # Performance rating (latest)
    reviews = await db.performance.find({"employee_id": employee_id}).sort("created_at", -1).to_list(50)
    perf_rating = reviews[0]["rating"] if reviews else 3.0

    overtime_hours = float(emp.get("overtime_hours", 0))

    # Satisfaction avg (latest survey)
    surveys = await db.surveys.find({"employee_id": employee_id}).sort("created_at", -1).to_list(5)
    if surveys:
        s = surveys[0]
        sat_avg = (s["work_life_balance"] + s["salary_satisfaction"] + s["career_growth"]
                   + s["manager_support"] + s["overall_satisfaction"]) / 5
    else:
        sat_avg = 3.0

    churn = compute_churn_for_employee(emp, attendance_pct, leave_freq, perf_rating, overtime_hours, sat_avg)
    churn["employee_id"] = employee_id
    churn["recommendations"] = generate_recommendations(churn)
    churn["computed_at"] = iso(now_utc())

    # Store prediction history (one snapshot per call)
    await db.churn_predictions.insert_one({
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "score": churn["score"],
        "risk": churn["risk"],
        "factors": churn["factors"],
        "metrics": churn["metrics"],
        "recommendations": churn["recommendations"],
        "created_at": iso(now_utc()),
    })

    # Generate alerts
    if churn["risk"] == "HIGH":
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "type": "HIGH_RISK",
            "severity": "HIGH",
            "message": f"{emp['name']} is now HIGH RISK (score {churn['score']}).",
            "read": False,
            "created_at": iso(now_utc()),
        })
    if attendance_pct < 75 and total > 0:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "type": "LOW_ATTENDANCE",
            "severity": "MEDIUM",
            "message": f"{emp['name']} attendance dropped to {attendance_pct:.1f}%.",
            "read": False,
            "created_at": iso(now_utc()),
        })
    if sat_avg < 2.5 and surveys:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "type": "LOW_SATISFACTION",
            "severity": "MEDIUM",
            "message": f"{emp['name']} reported low satisfaction ({sat_avg:.1f}/5).",
            "read": False,
            "created_at": iso(now_utc()),
        })
    if perf_rating < 2.5 and reviews:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "type": "LOW_PERFORMANCE",
            "severity": "MEDIUM",
            "message": f"{emp['name']} performance below threshold ({perf_rating:.1f}/5).",
            "read": False,
            "created_at": iso(now_utc()),
        })

    return churn


def serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ============ Auth endpoints ============
@api.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": email,
        "name": body.name,
        "role": body.role,
        "password_hash": hash_password(body.password),
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(uid, email, body.role)
    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    return {"token": token, "user": user_doc}


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user["role"])
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ============ Employees ============
@api.get("/employees")
async def list_employees(
    user: dict = Depends(get_current_user),
    q: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
):
    flt = {}
    if q:
        flt["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"position": {"$regex": q, "$options": "i"}},
        ]
    if department and department != "ALL":
        flt["department"] = department
    if status and status != "ALL":
        flt["status"] = status

    total = await db.employees.count_documents(flt)
    skip = max(0, (page - 1) * page_size)
    cursor = db.employees.find(flt).sort("name", 1).skip(skip).limit(page_size)
    rows = [serialize(e) for e in await cursor.to_list(page_size)]
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


@api.get("/employees/{employee_id}")
async def get_employee(employee_id: str, user: dict = Depends(get_current_user)):
    emp = await db.employees.find_one({"id": employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return serialize(emp)


@api.post("/employees")
async def create_employee(body: EmployeeIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = iso(now_utc())
    if not doc.get("join_date"):
        doc["join_date"] = now_utc().strftime("%Y-%m-%d")
    await db.employees.insert_one(doc)
    return serialize(doc)


@api.put("/employees/{employee_id}")
async def update_employee(employee_id: str, body: EmployeeIn, _: dict = Depends(require_admin)):
    upd = body.model_dump()
    res = await db.employees.update_one({"id": employee_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp = await db.employees.find_one({"id": employee_id})
    return serialize(emp)


@api.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, _: dict = Depends(require_admin)):
    res = await db.employees.delete_one({"id": employee_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    await db.attendance.delete_many({"employee_id": employee_id})
    await db.leaves.delete_many({"employee_id": employee_id})
    await db.performance.delete_many({"employee_id": employee_id})
    await db.surveys.delete_many({"employee_id": employee_id})
    await db.churn_predictions.delete_many({"employee_id": employee_id})
    await db.alerts.delete_many({"employee_id": employee_id})
    return {"ok": True}


@api.get("/departments")
async def list_departments(_: dict = Depends(get_current_user)):
    rows = await db.employees.distinct("department")
    return sorted([r for r in rows if r])


# ============ Attendance ============
@api.post("/attendance")
async def mark_attendance(body: AttendanceIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    existing = await db.attendance.find_one({"employee_id": doc["employee_id"], "date": doc["date"]})
    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": {"status": doc["status"], "note": doc.get("note")}})
        existing.update(doc)
        return serialize(existing)
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = iso(now_utc())
    await db.attendance.insert_one(doc)
    return serialize(doc)


@api.get("/attendance/{employee_id}")
async def attendance_history(employee_id: str, _: dict = Depends(get_current_user)):
    rows = await db.attendance.find({"employee_id": employee_id}).sort("date", -1).to_list(500)
    items = [serialize(r) for r in rows]
    total = len(items)
    present = sum(1 for r in items if r["status"] in ("PRESENT", "WFH"))
    pct = (present / total * 100) if total else 0.0
    return {"items": items, "total": total, "percentage": round(pct, 1)}


@api.get("/attendance/{employee_id}/monthly")
async def attendance_monthly(employee_id: str, _: dict = Depends(get_current_user)):
    rows = await db.attendance.find({"employee_id": employee_id}).to_list(1000)
    monthly = {}
    for r in rows:
        m = r["date"][:7]
        monthly.setdefault(m, {"month": m, "present": 0, "absent": 0, "late": 0, "wfh": 0, "total": 0})
        monthly[m]["total"] += 1
        if r["status"] == "PRESENT":
            monthly[m]["present"] += 1
        elif r["status"] == "ABSENT":
            monthly[m]["absent"] += 1
        elif r["status"] == "LATE":
            monthly[m]["late"] += 1
        elif r["status"] == "WFH":
            monthly[m]["wfh"] += 1
    out = sorted(monthly.values(), key=lambda x: x["month"])
    for r in out:
        r["percentage"] = round(((r["present"] + r["wfh"]) / r["total"]) * 100, 1) if r["total"] else 0
    return out


# ============ Leaves ============
@api.post("/leaves")
async def apply_leave(body: LeaveIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "PENDING"
    doc["applied_by"] = user["id"]
    doc["created_at"] = iso(now_utc())
    await db.leaves.insert_one(doc)
    return serialize(doc)


@api.get("/leaves")
async def list_leaves(_: dict = Depends(get_current_user), employee_id: Optional[str] = None, status: Optional[str] = None):
    flt = {}
    if employee_id:
        flt["employee_id"] = employee_id
    if status:
        flt["status"] = status
    rows = await db.leaves.find(flt).sort("created_at", -1).to_list(500)
    return [serialize(r) for r in rows]


@api.post("/leaves/{leave_id}/decision")
async def leave_decision(leave_id: str, body: LeaveDecisionIn, _: dict = Depends(require_admin)):
    res = await db.leaves.update_one({"id": leave_id}, {"$set": {"status": body.status, "decision_note": body.note, "decided_at": iso(now_utc())}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave not found")
    return await db.leaves.find_one({"id": leave_id}, {"_id": 0})


# ============ Performance ============
@api.post("/performance")
async def add_performance(body: PerformanceIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = iso(now_utc())
    await db.performance.insert_one(doc)
    return serialize(doc)


@api.put("/performance/{review_id}")
async def edit_performance(review_id: str, body: PerformanceIn, _: dict = Depends(require_admin)):
    res = await db.performance.update_one({"id": review_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return await db.performance.find_one({"id": review_id}, {"_id": 0})


@api.get("/performance/{employee_id}")
async def performance_history(employee_id: str, _: dict = Depends(get_current_user)):
    rows = await db.performance.find({"employee_id": employee_id}).sort("created_at", -1).to_list(200)
    return [serialize(r) for r in rows]


# ============ Surveys ============
@api.post("/surveys")
async def submit_survey(body: SurveyIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["submitted_by"] = user["id"]
    doc["created_at"] = iso(now_utc())
    doc["average"] = round((doc["work_life_balance"] + doc["salary_satisfaction"] + doc["career_growth"]
                            + doc["manager_support"] + doc["overall_satisfaction"]) / 5, 2)
    await db.surveys.insert_one(doc)
    return serialize(doc)


@api.get("/surveys/{employee_id}")
async def employee_surveys(employee_id: str, _: dict = Depends(get_current_user)):
    rows = await db.surveys.find({"employee_id": employee_id}).sort("created_at", -1).to_list(50)
    return [serialize(r) for r in rows]


# ============ Churn ============
@api.get("/churn/{employee_id}")
async def churn_for_employee(employee_id: str, _: dict = Depends(get_current_user)):
    return await compute_employee_churn(employee_id)


@api.get("/churn/{employee_id}/history")
async def churn_history(employee_id: str, _: dict = Depends(get_current_user)):
    rows = await db.churn_predictions.find({"employee_id": employee_id}).sort("created_at", -1).limit(50).to_list(50)
    return [serialize(r) for r in rows]


@api.post("/churn/recompute-all")
async def recompute_all(_: dict = Depends(require_admin)):
    emps = await db.employees.find({"status": "ACTIVE"}).to_list(1000)
    out = []
    for e in emps:
        c = await compute_employee_churn(e["id"])
        out.append({"employee_id": e["id"], "name": e["name"], "score": c["score"], "risk": c["risk"]})
    return out


# ============ Alerts ============
@api.get("/alerts")
async def list_alerts(_: dict = Depends(get_current_user), unread_only: bool = False, limit: int = 50):
    flt = {}
    if unread_only:
        flt["read"] = False
    rows = await db.alerts.find(flt).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize(r) for r in rows]


@api.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, _: dict = Depends(get_current_user)):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"read": True}})
    return {"ok": True}


# ============ Dashboard ============
@api.get("/dashboard/summary")
async def dashboard_summary(_: dict = Depends(get_current_user)):
    total = await db.employees.count_documents({})
    active = await db.employees.count_documents({"status": "ACTIVE"})

    # Compute latest churn for active employees on the fly (cached: last prediction)
    active_emps = await db.employees.find({"status": "ACTIVE"}).to_list(1000)
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    high_risk_list = []

    for emp in active_emps:
        latest = await db.churn_predictions.find({"employee_id": emp["id"]}).sort("created_at", -1).limit(1).to_list(1)
        if latest:
            risk = latest[0]["risk"]
            risk_dist[risk] = risk_dist.get(risk, 0) + 1
            if risk == "HIGH":
                high_risk_list.append({"id": emp["id"], "name": emp["name"], "department": emp["department"],
                                       "score": latest[0]["score"], "avatar": emp.get("avatar")})

    # Avg satisfaction (latest survey per employee)
    sat_vals = []
    surveys = await db.surveys.find({}).sort("created_at", -1).to_list(2000)
    seen = set()
    for s in surveys:
        if s["employee_id"] in seen:
            continue
        seen.add(s["employee_id"])
        sat_vals.append(s.get("average", 0))
    avg_sat = round(sum(sat_vals) / len(sat_vals), 2) if sat_vals else 0

    # Dept distribution
    dept_dist = {}
    for e in active_emps:
        dept_dist[e["department"]] = dept_dist.get(e["department"], 0) + 1

    # Attendance trend (avg per month)
    att_rows = await db.attendance.find({}).to_list(5000)
    by_month = {}
    for r in att_rows:
        m = r["date"][:7]
        by_month.setdefault(m, {"month": m, "present": 0, "total": 0})
        by_month[m]["total"] += 1
        if r["status"] in ("PRESENT", "WFH"):
            by_month[m]["present"] += 1
    attendance_trend = sorted(
        [{"month": v["month"], "percentage": round(v["present"] / v["total"] * 100, 1) if v["total"] else 0}
         for v in by_month.values()], key=lambda x: x["month"])[-6:]

    # Performance trend (avg per month)
    perf_rows = await db.performance.find({}).to_list(2000)
    perf_by = {}
    for r in perf_rows:
        m = r["created_at"][:7]
        perf_by.setdefault(m, []).append(r["rating"])
    performance_trend = sorted(
        [{"month": m, "rating": round(sum(v) / len(v), 2)} for m, v in perf_by.items()],
        key=lambda x: x["month"])[-6:]

    # Satisfaction trend (avg per month)
    sat_by = {}
    for s in surveys:
        m = s["created_at"][:7]
        sat_by.setdefault(m, []).append(s.get("average", 0))
    satisfaction_trend = sorted(
        [{"month": m, "score": round(sum(v) / len(v), 2)} for m, v in sat_by.items()],
        key=lambda x: x["month"])[-6:]

    return {
        "total_employees": total,
        "active_employees": active,
        "high_risk_count": risk_dist["HIGH"],
        "avg_satisfaction": avg_sat,
        "risk_distribution": [
            {"name": "Low Risk", "value": risk_dist["LOW"], "key": "LOW"},
            {"name": "Medium Risk", "value": risk_dist["MEDIUM"], "key": "MEDIUM"},
            {"name": "High Risk", "value": risk_dist["HIGH"], "key": "HIGH"},
        ],
        "department_distribution": [{"department": k, "count": v} for k, v in dept_dist.items()],
        "attendance_trend": attendance_trend,
        "performance_trend": performance_trend,
        "satisfaction_trend": satisfaction_trend,
        "high_risk_employees": high_risk_list,
    }


# ============ Seed ============
SEED_EMPLOYEES = [
    {"name": "Aarav Sharma", "email": "aarav@churnhr.com", "department": "Engineering", "position": "Senior Engineer",
     "salary": 95000, "overtime_hours": 42, "join_date": "2021-03-15",
     "avatar": "https://images.unsplash.com/photo-1600878459138-e1123b37cb30?w=200"},
    {"name": "Priya Patel", "email": "priya@churnhr.com", "department": "Engineering", "position": "Tech Lead",
     "salary": 120000, "overtime_hours": 20, "join_date": "2019-08-10",
     "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"},
    {"name": "Rahul Mehta", "email": "rahul@churnhr.com", "department": "Sales", "position": "Account Executive",
     "salary": 70000, "overtime_hours": 35, "join_date": "2022-01-04",
     "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200"},
    {"name": "Diya Nair", "email": "diya@churnhr.com", "department": "Marketing", "position": "Brand Manager",
     "salary": 85000, "overtime_hours": 18, "join_date": "2020-11-20",
     "avatar": "https://images.unsplash.com/photo-1685760259914-ee8d2c92d2e0?w=200"},
    {"name": "Karan Singh", "email": "karan@churnhr.com", "department": "Finance", "position": "Analyst",
     "salary": 75000, "overtime_hours": 25, "join_date": "2021-06-12",
     "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"},
    {"name": "Sneha Iyer", "email": "sneha@churnhr.com", "department": "HR", "position": "HR Generalist",
     "salary": 65000, "overtime_hours": 10, "join_date": "2023-02-01",
     "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"},
    {"name": "Vikram Joshi", "email": "vikram@churnhr.com", "department": "Engineering", "position": "Junior Engineer",
     "salary": 55000, "overtime_hours": 48, "join_date": "2023-09-15",
     "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"},
    {"name": "Anjali Kapoor", "email": "anjali@churnhr.com", "department": "Sales", "position": "Sales Lead",
     "salary": 110000, "overtime_hours": 15, "join_date": "2018-04-22",
     "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"},
]


async def seed_data():
    # ensure indexes
    await db.users.create_index("email", unique=True)
    await db.employees.create_index("email", unique=True)
    await db.attendance.create_index([("employee_id", 1), ("date", 1)])

    # Admin
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "HR Admin",
            "role": "HR_ADMIN",
            "password_hash": hash_password(admin_pw),
            "created_at": iso(now_utc()),
        })
        log.info(f"Seeded admin {admin_email}")
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    # Also seed an employee user for demo
    emp_email = "employee@churnhr.com"
    if not await db.users.find_one({"email": emp_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": emp_email,
            "name": "Demo Employee",
            "role": "EMPLOYEE",
            "password_hash": hash_password("employee123"),
            "created_at": iso(now_utc()),
        })

    # Employees
    if await db.employees.count_documents({}) == 0:
        import random
        random.seed(42)
        for e in SEED_EMPLOYEES:
            doc = {**e, "id": str(uuid.uuid4()), "status": "ACTIVE", "created_at": iso(now_utc())}
            await db.employees.insert_one(doc)

            # Attendance: last 30 days
            base = now_utc().date()
            for i in range(30):
                d = base - timedelta(days=i)
                if d.weekday() >= 5:
                    continue
                # bias attendance by overtime/risk
                roll = random.random()
                if doc["overtime_hours"] > 40:  # stressed → more absences
                    status_v = "ABSENT" if roll < 0.15 else ("LATE" if roll < 0.25 else "PRESENT")
                else:
                    status_v = "ABSENT" if roll < 0.05 else ("LATE" if roll < 0.12 else "PRESENT")
                await db.attendance.insert_one({
                    "id": str(uuid.uuid4()),
                    "employee_id": doc["id"],
                    "date": d.strftime("%Y-%m-%d"),
                    "status": status_v,
                    "created_at": iso(now_utc()),
                })

            # Performance reviews (2 periods)
            for k, period in enumerate(["2025-Q3", "2025-Q4"]):
                if doc["overtime_hours"] > 40:
                    rating = round(random.uniform(2.0, 3.2), 1)
                elif doc["overtime_hours"] > 25:
                    rating = round(random.uniform(3.0, 4.0), 1)
                else:
                    rating = round(random.uniform(3.8, 4.8), 1)
                created = now_utc() - timedelta(days=(1 - k) * 90)
                await db.performance.insert_one({
                    "id": str(uuid.uuid4()),
                    "employee_id": doc["id"],
                    "rating": rating,
                    "period": period,
                    "review": f"{period} performance review. Rating: {rating}.",
                    "reviewer": "HR Admin",
                    "created_at": iso(created),
                })

            # Satisfaction survey
            base_sat = 5 if doc["overtime_hours"] < 20 else (3 if doc["overtime_hours"] < 40 else 2)
            s_doc = {
                "id": str(uuid.uuid4()),
                "employee_id": doc["id"],
                "work_life_balance": max(1, min(5, base_sat + random.randint(-1, 1))),
                "salary_satisfaction": max(1, min(5, base_sat + random.randint(-1, 1))),
                "career_growth": max(1, min(5, base_sat + random.randint(-1, 1))),
                "manager_support": max(1, min(5, base_sat + random.randint(-1, 1))),
                "overall_satisfaction": max(1, min(5, base_sat + random.randint(-1, 1))),
                "comments": "",
                "created_at": iso(now_utc() - timedelta(days=random.randint(1, 25))),
            }
            s_doc["average"] = round((s_doc["work_life_balance"] + s_doc["salary_satisfaction"] + s_doc["career_growth"]
                                     + s_doc["manager_support"] + s_doc["overall_satisfaction"]) / 5, 2)
            await db.surveys.insert_one(s_doc)

            # Leaves
            for _ in range(random.randint(1, 4) if doc["overtime_hours"] > 30 else random.randint(0, 2)):
                start = now_utc().date() - timedelta(days=random.randint(10, 90))
                end = start + timedelta(days=random.randint(1, 3))
                await db.leaves.insert_one({
                    "id": str(uuid.uuid4()),
                    "employee_id": doc["id"],
                    "leave_type": random.choice(["SICK", "CASUAL", "ANNUAL"]),
                    "start_date": start.strftime("%Y-%m-%d"),
                    "end_date": end.strftime("%Y-%m-%d"),
                    "reason": "Personal",
                    "status": "APPROVED",
                    "applied_by": doc["id"],
                    "created_at": iso(now_utc() - timedelta(days=random.randint(5, 60))),
                })

        # Compute initial churn for all
        for e in await db.employees.find({}).to_list(100):
            await compute_employee_churn(e["id"])
        log.info("Seeded employees, attendance, performance, surveys, leaves, churn")


# ============ Lifecycle ============
@app.on_event("startup")
async def on_start():
    try:
        await seed_data()
    except Exception as e:
        log.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_stop():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
