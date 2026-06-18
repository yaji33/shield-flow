"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { useDeposit } from "@/lib/hooks/use-escrow";
import { assertUint64Wei } from "@/lib/fhe/fhevm";
import { getContractErrorMessage } from "@/lib/contract-errors";

type FundPhase = "idle" | "encrypting" | "depositing";

export function FundEscrowForm({
  escrowId,
  milestoneCount,
  initialAmountsEth,
  onFunded,
  compact,
}: {
  escrowId: bigint;
  milestoneCount: number;
  initialAmountsEth?: string[];
  onFunded?: (depositHash: string) => void;
  compact?: boolean;
}) {
  const [amountsEth, setAmountsEth] = useState<string[]>(() => {
    if (initialAmountsEth?.length === milestoneCount) {
      return initialAmountsEth;
    }
    return Array.from({ length: milestoneCount }, () => "");
  });
  const [phase, setPhase] = useState<FundPhase>("idle");
  const { deposit } = useDeposit();

  const totalEth = useMemo(
    () =>
      amountsEth.reduce((sum, value) => {
        const n = Number(value);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [amountsEth],
  );

  const updateAmount = (index: number, value: string) => {
    setAmountsEth((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const validate = (): string | null => {
    if (amountsEth.some((v) => !v || Number(v) <= 0)) {
      return "Enter a positive amount for each milestone.";
    }
    if (totalEth <= 0) return "Total must be greater than zero.";
    try {
      assertUint64Wei(parseEther(totalEth.toString()), "Total amount");
      for (const amountEth of amountsEth) {
        assertUint64Wei(parseEther(amountEth), "Milestone amount");
      }
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid amount.";
    }
    return null;
  };

  const handleFund = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const milestoneAmountsWei = amountsEth.map((v) => parseEther(v));
    const totalWei = parseEther(totalEth.toString());
    const fundToast = toast.loading(
      `Preparing deposit of ${totalEth.toFixed(4)} ETH…`,
    );

    try {
      setPhase("encrypting");
      toast.loading("Encrypting amounts with fhEVM relayer…", { id: fundToast });
      setPhase("depositing");
      toast.loading(
        `Confirm deposit of ${totalEth.toFixed(4)} ETH in your wallet…`,
        { id: fundToast },
      );

      const depositTxHash = await deposit({
        escrowId,
        totalWei,
        milestoneAmountsWei,
        value: totalWei,
      });

      toast.success(`Escrow funded with ${totalEth.toFixed(4)} ETH.`, {
        id: fundToast,
      });
      onFunded?.(depositTxHash);
    } catch (error) {
      toast.error(getContractErrorMessage(error), { id: fundToast });
    } finally {
      setPhase("idle");
    }
  };

  const isSubmitting = phase !== "idle";
  const submitLabel =
    phase === "encrypting"
      ? "Encrypting…"
      : phase === "depositing"
        ? "Confirm in wallet…"
        : `Deposit ${totalEth > 0 ? `${totalEth.toFixed(4)} ETH` : "ETH"}`;

  return (
    <div
      className={
        compact
          ? "space-y-4"
          : "rounded-xl border border-border-strong bg-surface p-6 space-y-4"
      }
    >
      {!compact && (
        <div>
          <p className="text-sm font-medium text-foreground">Fund this escrow</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter milestone amounts, then sign one wallet transaction that sends{" "}
            {totalEth > 0 ? `${totalEth.toFixed(4)} ETH` : "ETH"} with encrypted
            values to activate the escrow.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: milestoneCount }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs text-muted-foreground">
              Milestone {i + 1}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountsEth[i] ?? ""}
              onChange={(e) => updateAmount(i, e.target.value)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-border-strong disabled:opacity-50"
            />
            <span className="text-xs text-muted-foreground">ETH</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Total sent on-chain</span>
        <span className="font-mono text-sm">{totalEth.toFixed(4)} ETH</span>
      </div>

      <button
        type="button"
        onClick={handleFund}
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitLabel}
        <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
