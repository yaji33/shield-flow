"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  WalletAdd01Icon,
} from "@hugeicons/core-free-icons";
import { sepolia } from "wagmi/chains";
import { useWallet } from "@/lib/hooks/use-wallet";
import { WalletConnect } from "@/components/wallet-connect";

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isWrongChain, isConnecting, isSwitching } = useWallet();

  if (isConnected && !isWrongChain) {
    return children;
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
          <HugeiconsIcon icon={WalletAdd01Icon} size={22} strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-6 text-2xl font-medium">
          {isWrongChain ? "Switch network" : "Connect your wallet"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isWrongChain
            ? `ShieldFlow runs on ${sepolia.name}. Switch networks to access the app.`
            : "Connect a wallet to view escrows, activity, and create confidential milestones."}
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-xs">
            <WalletConnect />
          </div>
        </div>
        {(isConnecting || isSwitching) && (
          <p className="mt-4 text-xs text-muted-foreground">
            {isConnecting ? "Waiting for wallet approval…" : "Switching network…"}
          </p>
        )}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={12} strokeWidth={1.5} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
