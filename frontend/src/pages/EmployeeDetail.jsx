import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/RiskBadge";
import { ArrowLeft, RefreshCw, TrendingUp, Calendar, Briefcase, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeDetail() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [churn, setChurn] = useState(null);
  const [attendance, setAttendance] = useState({ items: [], total: 0, percentage: 0 });
  const [perf, setPerf] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const load = async () => {
    const [e, c, a, p, s, l] = await Promise.all([
      api.get(`/employees/${id}`),
      api.get(`/churn/${id}`),
      api.get(`/attendance/${id}`),
      api.get(`/performance/${id}`),
      api.get(`/surveys/${id}`),
      api.get(`/leaves`, { params: { employee_id: id } }),
    ]);
    setEmp(e.data); setChurn(c.data); setAttendance(a.data); setPerf(p.data); setSurveys(s.data); setLeaves(l.data);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (!emp || !churn) return <div className="text-muted-foreground" data-testid="emp-detail-loading">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="page-employee-detail">
      <div className="flex items-center justify-between">
        <Link to="/employees" className="text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="back-to-employees">
          <ArrowLeft className="w-3 h-3" /> Back to directory
        </Link>
        <Button data-testid="recompute-emp-churn" variant="outline" size="sm" className="gap-2" onClick={async () => { await load(); toast.success("Refreshed"); }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-md border-border/60 shadow-none lg:col-span-1">
          <CardContent className="p-5 text-center">
            {emp.avatar ? <img src={emp.avatar} alt="" className="w-24 h-24 rounded-full object-cover mx-auto" />
              : <div className="w-24 h-24 rounded-full bg-secondary grid place-items-center mx-auto text-2xl font-bold">{emp.name?.[0]}</div>}
            <div className="font-display font-bold text-2xl mt-3">{emp.name}</div>
            <div className="text-sm text-muted-foreground">{emp.position} · {emp.department}</div>
            <div className="text-xs font-mono mt-1">{emp.email}</div>
            <div className="mt-4 flex justify-center"><RiskBadge risk={churn.risk} score={churn.score} /></div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none lg:col-span-2">
          <CardContent className="p-5">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Churn Diagnostic</div>
            <h2 className="font-display font-bold text-2xl mt-1">Score {churn.score} <span className="text-base text-muted-foreground">/ 100</span></h2>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full transition-all"
                style={{ width: `${churn.score}%`, background: churn.risk === "HIGH" ? "#FF3B30" : churn.risk === "MEDIUM" ? "#FFCC00" : "#34C759" }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 text-center">
              {[
                ["Attendance", `${churn.metrics.attendance_pct}%`, Calendar],
                ["Leaves", churn.metrics.leave_freq, Briefcase],
                ["Performance", churn.metrics.performance, Star],
                ["Overtime", `${churn.metrics.overtime_hours}h`, TrendingUp],
                ["Satisfaction", churn.metrics.satisfaction_avg, MessageSquare],
              ].map(([label, v, Ic]) => (
                <div key={label} className="border border-border/60 rounded-md py-3 px-2">
                  <Ic className="w-4 h-4 mx-auto text-muted-foreground" />
                  <div className="font-mono font-bold text-lg mt-1">{v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Risk Factors</div>
                <ul className="space-y-1 text-sm">
                  {churn.factors.length === 0 && <li className="text-muted-foreground">None — employee in stable zone.</li>}
                  {churn.factors.map((f, i) => <li key={i} className="px-3 py-1.5 risk-medium rounded-md text-xs">⚠ {f}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Retention Recommendations</div>
                <ul className="space-y-1 text-sm" data-testid="recommendations-list">
                  {churn.recommendations.map((r, i) => <li key={i} className="px-3 py-1.5 risk-low rounded-md text-xs">→ {r}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-md border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Recent Attendance</div>
            <div className="text-xs text-muted-foreground">Last {attendance.total} records · {attendance.percentage}% rate</div>
            <div className="mt-3 max-h-64 overflow-auto text-sm">
              {attendance.items.slice(0, 30).map((a) => (
                <div key={a.id} className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="font-mono">{a.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "ABSENT" ? "risk-high" : a.status === "LATE" ? "risk-medium" : "risk-low"}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Performance History</div>
            <div className="mt-3 text-sm space-y-2">
              {perf.length === 0 && <div className="text-muted-foreground">No reviews yet.</div>}
              {perf.map((p) => (
                <div key={p.id} className="border border-border/60 rounded-md p-3">
                  <div className="flex justify-between">
                    <div className="font-semibold">{p.period}</div>
                    <div className="font-mono">★ {p.rating}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{p.review}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-md border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Latest Survey</div>
            {surveys.length === 0 ? <div className="text-sm text-muted-foreground mt-2">No survey yet.</div> : (
              <div className="mt-3 space-y-2 text-sm">
                {Object.entries({
                  "Work-Life Balance": surveys[0].work_life_balance,
                  "Salary Satisfaction": surveys[0].salary_satisfaction,
                  "Career Growth": surveys[0].career_growth,
                  "Manager Support": surveys[0].manager_support,
                  "Overall Satisfaction": surveys[0].overall_satisfaction,
                }).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span>{k}</span>
                    <span className="font-mono font-bold">{v}/5</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2 mt-2 flex justify-between font-semibold">
                  <span>Average</span><span className="font-mono">{surveys[0].average}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Leave History</div>
            <div className="mt-3 text-sm space-y-2 max-h-64 overflow-auto">
              {leaves.length === 0 && <div className="text-muted-foreground">No leaves recorded.</div>}
              {leaves.map((l) => (
                <div key={l.id} className="flex justify-between border-b border-border/40 py-1.5">
                  <div>
                    <div className="font-semibold">{l.leave_type}</div>
                    <div className="text-xs text-muted-foreground font-mono">{l.start_date} → {l.end_date}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full self-start ${l.status === "APPROVED" ? "risk-low" : l.status === "REJECTED" ? "risk-high" : "risk-medium"}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
