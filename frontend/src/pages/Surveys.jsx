import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const QUESTIONS = [
  ["work_life_balance", "Work-Life Balance"],
  ["salary_satisfaction", "Salary Satisfaction"],
  ["career_growth", "Career Growth"],
  ["manager_support", "Manager Support"],
  ["overall_satisfaction", "Overall Satisfaction"],
];

export default function Surveys() {
  const [emps, setEmps] = useState([]);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState({ work_life_balance: 3, salary_satisfaction: 3, career_growth: 3, manager_support: 3, overall_satisfaction: 3, comments: "" });
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get("/employees", { params: { page_size: 100 } }).then((r) => { setEmps(r.data.items); if (r.data.items[0]) setSelected(r.data.items[0].id); }); }, []);
  useEffect(() => { if (selected) api.get(`/surveys/${selected}`).then((r) => setHistory(r.data)); }, [selected]);

  const submit = async () => {
    await api.post("/surveys", { ...answers, employee_id: selected });
    toast.success("Survey submitted");
    const r = await api.get(`/surveys/${selected}`);
    setHistory(r.data);
  };

  return (
    <div className="space-y-6" data-testid="page-surveys">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Voice of Employee</div>
        <h1 className="font-display font-black text-4xl tracking-tight mt-1">Satisfaction Survey</h1>
      </div>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5">
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Employee</div>
            <select data-testid="survey-emp-select" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full md:w-1/2 h-9 px-3 rounded-md border border-input bg-transparent text-sm">
              {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            {QUESTIONS.map(([k, label]) => (
              <div key={k} data-testid={`survey-q-${k}`}>
                <div className="flex justify-between mb-2">
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="font-mono">{answers[k]}/5</div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} data-testid={`survey-${k}-${n}`}
                      onClick={() => setAnswers({ ...answers, [k]: n })}
                      className={`flex-1 h-9 rounded-md border text-sm font-mono transition-all ${answers[k] === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div className="text-xs font-semibold mb-1">Comments</div>
              <textarea data-testid="survey-comments" value={answers.comments} onChange={(e) => setAnswers({ ...answers, comments: e.target.value })} className="w-full min-h-[80px] p-2 border border-input rounded-md bg-transparent text-sm" />
            </div>
            <Button data-testid="survey-submit" onClick={submit}>Submit Survey</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-border/60 shadow-none">
        <CardContent className="p-5">
          <div className="font-display font-bold text-lg mb-3">Past Submissions</div>
          {history.length === 0 ? <div className="text-sm text-muted-foreground">No surveys yet.</div> : (
            <div className="space-y-2">
              {history.map((s) => (
                <div key={s.id} className="border border-border/60 rounded-md p-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  <div><span className="text-muted-foreground">WLB</span> <b className="font-mono">{s.work_life_balance}</b></div>
                  <div><span className="text-muted-foreground">Salary</span> <b className="font-mono">{s.salary_satisfaction}</b></div>
                  <div><span className="text-muted-foreground">Growth</span> <b className="font-mono">{s.career_growth}</b></div>
                  <div><span className="text-muted-foreground">Mgr</span> <b className="font-mono">{s.manager_support}</b></div>
                  <div><span className="text-muted-foreground">Overall</span> <b className="font-mono">{s.overall_satisfaction}</b></div>
                  <div><span className="text-muted-foreground">Avg</span> <b className="font-mono">{s.average}</b></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
