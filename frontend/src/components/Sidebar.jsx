import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, Plane, Star, ClipboardList, AlertTriangle, LogOut, Moon, Sun, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "sidebar-nav-dashboard" },
  { to: "/employees", label: "Employees", icon: Users, testId: "sidebar-nav-employees" },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, testId: "sidebar-nav-attendance" },
  { to: "/leaves", label: "Leaves", icon: Plane, testId: "sidebar-nav-leaves" },
  { to: "/performance", label: "Performance", icon: Star, testId: "sidebar-nav-performance" },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, testId: "sidebar-nav-surveys" },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle, testId: "sidebar-nav-alerts" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-border/60 bg-card flex flex-col" data-testid="sidebar">
      <div className="px-5 py-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">ChurnHR</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">Retention Console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            data-testid={item.testId}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4" strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs">
            <div className="font-semibold truncate max-w-[140px]" data-testid="sidebar-user-name">{user?.name}</div>
            <div className="text-muted-foreground font-mono text-[10px] uppercase">{user?.role}</div>
          </div>
          <Button data-testid="theme-toggle-btn" variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        <Button
          data-testid="logout-btn"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
