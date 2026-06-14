"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon, LockedIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface EncryptedValueProps {
  value?: string | number;
  symbol?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

export function EncryptedValue({
  value = "0",
  symbol = "cUSDT",
  className,
  size = "md",
  interactive = true,
}: EncryptedValueProps) {
  const [revealed, setRevealed] = useState(false);
  const display = String(value);

  const onToggle = () => {
    if (!interactive) return;
    setRevealed((v) => !v);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group inline-flex items-center gap-2 font-mono tabular-nums",
        sizes[size],
        interactive && "cursor-pointer",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border border-border text-muted-foreground transition-colors",
          revealed
            ? "border-border-strong text-foreground"
            : "group-hover:border-border-strong",
        )}
      >
        <HugeiconsIcon
          icon={revealed ? LockKeyIcon : LockedIcon}
          size={12}
          strokeWidth={1.5}
        />
      </span>
      <span className="relative inline-flex min-w-[7ch] justify-start">
        <AnimatePresence mode="wait" initial={false}>
          {revealed ? (
            <motion.span
              key="real"
              initial={{ opacity: 0, filter: "blur(6px)", y: 2 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-foreground"
            >
              {display}
              {symbol && <span className="ml-1.5 text-muted-foreground">{symbol}</span>}
            </motion.span>
          ) : (
            <motion.span
              key="masked"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="shimmer-mask text-muted-foreground"
            >
              ••••••••
              {symbol && <span className="ml-1.5">{symbol}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
