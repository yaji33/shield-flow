"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CircleLock02Icon,
  CheckmarkBadge02Icon,
} from "@hugeicons/core-free-icons";
import { isAddressEqual, type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { EscrowRoleBanner } from "@/components/escrow-role-banner";
import { ShareEscrowLink } from "@/components/share-escrow-link";
import { FundEscrowForm } from "@/components/fund-escrow-form";
import { useWallet } from "@/lib/hooks/use-wallet";
import { shortAddress } from "@/lib/hooks/use-user-escrows";
import { getContractErrorMessage } from "@/lib/contract-errors";
import {
  useGetEscrow,
  useGetMilestone,
  useReleaseMilestone,
  useApproveMilestone,
  useSubmitMilestone,
  useWithdrawReleased,
  EscrowStatus,
  MilestoneStatus,
} from "@/lib/hooks/use-escrow";

const ESCROW_VARIANT: Record<
  number,
  "active" | "pending" | "completed" | "disputed"
> = {
  [EscrowStatus.Pending]: "pending",
  [EscrowStatus.Active]: "active",
  [EscrowStatus.Completed]: "completed",
  [EscrowStatus.Disputed]: "disputed",
  [EscrowStatus.Cancelled]: "pending",
};

type EscrowRole = "client" | "contractor" | "auditor" | "viewer";

function resolveRole(
  address: Address | undefined,
  client: Address,
  contractor: Address,
  auditor: Address,
): EscrowRole {
  if (!address) return "viewer";
  if (isAddressEqual(address, client)) return "client";
  if (isAddressEqual(address, contractor)) return "contractor";
  if (
    auditor !== "0x0000000000000000000000000000000000000000" &&
    isAddressEqual(address, auditor)
  ) {
    return "auditor";
  }
  return "viewer";
}

const MILESTONE_STATUS_LABEL: Record<number, string> = {
  [MilestoneStatus.Pending]: "Pending",
  [MilestoneStatus.InProgress]: "Submitted — awaiting approval",
  [MilestoneStatus.Approved]: "Approved — ready to release",
  [MilestoneStatus.Released]: "Released",
  [MilestoneStatus.Disputed]: "Disputed",
};

const MILESTONE_STATUS_COLOR: Record<number, string> = {
  [MilestoneStatus.Pending]: "text-muted-foreground",
  [MilestoneStatus.InProgress]: "text-amber-400",
  [MilestoneStatus.Approved]: "text-green-400",
  [MilestoneStatus.Released]: "text-muted-foreground",
  [MilestoneStatus.Disputed]: "text-destructive",
};

function MilestoneCard({
  escrowId,
  index,
  totalMilestones,
  role,
  escrowStatus,
  onRefetch,
}: {
  escrowId: bigint;
  index: number;
  totalMilestones: number;
  role: EscrowRole;
  escrowStatus: number;
  onRefetch: () => void;
}) {
  const { data: milestoneData, refetch: refetchMilestone } = useGetMilestone(
    escrowId,
    index,
  );
  const { releaseMilestone, isPending: isReleasing } = useReleaseMilestone();
  const { approveMilestone, isPending: isApproving } = useApproveMilestone();
  const { submitMilestone, isPending: isSubmitting } = useSubmitMilestone();
  const { withdrawReleased, isPending: isWithdrawing } = useWithdrawReleased();

  const isActive = escrowStatus === EscrowStatus.Active;

  // getMilestone outputs: [encryptedAmount, plainAmountWei, deadline, milestoneStatus, clientApproved, contractorSubmitted]
  const milestoneStatusNum =
    milestoneData !== undefined ? Number(milestoneData[3]) : undefined;
  const contractorSubmitted =
    milestoneData !== undefined ? Boolean(milestoneData[5]) : false;
  const plainAmountWei =
    milestoneData !== undefined ? (milestoneData[1] as bigint) : BigInt(0);

  const isReleased = milestoneStatusNum === MilestoneStatus.Released;
  const canSubmit =
    role === "contractor" && isActive && !contractorSubmitted && !isReleased;
  const canApprove =
    role === "client" &&
    isActive &&
    contractorSubmitted &&
    milestoneStatusNum !== MilestoneStatus.Approved &&
    milestoneStatusNum !== MilestoneStatus.Released;
  const canRelease =
    role === "client" && isActive && milestoneStatusNum === MilestoneStatus.Approved;
  const canWithdraw = role === "contractor" && isReleased && plainAmountWei > BigInt(0);

  const refetchAll = () => {
    void refetchMilestone();
    onRefetch();
  };

  const handleWithdraw = async () => {
    try {
      await withdrawReleased(escrowId);
      toast.success("ETH withdrawn to your wallet.");
      refetchAll();
    } catch (error) {
      toast.error(getContractErrorMessage(error));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitMilestone(escrowId, index);
      toast.success("Work submitted — waiting for client approval.");
      refetchAll();
    } catch (error) {
      toast.error(getContractErrorMessage(error));
    }
  };

  const handleApprove = async () => {
    try {
      await approveMilestone(escrowId, index);
      toast.success("Milestone approved — you can now release funds.");
      refetchAll();
    } catch (error) {
      toast.error(getContractErrorMessage(error));
    }
  };

  const handleRelease = async () => {
    try {
      await releaseMilestone(escrowId, index);
      toast.success("Milestone released.");
      refetchAll();
    } catch (error) {
      toast.error(getContractErrorMessage(error));
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
        {isReleased ? (
          <HugeiconsIcon
            icon={CheckmarkBadge02Icon}
            size={14}
            strokeWidth={1.5}
          />
        ) : (
          <HugeiconsIcon icon={CircleLock02Icon} size={14} strokeWidth={1.5} />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Milestone {index + 1} of {totalMilestones}
          </span>
          {milestoneStatusNum !== undefined &&
            milestoneStatusNum !== MilestoneStatus.Pending && (
              <span
                className={`text-xs ${MILESTONE_STATUS_COLOR[milestoneStatusNum] ?? "text-muted-foreground"}`}
              >
                · {MILESTONE_STATUS_LABEL[milestoneStatusNum]}
              </span>
            )}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Deadline: —</p>
          <EncryptedValue size="sm" interactive={false} />
        </div>
        {role === "contractor" && !isActive && (
          <p className="mt-2 text-xs text-muted-foreground">
            Available after the client funds this escrow.
          </p>
        )}
        {role === "contractor" && isActive && contractorSubmitted && !isReleased && (
          <p className="mt-2 text-xs text-amber-400/80">
            Work submitted — waiting for client to approve.
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40"
          >
            {isApproving ? "…" : "Approve"}
          </button>
        )}
        {canRelease && (
          <button
            onClick={handleRelease}
            disabled={isReleasing}
            className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isReleasing ? "…" : "Release"}
            <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
          </button>
        )}
        {canSubmit && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting ? "…" : "Submit work"}
            <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isWithdrawing ? "…" : "Withdraw ETH"}
            <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
          </button>
        )}
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
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const numericId = /^\d+$/.test(id) ? BigInt(id) : undefined;
  const {
    data: escrowInfo,
    isLoading,
    refetch,
  } = useGetEscrow(numericId);

  const client = escrowInfo?.[0] as Address | undefined;
  const contractor = escrowInfo?.[1] as Address | undefined;
  const auditor = escrowInfo?.[2] as Address | undefined;
  const statusNum = escrowInfo ? Number(escrowInfo[3]) : undefined;
  const milestoneCount = escrowInfo ? Number(escrowInfo[5]) : 0;

  const role =
    client && contractor && auditor
      ? resolveRole(address, client, contractor, auditor)
      : "viewer";

  const handleRefetch = () => {
    void refetch();
    // Also invalidate any cached query data so list views update too
    void queryClient.invalidateQueries();
  };

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
              #{id}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : escrowInfo && numericId !== undefined ? (
          <>
            <EscrowRoleBanner
              role={role}
              escrowId={numericId}
              clientAddress={client}
              status={statusNum}
            />

            {role === "client" && (
              <div className="mb-6">
                <ShareEscrowLink
                  escrowId={numericId}
                  label="Share with contractor"
                  description="Send this link so they can connect the wallet you specified and submit milestones."
                />
              </div>
            )}

            {role === "client" &&
              statusNum === EscrowStatus.Pending &&
              milestoneCount > 0 && (
                <div className="mb-6">
                  <FundEscrowForm
                    escrowId={numericId}
                    milestoneCount={milestoneCount}
                    onFunded={handleRefetch}
                  />
                </div>
              )}

            <div className="mb-6 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{id}
                  </span>
                  {statusNum !== undefined && (
                    <ContractStatusBadge
                      variant={ESCROW_VARIANT[statusNum] ?? "pending"}
                    />
                  )}
                </div>
                <span className="text-xs capitalize text-muted-foreground">
                  {role}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Escrowed
                  </div>
                  <EncryptedValue size="md" interactive={false} symbol="ETH" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Released
                  </div>
                  <EncryptedValue size="md" interactive={false} symbol="ETH" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {role === "contractor" ? "Client" : "Contractor"}
                  </div>
                  <div className="font-mono text-sm text-foreground break-all">
                    {role === "contractor" && client
                      ? shortAddress(client)
                      : contractor
                        ? shortAddress(contractor)
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
                    escrowId={numericId}
                    index={i}
                    totalMilestones={milestoneCount}
                    role={role}
                    escrowStatus={statusNum ?? EscrowStatus.Pending}
                    onRefetch={handleRefetch}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Escrow not found on Sepolia.
            </p>
            <Link
              href="/app/contracts"
              className="mt-4 inline-block text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to contracts
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
