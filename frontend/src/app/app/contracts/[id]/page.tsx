"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CircleLock02Icon,
  CheckmarkBadge02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { isAddress, isAddressEqual, formatEther, type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { EscrowRoleBanner } from "@/components/escrow-role-banner";
import { ShareEscrowLink } from "@/components/share-escrow-link";
import { FundEscrowForm } from "@/components/fund-escrow-form";
import { useWallet } from "@/lib/hooks/use-wallet";
import { shortAddress } from "@/lib/hooks/use-user-escrows";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { getContractErrorMessage, isUserCancellation } from "@/lib/contract-errors";
import { loadEscrowMeta, saveMilestoneDelivery, type EscrowMeta } from "@/lib/escrow-meta";
import {
  useGetEscrow,
  useGetMilestone,
  useGetTotalDeposit,
  useGetReleasedAmount,
  useGetEscrowBalances,
  useReleaseMilestone,
  useApproveMilestone,
  useSubmitMilestone,
  useWithdrawReleased,
  useGrantAuditorAccess,
  EscrowStatus,
  MilestoneStatus,
} from "@/lib/hooks/use-escrow";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.sepolia.ShieldFlowEscrow;

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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function resolveRole(
  address: Address | undefined,
  client: Address,
  contractor: Address,
  auditor: Address,
): EscrowRole {
  if (!address) return "viewer";
  if (isAddressEqual(address, client)) return "client";
  if (isAddressEqual(address, contractor)) return "contractor";
  if (auditor !== ZERO_ADDRESS && isAddressEqual(address, auditor))
    return "auditor";
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

function GrantAuditorSection({
  escrowId,
  currentAuditor,
  onGranted,
}: {
  escrowId: bigint;
  currentAuditor: Address;
  onGranted: () => void;
}) {
  const [auditorInput, setAuditorInput] = useState(
    currentAuditor !== ZERO_ADDRESS ? currentAuditor : "",
  );
  const { grantAuditorAccess, isPending } = useGrantAuditorAccess();
  const hasAuditor = currentAuditor !== ZERO_ADDRESS;

  const handleGrant = async () => {
    if (!isAddress(auditorInput)) {
      toast.error("Enter a valid auditor address.");
      return;
    }
    try {
      await grantAuditorAccess(escrowId, auditorInput as `0x${string}`);
      toast.success(
        `Auditor access granted — FHE ACL updated on-chain for ${shortAddress(auditorInput as Address)}.`,
      );
      onGranted();
    } catch (err) {
      if (!isUserCancellation(err)) {
        toast.error(getContractErrorMessage(err));
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
          <HugeiconsIcon icon={UserAdd01Icon} size={14} strokeWidth={1.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {hasAuditor ? "Auditor access" : "Add auditor"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasAuditor
              ? "An auditor has been granted FHE decryption rights via the on-chain ACL."
              : "Grant a third-party limited decryption rights. Their address gets FHE.allow() on all encrypted handles."}
          </p>
        </div>
      </div>

      {hasAuditor ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
          <span className="text-xs text-muted-foreground">Auditor</span>
          <span className="flex-1 font-mono text-xs text-foreground break-all">
            {currentAuditor}
          </span>
          <button
            onClick={() => setAuditorInput("")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="0x… auditor address"
            value={auditorInput}
            onChange={(e) => setAuditorInput(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
          />
          <button
            onClick={handleGrant}
            disabled={isPending || !auditorInput}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Granting…" : "Grant"}
            <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

function MilestoneCard({
  escrowId,
  index,
  totalMilestones,
  role,
  escrowStatus,
  userAddress,
  description,
  deliveryNote,
  deliveryUrl,
  onRefetch,
  onDelivered,
}: {
  escrowId: bigint;
  index: number;
  totalMilestones: number;
  role: EscrowRole;
  escrowStatus: number;
  userAddress?: Address;
  description?: string;
  deliveryNote?: string;
  deliveryUrl?: string;
  onRefetch: () => void;
  onDelivered: (index: number, note: string, url: string) => void;
}) {
  const { data: milestoneData, refetch: refetchMilestone } = useGetMilestone(
    escrowId,
    index,
  );
  const { releaseMilestone, isPending: isReleasing } = useReleaseMilestone();
  const { approveMilestone, isPending: isApproving } = useApproveMilestone();
  const { submitMilestone, isPending: isSubmitting } = useSubmitMilestone();
  const { withdrawReleased, isPending: isWithdrawing } = useWithdrawReleased();

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [deliveryNoteInput, setDeliveryNoteInput] = useState("");
  const [deliveryUrlInput, setDeliveryUrlInput] = useState("");

  const isActive = escrowStatus === EscrowStatus.Active;
  const isAuthorized =
    role === "client" || role === "contractor" || role === "auditor";

  // getMilestone → [encryptedAmount, plainAmountWei, deadline, milestoneStatus, clientApproved, contractorSubmitted]
  const encryptedHandle = milestoneData?.[0] as `0x${string}` | undefined;
  const plainAmountWei = milestoneData?.[1] as bigint | undefined;
  const deadlineTs = milestoneData ? Number(milestoneData[2]) : undefined;
  const milestoneStatusNum = milestoneData ? Number(milestoneData[3]) : undefined;
  const contractorSubmitted = milestoneData ? Boolean(milestoneData[5]) : false;

  const deadlineLabel = (() => {
    if (!deadlineTs) return "—";
    const d = new Date(deadlineTs * 1000);
    const now = Date.now();
    const diffMs = d.getTime() - now;
    const diffDays = Math.ceil(diffMs / 86_400_000);
    const formatted = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (diffMs < 0) return `${formatted} · overdue`;
    if (diffDays === 0) return `${formatted} · due today`;
    if (diffDays === 1) return `${formatted} · due tomorrow`;
    return `${formatted} · ${diffDays}d left`;
  })();

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
    role === "client" &&
    isActive &&
    milestoneStatusNum === MilestoneStatus.Approved;
  const canWithdraw =
    role === "contractor" &&
    isReleased &&
    plainAmountWei !== undefined &&
    plainAmountWei > BigInt(0);

  const refetchAll = () => {
    void refetchMilestone();
    onRefetch();
  };

  const handleError = (error: unknown) => {
    if (!isUserCancellation(error)) {
      toast.error(getContractErrorMessage(error));
    }
  };

  const handleWithdraw = async () => {
    const t = toast.loading("Confirm withdrawal in your wallet…");
    try {
      await withdrawReleased(escrowId);
      toast.success("ETH withdrawn to your wallet.", { id: t });
      refetchAll();
    } catch (error) {
      toast.dismiss(t);
      handleError(error);
    }
  };

  const handleSubmit = async () => {
    const t = toast.loading("Submitting milestone…");
    try {
      await submitMilestone(escrowId, index);
      onDelivered(index, deliveryNoteInput, deliveryUrlInput);
      setShowSubmitForm(false);
      toast.success("Work submitted — waiting for client approval.", { id: t });
      refetchAll();
    } catch (error) {
      toast.dismiss(t);
      handleError(error);
    }
  };

  const handleApprove = async () => {
    const t = toast.loading("Approving milestone…");
    try {
      await approveMilestone(escrowId, index);
      toast.success("Milestone approved — you can now release funds.", {
        id: t,
      });
      refetchAll();
    } catch (error) {
      toast.dismiss(t);
      handleError(error);
    }
  };

  const handleRelease = async () => {
    const t = toast.loading("Releasing funds via FHE-encrypted update…");
    try {
      await releaseMilestone(escrowId, index);
      toast.success(
        `Milestone ${index + 1} released — releasedAmount updated on-chain.`,
        { id: t },
      );
      refetchAll();
    } catch (error) {
      toast.dismiss(t);
      handleError(error);
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
        <div className="flex items-center gap-2 flex-wrap">
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

        <p
          className={`mt-1 text-xs ${deadlineTs && Date.now() > deadlineTs * 1000 ? "text-destructive" : "text-muted-foreground"}`}
        >
          {deadlineLabel}
        </p>

        {description && (
          <p className="mt-1.5 text-xs text-muted-foreground/80 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-2">
          <EncryptedValue
            encryptedHandle={encryptedHandle}
            contractAddress={CONTRACT_ADDRESS}
            userAddress={userAddress}
            authorized={isAuthorized}
            size="sm"
            symbol="ETH"
          />
        </div>

        {contractorSubmitted && (deliveryNote || deliveryUrl) && (
          <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2.5 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Delivery
            </p>
            {deliveryNote && (
              <p className="text-xs text-foreground">{deliveryNote}</p>
            )}
            {deliveryUrl && (
              <a
                href={deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground break-all"
              >
                {deliveryUrl}
                <HugeiconsIcon icon={ArrowRight02Icon} size={10} strokeWidth={2} />
              </a>
            )}
          </div>
        )}

        {role === "contractor" && !isActive && (
          <p className="mt-2 text-xs text-muted-foreground">
            Available after the client funds this escrow.
          </p>
        )}
        {role === "contractor" &&
          isActive &&
          contractorSubmitted &&
          !isReleased && (
            <p className="mt-2 text-xs text-amber-400/80">
              Submitted — waiting for client to approve.
            </p>
          )}

        {canSubmit && showSubmitForm && (
          <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2.5">
            <p className="text-xs text-muted-foreground">
              Let the client know where to find your work.
            </p>
            <input
              type="url"
              placeholder="Link to deliverable (GitHub, Drive, Figma…)"
              value={deliveryUrlInput}
              onChange={(e) => setDeliveryUrlInput(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
            />
            <textarea
              rows={2}
              placeholder="Optional note (what was done, how to review it…)"
              value={deliveryNoteInput}
              onChange={(e) => setDeliveryNoteInput(e.target.value)}
              className="w-full resize-none rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isSubmitting ? "Submitting…" : "Confirm submission"}
                <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
              </button>
              <button
                onClick={() => setShowSubmitForm(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 flex-wrap">
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
        {canSubmit && !showSubmitForm && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Submit work
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

function FheInfoBanner({ role }: { role: EscrowRole }) {
  if (role === "viewer") return null;
  return (
    <div className="mb-4 rounded-lg border border-border bg-surface/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Amounts are private.</span>{" "}
        {role === "auditor"
          ? "You have been granted read access to this contract. Click the lock icon next to any amount to reveal it — your wallet will confirm the request."
          : "Click the lock icon next to any amount to reveal it. Your wallet will confirm the request, and only you will see the value."
        }
      </p>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-border/50 ${className ?? ""}`}
    />
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

  const [meta, setMeta] = useState<EscrowMeta | null>(null);
  useEffect(() => {
    if (numericId !== undefined) setMeta(loadEscrowMeta(numericId));
  }, [numericId]);

  const handleDelivered = (milestoneIndex: number, note: string, url: string) => {
    if (numericId === undefined) return;
    saveMilestoneDelivery(numericId, milestoneIndex, { note, url });
    setMeta(loadEscrowMeta(numericId));
  };

  const {
    data: escrowInfo,
    isLoading,
    refetch,
  } = useGetEscrow(numericId);

  const { data: totalDepositHandle } = useGetTotalDeposit(numericId);
  const { data: releasedHandle } = useGetReleasedAmount(numericId);
  const { data: balances } = useGetEscrowBalances(numericId);

  const client = escrowInfo?.[0] as Address | undefined;
  const contractor = escrowInfo?.[1] as Address | undefined;
  const auditor = escrowInfo?.[2] as Address | undefined;
  const statusNum = escrowInfo ? Number(escrowInfo[3]) : undefined;
  const milestoneCount = escrowInfo ? Number(escrowInfo[5]) : 0;

  const role =
    client && contractor && auditor
      ? resolveRole(address, client, contractor, auditor)
      : "viewer";

  const isAuthorized =
    role === "client" || role === "contractor" || role === "auditor";

  const pendingWithdrawalWei = balances?.[2] as bigint | undefined;

  const pendingWithdrawalEth =
    pendingWithdrawalWei && pendingWithdrawalWei > BigInt(0)
      ? Number(formatEther(pendingWithdrawalWei)).toFixed(4)
      : null;

  const handleRefetch = () => {
    void refetch();
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
            <h1 className="font-display mt-1 text-xl font-medium">
              {meta?.title ?? `#${id}`}
            </h1>
            {meta?.title && (
              <span className="text-xs text-muted-foreground font-mono">#{id}</span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : escrowInfo && numericId !== undefined ? (
          <>
            <EscrowRoleBanner
              role={role}
              escrowId={numericId}
              clientAddress={client}
              auditorAddress={auditor}
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

            <FheInfoBanner role={role} />

            {meta?.scopeOfWork && (
              <div className="mb-4 rounded-xl border border-border bg-surface p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Scope of work
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{meta.scopeOfWork}</p>
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
                  <EncryptedValue
                    encryptedHandle={totalDepositHandle as `0x${string}` | undefined}
                    contractAddress={CONTRACT_ADDRESS}
                    userAddress={address}
                    authorized={isAuthorized}
                    size="md"
                    symbol="ETH"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Released
                  </div>
                  <EncryptedValue
                    encryptedHandle={releasedHandle as `0x${string}` | undefined}
                    contractAddress={CONTRACT_ADDRESS}
                    userAddress={address}
                    authorized={isAuthorized}
                    size="md"
                    symbol="ETH"
                  />
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
                  {role === "contractor" &&
                    pendingWithdrawalEth &&
                    statusNum === EscrowStatus.Active && (
                      <p className="text-[10px] text-green-400">
                        {pendingWithdrawalEth} ETH available to withdraw
                      </p>
                    )}
                </div>
              </div>

              {auditor && auditor !== ZERO_ADDRESS && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Auditor
                  </div>
                  <div className="font-mono text-xs text-foreground break-all">
                    {auditor}
                    <span className="ml-2 text-muted-foreground/60">
                      · FHE ACL access granted
                    </span>
                  </div>
                </div>
              )}
            </div>

            {role === "client" &&
              statusNum !== undefined &&
              statusNum !== EscrowStatus.Cancelled &&
              statusNum !== EscrowStatus.Completed && (
                <div className="mb-6">
                  <GrantAuditorSection
                    escrowId={numericId}
                    currentAuditor={(auditor ?? ZERO_ADDRESS) as Address}
                    onGranted={handleRefetch}
                  />
                </div>
              )}

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
                    userAddress={address}
                    description={meta?.milestones[i]?.description}
                    deliveryNote={meta?.milestones[i]?.deliveryNote}
                    deliveryUrl={meta?.milestones[i]?.deliveryUrl}
                    onRefetch={handleRefetch}
                    onDelivered={handleDelivered}
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
