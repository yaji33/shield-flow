"use client";

import Link from "next/link";
import {
  formatRelativeTime,
  useUserEscrowActivity,
} from "@/lib/hooks/use-user-activity";

export default function Activity() {
  const { data: events = [], isLoading } = useUserEscrowActivity();

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
          {isLoading ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Loading activity from Sepolia…
            </p>
          ) : events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No activity yet for your escrows.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {events.map((event) => (
                <div
                  key={`${event.transactionHash}-${event.eventName}-${event.escrowId}`}
                  className="flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {event.timestamp
                      ? formatRelativeTime(event.timestamp)
                      : "—"}
                  </span>
                  <span className="min-w-[140px] flex-1 font-mono text-xs">
                    {event.eventName}
                  </span>
                  <Link
                    href={`/app/contracts/${event.escrowId}`}
                    className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    #{event.escrowId.toString()}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {event.detail}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              On-chain events for your escrows · polled every 15s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
