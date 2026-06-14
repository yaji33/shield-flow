"use client";

import { use } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkBadge02Icon,
  CircleLock02Icon,
} from "@hugeicons/core-free-icons";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import {
  useGetEscrow,
  useReleaseMilestone,
  useApproveMilestone,
  EscrowStatus,
  MilestoneStatus,
} from "@/lib/hooks/use-escrow";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<number, string> = {
  [MilestoneStatus.Pending]: "Pending",
  [MilestoneStatus.InProgress]: "In Progress",
  [MilestoneStatus.Approved]: "Approved",
  [MilestoneStatus.Released]: "Released",
  [MilestoneStatus.Disputed]: "Disputed",
};

const ESCROW_VARIANT: Record<number, "active" | "pending" | "completed" | "disputed"> = {
  [EscrowStatus.Pending]: "pending",
  [EscrowStatus.Active]: "active",
  [EscrowStatus.Completed]: "completed",
  [EscrowStatus.Disputed]: "disputed",
  [EscrowStatus.Cancelled]: "pending",
};

function MilestoneCard({
  escrowId,
  index,
  totalMilestones,
}: {
  escrowId: bigint;
  index: number;
  totalMilestones: number;
}) {
  const { releaseMilestone, isPending: isReleasing } = useReleaseMilestone();
  const { approveMilestone, isPending: isApproving } = useApproveMilestone();

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
        <HugeiconsIcon icon={CircleLock02Icon} size={14} strokeWidth={1.5} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            Milestone {index + 1} of {totalMilestones}
          </span>
          <EncryptedValue size="sm" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {/* TODO: display deadline from getMilestone(escrowId, index) */}
          Deadline: —
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => approveMilestone(escrowId, index)}
          disabled={isApproving}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40"
        >
          {isApproving ? "…" : "Approve"}
        </button>
        <button
          onClick={() => releaseMilestone(escrowId, index)}
          disabled={isReleasing}
          className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isReleasing ? "…" : "Release"}
          <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function ContractDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const numericId =
    /^\d+$/.test(id) ? BigInt(id) : undefined;

  const { data: escrowInfo, isLoading } = useGetEscrow(numericId);

  const statusNum = escrowInfo ? Number(escrowInfo[3]) : undefined;
  const milestoneCount = escrowInfo ? Number(escrowInfo[5]) : 0;

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/app/contracts"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.5} />
          </Link>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Contract
            </div>
            <h1 className="font-display mt-1 font-mono text-xl font-medium">
              {id}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : escrowInfo ? (
          <>
            <div className="mb-6 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                  {statusNum !== undefined && (
                    <ContractStatusBadge variant={ESCROW_VARIANT[statusNum] ?? "pending"} />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Milestone {milestoneCount > 0 ? 1 : 0} of {milestoneCount}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Escrowed
                  </div>
                  {/* TODO: display decrypted value via fhEVM SDK getTotalDeposit */}
                  <EncryptedValue size="md" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Released
                  </div>
                  {/* TODO: display decrypted value via fhEVM SDK getReleasedAmount */}
                  <EncryptedValue size="md" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Contractor
                  </div>
                  <div className="font-mono text-sm text-foreground break-all">
                    {escrowInfo[1]
                      ? `${(escrowInfo[1] as string).slice(0, 6)}…${(escrowInfo[1] as string).slice(-4)}`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
            {milestoneCount > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Milestones
                </h2>
                {Array.from({ length: milestoneCount }, (_, i) => (
                  <MilestoneCard
                    key={i}
                    escrowId={numericId!}
                    index={i}
                    totalMilestones={milestoneCount}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                  <ContractStatusBadge variant="active" />
                </div>
                <span className="text-xs text-muted-foreground">Milestone 2 of 4</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Escrowed
                  </div>
                  <EncryptedValue value="48,000.00" size="md" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Released
                  </div>
                  <EncryptedValue value="12,000.00" size="md" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Counterparty
                  </div>
                  <div className="font-mono text-sm text-foreground">0x71C…b04A</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Milestones
              </h2>
              {[
                { label: "Design Sign-off", status: MilestoneStatus.Released },
                { label: "Development Phase 1", status: MilestoneStatus.Approved },
                { label: "Development Phase 2", status: MilestoneStatus.InProgress },
                { label: "Final Delivery", status: MilestoneStatus.Pending },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border",
                        m.status === MilestoneStatus.Released
                          ? "border-border-strong bg-background text-foreground"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      <HugeiconsIcon
                        icon={
                          m.status === MilestoneStatus.Released
                            ? CheckmarkBadge02Icon
                            : CircleLock02Icon
                        }
                        size={14}
                        strokeWidth={1.5}
                      />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {STATUS_LABEL[m.status]}
                      </div>
                    </div>
                  </div>
                  <EncryptedValue value="12,000.00" size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
