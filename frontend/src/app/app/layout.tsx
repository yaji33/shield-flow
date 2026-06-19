"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Notebook01Icon,
  PlusSignSquareIcon,
  Activity01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { WalletConnect } from "@/components/wallet-connect";
import { WalletGate } from "@/components/wallet-gate";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/app/contracts", label: "Contracts", icon: Notebook01Icon },
  { href: "/app/create", label: "Create Escrow", icon: PlusSignSquareIcon },
  { href: "/app/activity", label: "Activity", icon: Activity01Icon },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
          <Image
            src="/shield-flow-logo.png"
            alt="ShieldFlow"
            width={24}
            height={24}
            className="shrink-0"
          />
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.18em]">
            ShieldFlow
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((n) => {
            const active =
              pathname === n.href ||
              (n.href !== "/app/dashboard" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150",
                  "hover:bg-surface-hover/50 hover:text-foreground",
                  active && "bg-surface-hover text-foreground font-medium",
                )}
              >
                <HugeiconsIcon icon={n.icon} size={16} strokeWidth={1.5} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-border p-4">
          <WalletConnect />
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <WalletGate>{children}</WalletGate>
      </main>
    </div>
  );
}
