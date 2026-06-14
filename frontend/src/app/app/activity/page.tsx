import { ContractStatusBadge } from "@/components/contract-status-badge";

const EVENTS = [
  { ts: "2 min ago", event: "MilestoneReleased", escrow: "0xA3F2…91dE", detail: "Milestone 1" },
  { ts: "14 min ago", event: "MilestoneApproved", escrow: "0xA3F2…91dE", detail: "Milestone 1" },
  { ts: "1 hr ago", event: "MilestoneSubmitted", escrow: "0xA3F2…91dE", detail: "Milestone 1" },
  { ts: "3 hr ago", event: "EscrowDeposited", escrow: "0xC18B…7720", detail: "—" },
  { ts: "1 day ago", event: "EscrowCreated", escrow: "0xC18B…7720", detail: "3 milestones" },
];

export default function Activity() {
  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            History
          </div>
          <h1 className="font-display mt-2 text-3xl font-medium">Activity</h1>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="divide-y divide-border">
            {EVENTS.map((e, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">
                  {e.ts}
                </span>
                <span className="flex-1 font-mono text-xs">{e.event}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {e.escrow}
                </span>
                <span className="text-xs text-muted-foreground">{e.detail}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {/* TODO: replace with live event log via viem getLogs */}
              Showing last 5 events. Wire to on-chain EscrowCreated / Milestone* events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
