"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon, LockedIcon } from "@hugeicons/core-free-icons";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";
import { decryptHandle } from "@/lib/fhe/fhevm";

interface EncryptedValueProps {

  encryptedHandle?: `0x${string}`;
  contractAddress?: `0x${string}`;
  userAddress?: `0x${string}`;
  authorized?: boolean;
  symbol?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

type DecryptState = "idle" | "loading" | "decrypted" | "error";

const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function EncryptedValue({
  encryptedHandle,
  contractAddress,
  userAddress,
  authorized = false,
  symbol = "ETH",
  className,
  size = "md",
}: EncryptedValueProps) {
  const [state, setState] = useState<DecryptState>("idle");
  const [decryptedEth, setDecryptedEth] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasHandle =
    Boolean(encryptedHandle) && encryptedHandle !== ZERO_HANDLE;

  // Reveal is available when: user is authorized, a valid handle exists, and we have all addresses
  const canReveal =
    authorized &&
    hasHandle &&
    Boolean(contractAddress) &&
    Boolean(userAddress);

  const handleReveal = async () => {
    if (!canReveal || state === "loading") return;
    if (!encryptedHandle || !contractAddress || !userAddress) return;

    setState("loading");
    setErrorMsg(null);

    try {
      const clearWei = await decryptHandle({
        handle: encryptedHandle,
        contractAddress,
        userAddress,
      });
      // Convert wei bigint → ETH string
      const eth = Number(formatEther(clearWei)).toFixed(4);
      setDecryptedEth(eth);
      setState("decrypted");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.split("\n")[0] : "Decryption failed";
      setErrorMsg(msg || "Decryption failed");
      setState("error");
      // Auto-reset after 4 seconds so user can retry
      setTimeout(() => {
        setState("idle");
        setErrorMsg(null);
      }, 4000);
    }
  };

  const handleHide = () => {
    setState("idle");
    setDecryptedEth(null);
  };

  const isRevealed = state === "decrypted";
  const isLoading = state === "loading";
  const isError = state === "error";

  const clickable = canReveal || isRevealed;

  return (
    <button
      type="button"
      onClick={isRevealed ? handleHide : handleReveal}
      disabled={isLoading || (!clickable && !isError)}
      title={
        canReveal
          ? "Click to decrypt via Zama relayer"
          : authorized
            ? "No encrypted value yet"
            : "Only authorized parties can decrypt"
      }
      className={cn(
        "group inline-flex items-center gap-2 font-mono tabular-nums",
        sizes[size],
        clickable ? "cursor-pointer" : "cursor-default",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors",
          isRevealed && "border-border-strong text-foreground",
          isError && "border-destructive/40 text-destructive",
          isLoading && "animate-pulse",
          canReveal &&
            !isRevealed &&
            !isLoading &&
            "group-hover:border-border-strong group-hover:text-foreground",
        )}
      >
        {isLoading ? (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
        ) : (
          <HugeiconsIcon
            icon={isRevealed ? LockKeyIcon : LockedIcon}
            size={12}
            strokeWidth={1.5}
          />
        )}
      </span>

      <span className="relative inline-flex min-w-[7ch] items-center justify-start">
        <AnimatePresence mode="wait" initial={false}>
          {isError ? (
            <motion.span
              key="error"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-destructive"
            >
              {errorMsg}
            </motion.span>
          ) : isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground"
            >
              Decrypting…
            </motion.span>
          ) : isRevealed ? (
            <motion.span
              key="real"
              initial={{ opacity: 0, filter: "blur(6px)", y: 2 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-foreground"
            >
              {decryptedEth}
              {symbol && (
                <span className="ml-1.5 text-muted-foreground">{symbol}</span>
              )}
            </motion.span>
          ) : (
            <motion.span
              key="masked"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "shimmer-mask text-muted-foreground",
                canReveal && "group-hover:text-foreground/70",
              )}
            >
              ••••••••
              {symbol && <span className="ml-1.5">{symbol}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {canReveal && !isRevealed && !isLoading && !isError && (
        <span className="text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
          reveal
        </span>
      )}

      {isRevealed && (
        <span className="text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
          hide
        </span>
      )}
    </button>
  );
}
