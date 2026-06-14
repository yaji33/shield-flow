"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Notebook01Icon,
  PlusSignSquareIcon,
  Activity01Icon,
  Settings02Icon,
  ShieldEnergyIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { WalletConnect } from "@/components/wallet-connect";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/app/contracts", label: "Contracts", icon: Notebook01Icon },
  { href: "/app/create", label: "Create Escrow", icon: PlusSignSquareIcon },
  { href: "/app/activity", label: "Activity", icon: Activity01Icon },
  { href: "/app/settings", label: "Settings", icon: Settings02Icon },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-[256px_1fr]">
      <aside className="hidden flex-col border-r border-border bg-surface/40 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border-strong bg-surface">
            <HugeiconsIcon icon={ShieldEnergyIcon} size={14} strokeWidth={1.5} />
          </span>
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.18em]">
            ShieldFlow
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active =
              pathname === n.href ||
              (n.href !== "/app/dashboard" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active && "border-foreground bg-[#161616] text-foreground",
                )}
              >
                <HugeiconsIcon icon={n.icon} size={16} strokeWidth={1.5} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <WalletConnect />
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
