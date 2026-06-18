"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { useUserEscrows } from "@/lib/hooks/use-user-escrows";

export function ContractorEscrowsBanner() {
  const { data: escrows = [], isLoading } = useUserEscrows();

  const contractorEscrows = escrows.filter((e) => e.role === "contractor");
  const actionable = contractorEscrows.filter(
    (e) => e.status !== "Completed" && e.status !== "Cancelled",
  );

  if (isLoading || actionable.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-strong bg-surface px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <HugeiconsIcon icon={UserMultipleIcon} size={16} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              You&apos;re listed as contractor on {actionable.length} escrow
              {actionable.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              A client added your wallet. Open the escrow to submit milestones when
              work is ready.
            </p>
          </div>
        </div>
        <Link
          href="/app/contracts"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          View contracts
        </Link>
      </div>
    </div>
  );
}
