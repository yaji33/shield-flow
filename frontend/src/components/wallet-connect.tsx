"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon, WalletAdd01Icon } from "@hugeicons/core-free-icons";
import { useWallet } from "@/lib/hooks/use-wallet";
import { sepolia } from "wagmi/chains";

export function WalletConnect() {
  const {
    shortAddress,
    isConnected,
    isConnecting,
    isSwitching,
    isWrongChain,
    connectWallet,
    switchToSepolia,
    disconnect,
    connectError,
  } = useWallet();

  if (isConnected && shortAddress) {
    return (
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="text-xs text-muted-foreground">Connected</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-xs text-foreground">{shortAddress}</span>
          <button
            onClick={() => disconnect()}
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="Disconnect wallet"
          >
            <HugeiconsIcon icon={Logout03Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>
        {isWrongChain && (
          <button
            onClick={switchToSepolia}
            disabled={isSwitching}
            className="mt-2 w-full rounded-md border border-amber-500/40 px-2 py-1.5 text-xs text-amber-200/90 transition-colors hover:border-amber-500/70 disabled:opacity-50"
          >
            {isSwitching ? "Switching…" : `Switch to ${sepolia.name}`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50"
      >
        <HugeiconsIcon icon={WalletAdd01Icon} size={14} strokeWidth={1.5} />
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {connectError && (
        <p className="mt-2 text-xs text-destructive">{connectError.message}</p>
      )}
    </div>
  );
}
