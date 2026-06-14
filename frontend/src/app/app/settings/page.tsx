export default function Settings() {
  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-[700px]">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Configuration
          </div>
          <h1 className="font-display mt-2 text-3xl font-medium">Settings</h1>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-medium">Network</h2>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <span className="text-sm">Sepolia Testnet</span>
              <span className="font-mono text-xs text-muted-foreground">
                Chain ID 11155111
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-1 text-sm font-medium">RPC Endpoint</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Configure via <code className="font-mono">NEXT_PUBLIC_ALCHEMY_RPC_URL</code> in{" "}
              <code className="font-mono">.env.local</code>.
            </p>
            <div className="rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs text-muted-foreground">
              {process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL
                ? "https://eth-sepolia.g.alchemy.com/v2/…"
                : "Not configured"}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-1 text-sm font-medium">fhEVM SDK</h2>
            <p className="text-xs text-muted-foreground">
              Encrypted deposit and milestone amounts require the Zama fhEVM SDK.
              See <code className="font-mono">CONTRACT_INTEGRATION.md</code> for wiring
              instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
