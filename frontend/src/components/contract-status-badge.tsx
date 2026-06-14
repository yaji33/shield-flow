import { cn } from "@/lib/utils";

type Variant = "active" | "pending" | "completed" | "disputed";

const styles: Record<Variant, string> = {
  active: "border-border-strong text-foreground",
  pending: "border-amber-500/40 text-amber-200/80",
  completed: "border-border text-muted-foreground",
  disputed: "border-destructive/60 text-destructive",
};

const labels: Record<Variant, string> = {
  active: "Active",
  pending: "Pending",
  completed: "Completed",
  disputed: "Disputed",
};

export function ContractStatusBadge({
  variant = "active",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        styles[variant],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {labels[variant]}
    </span>
  );
}
