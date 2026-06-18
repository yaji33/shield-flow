"use client";

import Link from "next/link";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { useWallet } from "@/lib/hooks/use-wallet";
import {
  shortAddress,
  useEscrowDashboardStats,
} from "@/lib/hooks/use-user-escrows";
import { ContractorEscrowsBanner } from "@/components/contractor-escrows-banner";

export default function Dashboard() {
  const { isConnected } = useWallet();
  const { escrows, activeCount, pendingMilestones, isLoading } =
    useEscrowDashboardStats();

  const clientEscrows = escrows.filter((e) => e.role === "client");
  const contractorEscrows = escrows.filter((e) => e.role === "contractor");

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Overview
            </div>
            <h1 className="font-display mt-2 text-3xl font-medium">Dashboard</h1>
          </div>
          <Link
            href="/app/create"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Create Escrow
          </Link>
        </div>

        <div className="mt-10 space-y-10">
          <ContractorEscrowsBanner />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Total Escrowed
            </div>
            <div className="mt-3">
              <EncryptedValue size="lg" interactive={false} symbol="ETH" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Amounts stay encrypted on-chain
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Active Contracts
            </div>
            <div className="font-display mt-3 text-3xl font-medium">
              {isLoading ? "…" : String(activeCount).padStart(2, "0")}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pending Milestones
            </div>
            <div className="font-display mt-3 text-3xl font-medium">
              {isLoading ? "…" : String(pendingMilestones).padStart(2, "0")}
            </div>
          </div>
        </div>

        {!isConnected && (
          <p className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
            Connect your wallet in the sidebar to load your escrows from Sepolia.
          </p>
        )}

        {isConnected && (
          <>
            <EscrowTable
              title="Your escrows (as client)"
              escrows={clientEscrows}
              isLoading={isLoading}
              emptyMessage="No escrows created yet."
            />
            <EscrowTable
              title="Escrows as counterparty"
              escrows={contractorEscrows}
              isLoading={isLoading}
              emptyMessage="No escrows where you are the contractor."
            />
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function EscrowTable({
  title,
  escrows,
  isLoading,
  emptyMessage,
  className,
}: {
  title: string;
  escrows: ReturnType<typeof useEscrowDashboardStats>["escrows"];
  isLoading: boolean;
  emptyMessage: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="text-xs text-muted-foreground">Polled every 15s</span>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            Loading escrows from Sepolia…
          </p>
        ) : escrows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-normal">Contract ID</th>
                <th className="px-5 py-3 text-left font-normal">Counterparty</th>
                <th className="px-5 py-3 text-left font-normal">Status</th>
                <th className="px-5 py-3 text-left font-normal">Amount</th>
                <th className="px-5 py-3 text-left font-normal">Next Milestone</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((c) => (
                <tr key={c.id.toString()} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-mono text-xs">
                    <Link
                      href={`/app/contracts/${c.id}`}
                      className="transition-colors hover:text-foreground"
                    >
                      #{c.id.toString()}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {shortAddress(c.counterparty)}
                  </td>
                  <td className="px-5 py-4">
                    <ContractStatusBadge variant={c.statusVariant} />
                  </td>
                  <td className="px-5 py-4">
                    <EncryptedValue
                      size="sm"
                      interactive={false}
                      symbol={c.isFunded ? "ETH" : undefined}
                    />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {c.nextMilestone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
