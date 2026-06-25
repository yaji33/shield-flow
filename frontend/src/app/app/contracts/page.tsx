"use client";

import Link from "next/link";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { EncryptedValue } from "@/components/encrypted-value";
import {
  shortAddress,
  useUserEscrows,
} from "@/lib/hooks/use-user-escrows";
import { ContractorEscrowsBanner } from "@/components/contractor-escrows-banner";

export default function ContractsList() {
  const {
    data: escrows = [],
    isLoading,
    isError,
    error,
  } = useUserEscrows();

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              All contracts
            </div>
            <h1 className="font-display mt-2 text-3xl font-medium">Contracts</h1>
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

          <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Escrows where you are client or contractor
            </span>
            <span className="text-xs text-muted-foreground">Polled every 15s</span>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                Loading escrows from Sepolia…
              </p>
            ) : isError ? (
              <p className="px-5 py-8 text-sm text-destructive">
                Failed to load escrows:{" "}
                {error instanceof Error ? error.message : "RPC request failed"}
              </p>
            ) : escrows.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                No escrows yet. Create one to get started.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-normal">Contract ID</th>
                    <th className="px-5 py-3 text-left font-normal">Role</th>
                    <th className="px-5 py-3 text-left font-normal">Counterparty</th>
                    <th className="px-5 py-3 text-left font-normal">Status</th>
                    <th className="px-5 py-3 text-left font-normal">Amount</th>
                    <th className="px-5 py-3 text-left font-normal">Milestones</th>
                    <th className="px-5 py-3 text-left font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((c) => (
                    <tr
                      key={c.id.toString()}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-5 py-4 font-mono text-xs">
                        #{c.id.toString()}
                      </td>
                      <td className="px-5 py-4 text-xs capitalize text-muted-foreground">
                        {c.role}
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
                          symbol={c.isFunded ? "ETH" : undefined}
                        />
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {c.releasedCount}/{c.milestoneCount}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/app/contracts/${c.id}`}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}