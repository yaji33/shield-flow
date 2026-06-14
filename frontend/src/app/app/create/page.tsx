"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  CircleLock02Icon,
  UserMultipleIcon,
  CheckmarkBadge02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useCreateEscrow } from "@/lib/hooks/use-escrow";

const STEPS = [
  { n: 1, label: "Parties", icon: UserMultipleIcon },
  { n: 2, label: "Milestones", icon: CircleLock02Icon },
  { n: 3, label: "Review", icon: CheckmarkBadge02Icon },
];

interface Milestone {
  label: string;
  deadlineDays: number;
}

const DEFAULT_MILESTONE: Milestone = { label: "", deadlineDays: 30 };

export default function CreateEscrow() {
  const [step, setStep] = useState(1);
  const [contractor, setContractor] = useState("");
  const [auditor, setAuditor] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { ...DEFAULT_MILESTONE },
  ]);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { createEscrow, isPending, error } = useCreateEscrow();

  const addMilestone = () => {
    if (milestones.length < 10) {
      setMilestones((m) => [...m, { ...DEFAULT_MILESTONE }]);
    }
  };

  const removeMilestone = (i: number) =>
    setMilestones((m) => m.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, patch: Partial<Milestone>) =>
    setMilestones((m) => m.map((ms, idx) => (idx === i ? { ...ms, ...patch } : ms)));

  const handleSubmit = async () => {
    const now = Math.floor(Date.now() / 1000);
    const deadlines = milestones.map(
      (m) => BigInt(now + m.deadlineDays * 86400),
    );
    const auditorAddress =
      auditor.trim() === "" ? "0x0000000000000000000000000000000000000000" : auditor;

    try {
      const hash = await createEscrow({
        contractor: contractor as `0x${string}`,
        auditor: auditorAddress as `0x${string}`,
        milestoneCount: milestones.length,
        deadlines,
      });
      setTxHash(hash);
    } catch {
      // error is surfaced via the `error` field from useCreateEscrow
    }
  };

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Create
          </div>
          <h1 className="font-display mt-2 text-3xl font-medium">New Escrow</h1>
        </div>
        <div className="mb-10 flex items-center gap-3">
          {STEPS.map((s, idx) => (
            <div key={s.n} className="flex items-center gap-3">
              <button
                onClick={() => step > s.n && setStep(s.n)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                  step === s.n
                    ? "border-foreground text-foreground"
                    : step > s.n
                      ? "border-border-strong text-muted-foreground hover:text-foreground"
                      : "border-border text-muted-foreground opacity-50",
                )}
              >
                <HugeiconsIcon icon={s.icon} size={12} strokeWidth={1.5} />
                {s.label}
              </button>
              {idx < STEPS.length - 1 && (
                <span className="text-muted-foreground">
                  <HugeiconsIcon icon={ArrowRight02Icon} size={12} strokeWidth={1.5} />
                </span>
              )}
            </div>
          ))}
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
                  {milestones.length} / 10
                </span>
              </div>
              <div className="divide-y divide-border">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
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
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
                    />
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
            {txHash ? (
              <div className="rounded-xl border border-border-strong bg-surface p-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <HugeiconsIcon
                    icon={CheckmarkBadge02Icon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  Escrow created
                </div>
                <p className="text-xs text-muted-foreground">Transaction hash:</p>
                <p className="mt-1 break-all font-mono text-xs text-foreground">
                  {txHash}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View on Sepolia Explorer
                  <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
                </a>
              </div>
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
                            {m.deadlineDays}d deadline
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">fhEVM deposit</p>
                  <p>
                    After creating the escrow, call{" "}
                    <code className="font-mono">deposit()</code> with encrypted
                    amounts via the fhEVM SDK.
                    {/* TODO: integrate fhEVM SDK encrypt() call here for deposit amounts */}
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-destructive">
                    {(error as Error).message}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? "Submitting…" : "Create Escrow"}
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
