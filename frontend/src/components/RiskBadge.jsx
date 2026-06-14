import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map = {
  HIGH: { label: "High Risk", cls: "risk-high" },
  MEDIUM: { label: "Medium Risk", cls: "risk-medium" },
  LOW: { label: "Low Risk", cls: "risk-low" },
};

export default function RiskBadge({ risk, score, className }) {
  const m = map[risk] || map.LOW;
  return (
    <span
      data-testid={`risk-badge-${risk}`}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase",
        m.cls,
        risk === "HIGH" && "pulse-ring",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {m.label}
      {typeof score === "number" && <span className="font-mono opacity-80">{score}</span>}
    </span>
  );
}
