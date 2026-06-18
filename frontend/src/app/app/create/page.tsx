"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  CircleLock02Icon,
  UserMultipleIcon,
  CheckmarkBadge02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { isAddress, parseEther, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { cn } from "@/lib/utils";
import { useCreateEscrow } from "@/lib/hooks/use-escrow";
import { useWallet } from "@/lib/hooks/use-wallet";
import { ShieldFlowEscrowABI } from "@/lib/contracts/abis";
import { assertUint64Wei } from "@/lib/fhe/fhevm";
import { ShareEscrowLink } from "@/components/share-escrow-link";
import { FundEscrowForm } from "@/components/fund-escrow-form";

const STEPS = [
  { n: 1, label: "Parties", sublabel: "Contractor & auditor", icon: UserMultipleIcon },
  { n: 2, label: "Milestones", sublabel: "Amounts & deadlines", icon: CircleLock02Icon },
  { n: 3, label: "Review", sublabel: "Confirm & create", icon: CheckmarkBadge02Icon },
];

interface Milestone {
  label: string;
  amountEth: string;
  deadlineDays: number;
}

const DEFAULT_MILESTONE: Milestone = {
  label: "",
  amountEth: "",
  deadlineDays: 30,
};

type SubmitPhase =
  | "idle"
  | "creating"
  | "awaiting_deposit"
  | "complete";

export default function CreateEscrow() {
  const [step, setStep] = useState(1);
  const [contractor, setContractor] = useState("");
  const [auditor, setAuditor] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { ...DEFAULT_MILESTONE },
  ]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<bigint | null>(null);
  const [depositHash, setDepositHash] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");

  const { address, isConnected, isWrongChain } = useWallet();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { createEscrow, error: createError } = useCreateEscrow();

  const totalEth = useMemo(
    () =>
      milestones.reduce((sum, milestone) => {
        const value = Number(milestone.amountEth);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [milestones],
  );

  const addMilestone = () => {
    if (milestones.length < 10) {
      setMilestones((m) => [...m, { ...DEFAULT_MILESTONE }]);
    }
  };

  const removeMilestone = (i: number) =>
    setMilestones((m) => m.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, patch: Partial<Milestone>) =>
    setMilestones((m) => m.map((ms, idx) => (idx === i ? { ...ms, ...patch } : ms)));

  const validateForm = (): string | null => {
    if (!isConnected || !address) return "Connect your wallet first.";
    if (isWrongChain) return "Switch to Sepolia before creating an escrow.";
    if (!isAddress(contractor)) return "Enter a valid contractor address.";
    if (address.toLowerCase() === contractor.toLowerCase()) {
      return "You cannot be your own contractor.";
    }
    if (auditor.trim() !== "" && !isAddress(auditor)) {
      return "Enter a valid auditor address or leave it blank.";
    }
    if (milestones.some((m) => !m.label.trim())) {
      return "Each milestone needs a description.";
    }
    if (milestones.some((m) => !m.amountEth || Number(m.amountEth) <= 0)) {
      return "Each milestone needs a positive amount.";
    }
    if (totalEth <= 0) return "Total amount must be greater than zero.";

    try {
      const totalWei = parseEther(totalEth.toString());
      assertUint64Wei(totalWei, "Total amount");
      for (const milestone of milestones) {
        assertUint64Wei(parseEther(milestone.amountEth), "Milestone amount");
      }
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid amount.";
    }

    return null;
  };

  const handleCreateEscrow = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const deadlines = milestones.map(
      (m) => BigInt(now + m.deadlineDays * 86400),
    );
    const auditorAddress =
      auditor.trim() === ""
        ? ("0x0000000000000000000000000000000000000000" as const)
        : (auditor as `0x${string}`);

    const createToast = toast.loading("Creating escrow on Sepolia (no ETH)…");

    try {
      setSubmitPhase("creating");
      const hash = await createEscrow({
        contractor: contractor as `0x${string}`,
        auditor: auditorAddress,
        milestoneCount: milestones.length,
        deadlines,
      });
      setTxHash(hash);

      if (!publicClient) {
        throw new Error("Public client unavailable");
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("Create escrow transaction failed");
      }

      let createdId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEscrowCreatedLog(log);
          if (decoded) createdId = decoded;
        } catch {
          // skip unrelated logs
        }
      }

      if (createdId === null) {
        throw new Error("Could not read escrow ID from transaction receipt");
      }

      setEscrowId(createdId);
      setSubmitPhase("awaiting_deposit");
      toast.success(
        `Escrow #${createdId.toString()} created. Sign the deposit transaction next.`,
        { id: createToast },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transaction failed";
      toast.error(message, { id: createToast });
      setSubmitPhase("idle");
    }
  };

  const handleDepositComplete = (hash: string) => {
    setDepositHash(hash);
    setSubmitPhase("complete");
  };

  const isCreating = submitPhase === "creating";
  const showFundStep =
    submitPhase === "awaiting_deposit" || submitPhase === "complete";
  const isComplete = submitPhase === "complete";

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Create
          </div>
          <h1 className="font-display mt-2 text-3xl font-medium">New Escrow</h1>
        </div>

        <div className="mb-10">
          <div className="flex items-start">
            {STEPS.map((s, idx) => {
              const isDone = step > s.n;
              const isActive = step === s.n;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={s.n} className="flex flex-1 flex-col last:flex-none">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => isDone && setStep(s.n)}
                      disabled={!isDone}
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isDone
                          ? "border-foreground bg-foreground text-background cursor-pointer hover:opacity-80"
                          : isActive
                            ? "border-foreground bg-background text-foreground"
                            : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <HugeiconsIcon icon={CheckmarkBadge02Icon} size={13} strokeWidth={2} />
                      ) : (
                        <span className="text-xs font-medium">{s.n}</span>
                      )}
                    </button>
                    {!isLast && (
                      <div className="relative mx-2 h-px flex-1">
                        <div className="absolute inset-0 bg-border" />
                        <div
                          className="absolute inset-0 bg-foreground transition-all duration-300"
                          style={{ width: isDone ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pr-4">
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isActive
                          ? "text-foreground"
                          : isDone
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {s.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-[11px] transition-colors",
                        isActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40",
                      )}
                    >
                      {s.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-sm font-medium">Contractor address</h2>
              <input
                type="text"
                placeholder="0x…"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
              />
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-1 text-sm font-medium">Auditor address</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Optional. Leave blank for no auditor.
              </p>
              <input
                type="text"
                placeholder="0x… (optional)"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!contractor}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Continue
              <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Milestones</h2>
                <span className="text-xs text-muted-foreground">
                  {milestones.length} / 10 · Total {totalEth.toFixed(4)} ETH
                </span>
              </div>
              <div className="divide-y divide-border">
                {milestones.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="w-5 text-xs font-mono text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      placeholder="Milestone label"
                      value={m.label}
                      onChange={(e) =>
                        updateMilestone(i, { label: e.target.value })
                      }
                      className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.0001"
                        placeholder="0.0"
                        value={m.amountEth}
                        onChange={(e) =>
                          updateMilestone(i, { amountEth: e.target.value })
                        }
                        className="w-24 rounded-lg border border-border bg-background px-2 py-2 text-center text-sm text-foreground focus:border-border-strong focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={m.deadlineDays}
                        onChange={(e) =>
                          updateMilestone(i, {
                            deadlineDays: Number(e.target.value),
                          })
                        }
                        className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-center text-sm text-foreground focus:border-border-strong focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                    {milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(i)}
                        className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {milestones.length < 10 && (
                <div className="border-t border-border px-5 py-3">
                  <button
                    onClick={addMilestone}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    + Add milestone
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Review
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            {showFundStep && escrowId !== null ? (
              <>
                <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HugeiconsIcon
                      icon={CheckmarkBadge02Icon}
                      size={16}
                      strokeWidth={1.5}
                    />
                    Step 1 complete — escrow #{escrowId.toString()} created
                  </div>
                  {txHash && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Create tx (no ETH sent):
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground">
                        {txHash}
                      </p>
                    </div>
                  )}
                  {!isComplete && (
                    <p className="text-xs text-muted-foreground">
                      Step 2 sends {totalEth.toFixed(4)} ETH. MetaMask will show the
                      transfer amount on the next confirmation.
                    </p>
                  )}
                </div>

                {!isComplete ? (
                  <FundEscrowForm
                    escrowId={escrowId}
                    milestoneCount={milestones.length}
                    initialAmountsEth={milestones.map((m) => m.amountEth)}
                    onFunded={handleDepositComplete}
                  />
                ) : (
                  <div className="rounded-xl border border-border-strong bg-surface p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <HugeiconsIcon
                        icon={CheckmarkBadge02Icon}
                        size={16}
                        strokeWidth={1.5}
                      />
                      Escrow funded and active
                    </div>
                    {depositHash && (
                      <div>
                        <p className="text-xs text-muted-foreground">Deposit tx:</p>
                        <p className="mt-1 break-all font-mono text-xs text-foreground">
                          {depositHash}
                        </p>
                      </div>
                    )}
                    <ShareEscrowLink
                      escrowId={escrowId}
                      label="Share with contractor"
                      description="Send this link so they can open the escrow with the wallet address you entered."
                    />
                    <div className="flex flex-wrap gap-3">
                      {txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View create tx
                          <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
                        </a>
                      )}
                      {depositHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${depositHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View deposit tx
                          <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
                        </a>
                      )}
                      <Link
                        href={`/app/contracts/${escrowId}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Open escrow
                        <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Contractor
                    </div>
                    <div className="mt-1 font-mono text-sm">{contractor}</div>
                  </div>
                  {auditor && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Auditor
                      </div>
                      <div className="mt-1 font-mono text-sm">{auditor}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Total deposit (encrypted)
                    </div>
                    <div className="font-mono text-sm">{totalEth.toFixed(4)} ETH</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Milestones ({milestones.length})
                    </div>
                    <div className="space-y-1.5">
                      {milestones.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <span>{m.label || `Milestone ${i + 1}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.amountEth} ETH · {m.deadlineDays}d deadline
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Two wallet transactions</p>
                  <ol className="list-decimal space-y-1 pl-4">
                    <li>
                      <span className="text-foreground">Create escrow</span> — sets up
                      parties and milestones. No ETH is sent.
                    </li>
                    <li>
                      <span className="text-foreground">Deposit</span> — encrypts amounts
                      via the Zama relayer, then sends {totalEth.toFixed(4)} ETH in one{" "}
                      <code className="font-mono">deposit()</code> call.
                    </li>
                  </ol>
                </div>

                {!isConnected && (
                  <p className="text-xs text-amber-200/90">
                    Connect your wallet in the sidebar before submitting.
                  </p>
                )}

                {createError && (
                  <p className="text-xs text-destructive">
                    {(createError as Error).message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isCreating}
                    className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateEscrow}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isCreating ? "Creating escrow…" : "Create escrow (step 1 — no ETH)"}
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function decodeEscrowCreatedLog(log: {
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
}): bigint | null {
  const decoded = decodeEventLog({
    abi: ShieldFlowEscrowABI,
    data: log.data,
    topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
  });

  if (decoded.eventName !== "EscrowCreated") return null;
  return decoded.args.escrowId as bigint;
}
