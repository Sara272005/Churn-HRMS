import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@churnhr.com");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email.trim().toLowerCase(), password);
    setBusy(false);
    if (ok) { toast.success("Welcome back"); navigate("/"); }
    else toast.error("Login failed");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative overflow-hidden border-r border-border/60">
        <img
          src="https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85"
          alt=""
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="font-mono text-xs tracking-[0.3em] uppercase opacity-80">Retention Console</div>
          <h1 className="font-display font-black text-5xl xl:text-6xl mt-3 leading-[0.95]">
            See attrition<br />before it happens.
          </h1>
          <p className="mt-4 max-w-md text-white/80 text-sm">
            A rule-based churn engine that scores every employee on attendance, performance, overtime and satisfaction — and tells you exactly what to do next.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-xl leading-none">ChurnHR</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Sign in to console</div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input id="email" data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input id="password" data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" required />
            </div>
            {error && <div className="text-sm text-destructive" data-testid="login-error">{error}</div>}
            <Button data-testid="login-submit-btn" type="submit" disabled={busy} className="w-full gap-2">
              {busy ? "Signing in…" : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <div className="mt-8 text-xs text-muted-foreground">
            Demo accounts:
            <div className="mt-2 grid gap-1 font-mono">
              <div>admin@churnhr.com / admin123</div>
              <div>employee@churnhr.com / employee123</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            No account? <Link to="/register" className="font-semibold text-foreground underline" data-testid="link-to-register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
