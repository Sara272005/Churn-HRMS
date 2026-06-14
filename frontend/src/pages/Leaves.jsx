import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const TYPES = ["SICK", "CASUAL", "ANNUAL", "UNPAID"];

export default function Leaves() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN";
  const [emps, setEmps] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", leave_type: "CASUAL", start_date: "", end_date: "", reason: "" });

  const load = async () => {
    const r = await api.get("/leaves");
    setLeaves(r.data);
  };
  useEffect(() => { load(); api.get("/employees", { params: { page_size: 100 } }).then((r) => { setEmps(r.data.items); if (r.data.items[0]) setForm((f) => ({ ...f, employee_id: r.data.items[0].id })); }); }, []);

  const apply = async () => {
    await api.post("/leaves", form);
    setOpen(false);
    toast.success("Leave applied");
    load();
  };

  const decide = async (id, status) => {
    await api.post(`/leaves/${id}/decision`, { status, note: "" });
    toast.success(`Leave ${status.toLowerCase()}`);
    load();
  };

  return (
    <div className="space-y-6" data-testid="page-leaves">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Time Off</div>
          <h1 className="font-display font-black text-4xl tracking-tight mt-1">Leave Management</h1>
        </div>
        <Button data-testid="apply-leave-btn" onClick={() => setOpen(true)}>Apply Leave</Button>
      </div>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              <tr className="border-b border-border/60 text-left">
                <th className="py-3 pr-4">Employee</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Range</th>
                <th className="py-3 pr-4">Reason</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => {
                const emp = emps.find((e) => e.id === l.employee_id);
                return (
                  <tr key={l.id} className="border-b border-border/40" data-testid={`leave-row-${l.id}`}>
                    <td className="py-3 pr-4 font-semibold">{emp?.name || l.employee_id.slice(0, 6)}</td>
                    <td className="py-3 pr-4 font-mono uppercase text-xs">{l.leave_type}</td>
                    <td className="py-3 pr-4 font-mono">{l.start_date} → {l.end_date}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{l.reason}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "APPROVED" ? "risk-low" : l.status === "REJECTED" ? "risk-high" : "risk-medium"}`}>{l.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {isAdmin && l.status === "PENDING" && (
                        <div className="flex gap-1 justify-end">
                          <Button data-testid={`approve-leave-${l.id}`} size="sm" variant="outline" onClick={() => decide(l.id, "APPROVED")}>Approve</Button>
                          <Button data-testid={`reject-leave-${l.id}`} size="sm" variant="outline" onClick={() => decide(l.id, "REJECTED")}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leaves.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No leave requests.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="leave-dialog">
          <DialogHeader><DialogTitle className="font-display">Apply leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Employee</Label>
              <select data-testid="leave-emp-select" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Type</Label>
              <select data-testid="leave-type-select" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs font-semibold">Start</Label>
                <Input data-testid="leave-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-xs font-semibold">End</Label>
                <Input data-testid="leave-end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs font-semibold">Reason</Label>
              <Input data-testid="leave-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button data-testid="leave-submit" onClick={apply}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
