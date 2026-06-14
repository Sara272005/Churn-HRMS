import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const STATUS = ["PRESENT", "WFH", "LATE", "ABSENT"];

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN";
  const [emps, setEmps] = useState([]);
  const [selected, setSelected] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("PRESENT");
  const [history, setHistory] = useState({ items: [], percentage: 0, total: 0 });

  useEffect(() => { api.get("/employees", { params: { page_size: 100 } }).then((r) => { setEmps(r.data.items); if (r.data.items[0]) setSelected(r.data.items[0].id); }); }, []);
  useEffect(() => { if (selected) api.get(`/attendance/${selected}`).then((r) => setHistory(r.data)); }, [selected]);

  const mark = async () => {
    await api.post("/attendance", { employee_id: selected, date, status });
    toast.success("Attendance marked");
    const r = await api.get(`/attendance/${selected}`);
    setHistory(r.data);
  };

  return (
    <div className="space-y-6" data-testid="page-attendance">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Time & Presence</div>
        <h1 className="font-display font-black text-4xl tracking-tight mt-1">Attendance</h1>
      </div>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Employee</div>
            <select data-testid="attendance-employee-select" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Date</div>
            <input data-testid="attendance-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Status</div>
            <select data-testid="attendance-status-select" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {isAdmin && <Button data-testid="mark-attendance-btn" onClick={mark}>Mark</Button>}
        </CardContent>
      </Card>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-end justify-between">
            <div className="font-display font-bold text-lg">History · {history.percentage}% rate</div>
            <div className="text-xs text-muted-foreground font-mono">{history.total} records</div>
          </div>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
            {history.items.slice(0, 60).map((a) => (
              <div key={a.id} data-testid={`attendance-cell-${a.id}`} className={`border border-border/60 rounded-md p-2 text-center ${a.status === "ABSENT" ? "risk-high" : a.status === "LATE" ? "risk-medium" : "risk-low"}`}>
                <div className="font-mono text-xs">{a.date.slice(5)}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold mt-0.5">{a.status}</div>
              </div>
            ))}
            {history.items.length === 0 && <div className="text-muted-foreground col-span-6">No attendance records.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
