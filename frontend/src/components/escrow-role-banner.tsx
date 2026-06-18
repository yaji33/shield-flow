"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { shortAddress } from "@/lib/hooks/use-user-escrows";
import { EscrowStatus } from "@/lib/hooks/escrow-types";
import type { Address } from "viem";

export function EscrowRoleBanner({
  role,
  escrowId,
  clientAddress,
  status,
}: {
  role: "client" | "contractor" | "auditor" | "viewer";
  escrowId: bigint;
  clientAddress?: Address;
  status?: number;
}) {
  if (role === "contractor") {
    const awaitingFunding = status === EscrowStatus.Pending;

    return (
      <div className="mb-6 rounded-xl border border-border-strong bg-surface px-5 py-4">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <HugeiconsIcon icon={UserMultipleIcon} size={16} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              You&apos;ve been added as contractor
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {clientAddress
                ? `${shortAddress(clientAddress)} created escrow #${escrowId.toString()} with your wallet as the contractor.`
                : `Escrow #${escrowId.toString()} lists your wallet as the contractor.`}{" "}
              {awaitingFunding
                ? "It is awaiting the client deposit — check back once funded."
                : "Submit milestones here when work is ready for client approval."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (role === "client") {
    return null;
  }

  if (role === "auditor") {
    return (
      <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-4">
        <p className="text-xs text-muted-foreground">
          You have auditor access on escrow #{escrowId.toString()}.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-xs text-muted-foreground">
        You are viewing escrow #{escrowId.toString()}. Only the client or contractor can
        take actions.{" "}
        <Link href="/app/contracts" className="text-foreground hover:underline">
          View your escrows
        </Link>
      </p>
    </div>
  );
}
