"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon, WalletAdd01Icon } from "@hugeicons/core-free-icons";
import { useWallet } from "@/lib/hooks/use-wallet";
import { sepolia } from "wagmi/chains";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

  const [open, setOpen] = useState(false);

  if (isConnected && shortAddress) {
    return (
      <>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-xs text-muted-foreground">Connected</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-xs text-foreground">{shortAddress}</span>
            <button
              onClick={() => setOpen(true)}
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Disconnect wallet?</DialogTitle>
              <DialogDescription>
                You&apos;ll be signed out and will need to reconnect to access
                your escrows.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2 gap-2 sm:gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Disconnect
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
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
