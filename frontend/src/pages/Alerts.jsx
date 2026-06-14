import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [emps, setEmps] = useState({});
  const [filter, setFilter] = useState(false);

  const load = async () => {
    const r = await api.get("/alerts", { params: { unread_only: filter } });
    setAlerts(r.data);
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line
  useEffect(() => { api.get("/employees", { params: { page_size: 100 } }).then((r) => { const m = {}; r.data.items.forEach((e) => (m[e.id] = e)); setEmps(m); }); }, []);

  const markRead = async (id) => {
    await api.post(`/alerts/${id}/read`);
    load();
  };

  return (
    <div className="space-y-6" data-testid="page-alerts">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Signals</div>
          <h1 className="font-display font-black text-4xl tracking-tight mt-1">Alerts</h1>
        </div>
        <Button data-testid="toggle-unread-filter" variant="outline" onClick={() => setFilter((f) => !f)} className="gap-2">
          {filter ? <><Bell className="w-4 h-4" /> Showing unread</> : <><BellOff className="w-4 h-4" /> Showing all</>}
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && <div className="text-sm text-muted-foreground">No alerts.</div>}
        {alerts.map((a) => {
          const emp = emps[a.employee_id];
          const tone = a.severity === "HIGH" ? "risk-high" : a.severity === "MEDIUM" ? "risk-medium" : "risk-low";
          return (
            <Card key={a.id} className={`rounded-md border-border/60 shadow-none ${!a.read ? "border-l-4" : ""} ${a.severity === "HIGH" ? "border-l-[hsl(var(--risk-high))]" : ""}`} data-testid={`alert-${a.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${tone}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{a.type.replace(/_/g, " ")}</div>
                    <div className="font-semibold">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {emp && <Link to={`/employees/${emp.id}`} className="text-xs underline" data-testid={`alert-view-${a.id}`}>View profile</Link>}
                  {!a.read && <Button data-testid={`alert-read-${a.id}`} size="sm" variant="outline" onClick={() => markRead(a.id)}>Mark read</Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
