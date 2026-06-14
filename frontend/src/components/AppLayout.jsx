import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

export default function AppLayout() {
  const { user } = useAuth();
  if (user === null) return <div className="grid place-items-center h-screen text-muted-foreground" data-testid="layout-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-background min-h-screen text-foreground">
      <Sidebar />
      <main className="flex-1 max-w-[1600px] mx-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
