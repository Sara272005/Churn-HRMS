import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function Performance() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN";
  const [emps, setEmps] = useState([]);
  const [selected, setSelected] = useState("");
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 4, period: "2025-Q4", review: "", reviewer: "" });

  useEffect(() => { api.get("/employees", { params: { page_size: 100 } }).then((r) => { setEmps(r.data.items); if (r.data.items[0]) setSelected(r.data.items[0].id); }); }, []);
  useEffect(() => { if (selected) api.get(`/performance/${selected}`).then((r) => setReviews(r.data)); }, [selected]);

  const add = async () => {
    await api.post("/performance", { ...form, rating: Number(form.rating), employee_id: selected });
    toast.success("Review added");
    const r = await api.get(`/performance/${selected}`);
    setReviews(r.data);
  };

  return (
    <div className="space-y-6" data-testid="page-performance">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Reviews</div>
        <h1 className="font-display font-black text-4xl tracking-tight mt-1">Performance</h1>
      </div>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs font-semibold">Employee</Label>
            <select data-testid="perf-employee-select" value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs font-semibold">Period</Label>
            <Input data-testid="perf-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div>
          <div><Label className="text-xs font-semibold">Rating (1-5)</Label>
            <Input data-testid="perf-rating" type="number" min={1} max={5} step={0.1} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
          <div className="md:col-span-2"><Label className="text-xs font-semibold">Notes</Label>
            <Input data-testid="perf-review" value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} /></div>
          {isAdmin && <Button data-testid="add-perf-btn" onClick={add} className="md:col-span-5 w-fit">Add review</Button>}
        </CardContent>
      </Card>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5">
          <div className="font-display font-bold text-lg mb-3">History</div>
          <div className="space-y-2">
            {reviews.length === 0 && <div className="text-sm text-muted-foreground">No reviews yet.</div>}
            {reviews.map((p) => (
              <div key={p.id} data-testid={`perf-row-${p.id}`} className="border border-border/60 rounded-md p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.period}</div>
                  <div className="text-xs text-muted-foreground">{p.review}</div>
                </div>
                <div className="font-mono font-bold">★ {p.rating}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
