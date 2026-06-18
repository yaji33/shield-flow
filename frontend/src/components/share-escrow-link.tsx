"use client";

import { useState } from "react";
import { toast } from "sonner";
import { escrowShareUrl } from "@/lib/escrow-share";

export function ShareEscrowLink({
  escrowId,
  label = "Share link",
  description,
}: {
  escrowId: bigint | number | string;
  label?: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = escrowShareUrl(escrowId);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Escrow link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{url}</p>
    </div>
  );
}
