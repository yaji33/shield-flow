import Link from "next/link";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { EncryptedValue } from "@/components/encrypted-value";

// TODO: replace with useGetUserEscrows(address) once contract is deployed
const CONTRACTS = [
  { id: "0xA3F2…91dE", party: "0x71C…b04A", status: "active" as const, milestones: "2/4" },
  { id: "0xC18B…7720", party: "0x9A2…ff31", status: "pending" as const, milestones: "0/3" },
  { id: "0x4DDE…0A19", party: "0x55E…1c80", status: "completed" as const, milestones: "5/5" },
  { id: "0x6611…E2C4", party: "0x12F…aa07", status: "disputed" as const, milestones: "1/2" },
];

export default function ContractsList() {
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

        <div className="mt-10 rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-normal">Contract ID</th>
                  <th className="px-5 py-3 text-left font-normal">Counterparty</th>
                  <th className="px-5 py-3 text-left font-normal">Status</th>
                  <th className="px-5 py-3 text-left font-normal">Amount</th>
                  <th className="px-5 py-3 text-left font-normal">Milestones</th>
                  <th className="px-5 py-3 text-left font-normal" />
                </tr>
              </thead>
              <tbody>
                {CONTRACTS.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-mono text-xs">{c.id}</td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {c.party}
                    </td>
                    <td className="px-5 py-4">
                      <ContractStatusBadge variant={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <EncryptedValue value="32,000.00" size="sm" />
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {c.milestones}
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
          </div>
        </div>
      </div>
    </div>
  );
}
