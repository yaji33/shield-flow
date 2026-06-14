"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon, WalletAdd01Icon } from "@hugeicons/core-free-icons";
import { useWallet } from "@/lib/hooks/use-wallet";

export function WalletConnect() {
  const { shortAddress, isConnected, isConnecting, connectWallet, disconnect } =
    useWallet();

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
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50"
    >
      <HugeiconsIcon icon={WalletAdd01Icon} size={14} strokeWidth={1.5} />
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
