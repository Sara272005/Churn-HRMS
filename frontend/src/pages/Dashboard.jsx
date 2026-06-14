import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import RiskBadge from "@/components/RiskBadge";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { Users, UserCheck, AlertTriangle, Smile, ArrowUpRight } from "lucide-react";

const RISK_COLORS = { LOW: "#34C759", MEDIUM: "#FFCC00", HIGH: "#FF3B30" };

function Stat({ label, value, sub, icon: Icon, tone, testid }) {
  return (
    <Card className="rounded-md border-border/60 shadow-none" data-testid={testid}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
            <div className="font-display text-4xl font-bold mt-2">{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
          </div>
          <div className={`p-2 rounded-md ${tone === "high" ? "risk-high" : tone === "low" ? "risk-low" : "bg-secondary"}`}>
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  const load = () => api.get("/dashboard/summary").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    await api.post("/churn/recompute-all").catch(() => {});
    await load();
  };

  if (!data) return <div className="text-muted-foreground" data-testid="dashboard-loading">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Retention Console</div>
          <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mt-1">Workforce Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time churn risk, attendance, performance and satisfaction signals.</p>
        </div>
        <button data-testid="recompute-btn" onClick={recompute} className="text-xs font-mono uppercase tracking-wider border border-border px-3 py-2 rounded-md hover:bg-secondary transition-all">
          Recompute Churn
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Employees" value={data.total_employees} icon={Users} testid="stat-total-employees" />
        <Stat label="Active" value={data.active_employees} icon={UserCheck} tone="low" testid="stat-active-employees" />
        <Stat label="High Risk" value={data.high_risk_count} icon={AlertTriangle} tone="high" sub="Needs intervention" testid="stat-high-risk" />
        <Stat label="Avg Satisfaction" value={data.avg_satisfaction.toFixed(2)} icon={Smile} sub="out of 5" testid="stat-avg-satisfaction" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-md border-border/60 shadow-none lg:col-span-1" data-testid="chart-risk-distribution">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Churn Risk Distribution</div>
            <div className="text-xs text-muted-foreground mb-2">Across active workforce</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.risk_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {data.risk_distribution.map((s) => <Cell key={s.key} fill={RISK_COLORS[s.key]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none lg:col-span-2" data-testid="chart-department">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Department Distribution</div>
            <div className="text-xs text-muted-foreground mb-2">Active employees per department</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.department_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-md border-border/60 shadow-none" data-testid="chart-attendance">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Attendance Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.attendance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#007AFF" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none" data-testid="chart-performance">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Performance Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.performance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#34C759" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/60 shadow-none" data-testid="chart-satisfaction">
          <CardContent className="p-5">
            <div className="font-display font-bold text-lg">Satisfaction Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.satisfaction_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#FFCC00" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-border/60 shadow-none" data-testid="high-risk-panel">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-lg">High-Risk Employees</div>
              <div className="text-xs text-muted-foreground">Immediate retention attention</div>
            </div>
            <Link to="/employees?filter=HIGH" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="view-all-high-risk">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.high_risk_employees.length === 0 && (
              <div className="text-sm text-muted-foreground col-span-3">No high-risk employees right now. Nice work!</div>
            )}
            {data.high_risk_employees.map((e) => (
              <Link to={`/employees/${e.id}`} key={e.id} className="flex items-center justify-between gap-3 px-3 py-3 border border-border/60 rounded-md hover:bg-secondary/50 transition-all" data-testid={`high-risk-card-${e.id}`}>
                <div className="flex items-center gap-3">
                  {e.avatar ? <img src={e.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> :
                    <div className="w-9 h-9 rounded-full bg-secondary grid place-items-center text-xs font-bold">{e.name?.[0]}</div>}
                  <div>
                    <div className="font-semibold text-sm">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.department}</div>
                  </div>
                </div>
                <RiskBadge risk="HIGH" score={e.score} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
