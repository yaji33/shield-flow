import Link from "next/link";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";

// TODO: wire to deployed Sepolia contract via wagmi + fhEVM SDK
const CONTRACTS = [
  { id: "0xA3F2…91dE", party: "0x71C…b04A", status: "active" as const, next: "Design Sign-off" },
  { id: "0xC18B…7720", party: "0x9A2…ff31", status: "pending" as const, next: "Initial Deposit" },
  { id: "0x4DDE…0A19", party: "0x55E…1c80", status: "completed" as const, next: "—" },
  { id: "0x6611…E2C4", party: "0x12F…aa07", status: "disputed" as const, next: "Arbitration" },
];

export default function Dashboard() {
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

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Total Escrowed
            </div>
            <div className="mt-3">
              <EncryptedValue value="124,500.00" size="lg" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Active Contracts
            </div>
            <div className="font-display mt-3 text-3xl font-medium">07</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pending Milestones
            </div>
            <div className="font-display mt-3 text-3xl font-medium">12</div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Recent contracts</h2>
            <span className="text-xs text-muted-foreground">Polled every 15s</span>
          </div>
          <div className="overflow-x-auto">
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
                {CONTRACTS.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-mono text-xs">
                      <Link
                        href={`/app/contracts/${c.id}`}
                        className="transition-colors hover:text-foreground"
                      >
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {c.party}
                    </td>
                    <td className="px-5 py-4">
                      <ContractStatusBadge variant={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <EncryptedValue value="32,000.00" size="sm" />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{c.next}</td>
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
