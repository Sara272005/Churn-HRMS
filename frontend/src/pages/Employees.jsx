import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const emptyForm = { name: "", email: "", department: "", position: "", salary: 0, overtime_hours: 0, join_date: "", avatar: "", status: "ACTIVE" };

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN";
  const [data, setData] = useState({ items: [], total: 0 });
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("ALL");
  const [statusF, setStatusF] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const { data } = await api.get("/employees", { params: { q, department: dept, status: statusF, page, page_size: pageSize } });
    setData(data);
  };

  useEffect(() => { load(); }, [q, dept, statusF, page]); // eslint-disable-line
  useEffect(() => { api.get("/departments").then((r) => setDepartments(r.data)); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (emp) => { setEditing(emp); setForm({ ...emptyForm, ...emp }); setOpen(true); };

  const save = async () => {
    try {
      const body = { ...form, salary: Number(form.salary), overtime_hours: Number(form.overtime_hours) };
      if (editing) await api.put(`/employees/${editing.id}`, body);
      else await api.post("/employees", body);
      toast.success(editing ? "Employee updated" : "Employee added");
      setOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const remove = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}?`)) return;
    await api.delete(`/employees/${emp.id}`);
    toast.success("Employee removed");
    load();
  };

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div className="space-y-6" data-testid="page-employees">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Directory</div>
          <h1 className="font-display font-black text-4xl tracking-tight mt-1">Employees</h1>
        </div>
        {isAdmin && (
          <Button data-testid="add-employee-btn" onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Employee</Button>
        )}
      </div>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input data-testid="employee-search" placeholder="Search by name, email, position…" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            </div>
            <select data-testid="employee-dept-filter" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} className="h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              <option value="ALL">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select data-testid="employee-status-filter" value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }} className="h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="mt-4 border-t border-border/60 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground font-mono">
                <tr className="border-b border-border/60">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Position</th>
                  <th className="py-3 pr-4 text-right">Salary</th>
                  <th className="py-3 pr-4 text-right">Overtime (h)</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id} className="border-b border-border/40 hover:bg-secondary/40 transition-all" data-testid={`employee-row-${e.id}`}>
                    <td className="py-3 pr-4">
                      <Link to={`/employees/${e.id}`} className="flex items-center gap-3 hover:underline">
                        {e.avatar ? <img src={e.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /> :
                          <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center text-xs font-bold">{e.name?.[0]}</div>}
                        <div>
                          <div className="font-semibold">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{e.department}</td>
                    <td className="py-3 pr-4">{e.position}</td>
                    <td className="py-3 pr-4 text-right font-mono">${Number(e.salary).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right font-mono">{e.overtime_hours}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === "ACTIVE" ? "risk-low" : "bg-secondary"}`}>{e.status}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {isAdmin && (
                        <div className="flex gap-1 justify-end">
                          <Button data-testid={`edit-employee-${e.id}`} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button data-testid={`delete-employee-${e.id}`} variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="text-muted-foreground">{data.total} total · page {page} / {totalPages}</div>
            <div className="flex gap-2">
              <Button data-testid="prev-page" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button data-testid="next-page" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="employee-form-dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit employee" : "Add employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["name", "Name"],
              ["email", "Email"],
              ["department", "Department"],
              ["position", "Position"],
              ["salary", "Salary", "number"],
              ["overtime_hours", "Overtime hours/mo", "number"],
              ["join_date", "Join date", "date"],
              ["avatar", "Avatar URL"],
            ].map(([key, label, type]) => (
              <div key={key} className={key === "avatar" ? "col-span-2" : ""}>
                <Label className="font-semibold text-xs">{label}</Label>
                <Input data-testid={`field-${key}`} type={type || "text"} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
              </div>
            ))}
            <div>
              <Label className="font-semibold text-xs">Status</Label>
              <select data-testid="field-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="employee-form-save" onClick={save}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
