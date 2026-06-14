import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { user, register, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await register(form.email.trim().toLowerCase(), form.password, form.name, form.role);
    setBusy(false);
    if (ok) { toast.success("Account created"); navigate("/"); }
    else toast.error("Registration failed");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative overflow-hidden border-r border-border/60">
        <img src="https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85" alt="" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h1 className="font-display font-black text-5xl xl:text-6xl leading-[0.95]">Join the<br />Retention Console.</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground grid place-items-center"><Activity className="w-4 h-4" /></div>
            <div className="font-display font-bold text-xl">ChurnHR</div>
          </div>
          <form onSubmit={submit} className="space-y-4" data-testid="register-form">
            <div><Label className="font-semibold">Full name</Label>
              <Input data-testid="register-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" required /></div>
            <div><Label className="font-semibold">Email</Label>
              <Input data-testid="register-email-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" required /></div>
            <div><Label className="font-semibold">Password</Label>
              <Input data-testid="register-password-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5" required minLength={6} /></div>
            <div><Label className="font-semibold">Role</Label>
              <select data-testid="register-role-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="EMPLOYEE">Employee</option>
                <option value="HR_ADMIN">HR Admin</option>
              </select></div>
            {error && <div className="text-sm text-destructive" data-testid="register-error">{error}</div>}
            <Button data-testid="register-submit-btn" type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
          </form>
          <div className="mt-6 text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-semibold text-foreground underline" data-testid="link-to-login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
