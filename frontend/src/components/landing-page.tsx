"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockedIcon,
  UserMultipleIcon,
  EyeIcon,
  PuzzleIcon,
  ArrowRight02Icon,
  CheckmarkBadge02Icon,
  ShieldEnergyIcon,
  CircleLock02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { EncryptedValue } from "@/components/encrypted-value";
import { ContractStatusBadge } from "@/components/contract-status-badge";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/75 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/shield-flow-logo.png"
            alt="ShieldFlow"
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="text-sm font-medium uppercase tracking-[0.18em]">
            ShieldFlow
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#freelancers" className="transition-colors hover:text-foreground">For Freelancers</a>
          <a href="#enterprise" className="transition-colors hover:text-foreground">For Enterprise</a>
          <a href="#docs" className="transition-colors hover:text-foreground">Docs</a>
        </nav>
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Launch App
          <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border pt-40 pb-32">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          {/*
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <HugeiconsIcon icon={LockedIcon} size={12} strokeWidth={1.5} />
            <span>Powered by Zama fhEVM</span>
          </div>
           */}

          <h1 className="font-display mt-6 max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Contracts that keep
            <br />
            <span className="text-muted-foreground">your terms private.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-[17px]">
            Encrypted escrow and milestone payments for global teams. No one sees your
            amounts — not even the blockchain.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/app/create"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Create Escrow
              <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
            </Link>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-border-strong"
            >
              Read the Docs
            </a>
          </div>
          {/*
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkBadge02Icon} size={14} strokeWidth={1.5} />
              Deployed on Sepolia
            </span>
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={CircleLock02Icon} size={14} strokeWidth={1.5} />
              Zama fhEVM
            </span>
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={ShieldEnergyIcon} size={14} strokeWidth={1.5} />
              Non-custodial
            </span>
          </div>
          */}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-3xl"
        >
          <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  0xA3F2…91dE
                </span>
                <ContractStatusBadge variant="active" />
              </div>
              <span className="text-xs text-muted-foreground">Milestone 2 of 4</span>
            </div>
            <div className="grid grid-cols-1 gap-6 pt-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total escrowed
                </div>
                <EncryptedValue size="md" symbol="cUSDT" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Next release
                </div>
                <EncryptedValue size="md" symbol="cUSDT" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Counterparty
                </div>
                <div className="font-mono text-sm text-foreground">0x71C…b04A</div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-x-8 -bottom-10 h-24 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Create",
    body: "Define milestones and deposit funds. Amounts stay encrypted from block one.",
    icon: CircleLock02Icon,
  },
  {
    n: "02",
    title: "Collaborate",
    body: "Work proceeds. Oracle or multi-sig triggers milestone checks privately.",
    icon: UserMultipleIcon,
  },
  {
    n: "03",
    title: "Release",
    body: "Funds release automatically when conditions are met. Private on-chain.",
    icon: CheckmarkBadge02Icon,
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-b border-border py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-14 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Process
            </div>
            <h2 className="font-display mt-3 max-w-xl text-3xl font-medium md:text-4xl">
              Three steps from deal to release.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-6 bg-background p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground">
                  <HugeiconsIcon icon={s.icon} size={16} strokeWidth={1.5} />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
              </div>
              <div>
                <h3 className="font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: LockedIcon,
    title: "Encrypted Balances",
    body: "Milestone amounts and totals are never exposed on-chain — fully homomorphic, fully private.",
  },
  {
    icon: UserMultipleIcon,
    title: "Multi-Party Approvals",
    body: "Escrow requires M-of-N signers. Approvals stay confidential between parties.",
  },
  {
    icon: EyeIcon,
    title: "Auditor Access",
    body: "Grant selective decryption to compliance officers without exposing data to the network.",
  },
  {
    icon: PuzzleIcon,
    title: "Composable",
    body: "Integrates with on-chain identity and DeFi primitives. Encrypted-by-default building blocks.",
  },
];

function Features() {
  return (
    <section id="freelancers" className="border-b border-border py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Capabilities
          </div>
          <h2 className="font-display mt-3 text-3xl font-medium md:text-4xl">
            Privacy as a first-class primitive.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            ShieldFlow is built on Zama&apos;s fhEVM so every amount, condition, and
            approval is encrypted at the protocol layer — not bolted on at the UI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground">
                <HugeiconsIcon icon={f.icon} size={16} strokeWidth={1.5} />
              </span>
              <h3 className="font-display mt-5 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section id="enterprise" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Used by teams building on Zama Protocol
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Cipher Labs", "Northcraft", "Arc Capital", "Mesh Systems", "Vault.fi"].map(
              (name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-12 md:p-16">
          <div className="hero-glow pointer-events-none absolute inset-0" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-end">
            <div>
              <h3 className="font-display text-3xl font-medium leading-tight md:text-5xl">
                Ship the contract.
                <br />
                <span className="text-muted-foreground">Keep the terms.</span>
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground md:text-base">
                Deploy your first encrypted escrow in under three minutes on Sepolia.
                No custodian. No leaked amounts.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/app/create"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Create Escrow
                  <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2} />
                </Link>
                <a
                  href="#docs"
                  className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-5 py-3 text-sm font-medium transition-colors hover:bg-background/40"
                >
                  Read the Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="docs" className="py-16">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/shield-flow-logo.png"
              alt="ShieldFlow"
              width={22}
              height={22}
              className="shrink-0 opacity-80"
            />
            <span className="text-sm font-medium uppercase tracking-[0.18em]">
              ShieldFlow
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Confidential escrow and milestone payments. Built on Zama fhEVM.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4 md:justify-self-end">
          {[
            { label: "Docs", href: "#" },
            { label: "GitHub", href: "#" },
            { label: "X / Twitter", href: "#" },
            { label: "Sepolia Explorer", href: "https://sepolia.etherscan.io" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1200px] items-center justify-between border-t border-border px-6 pt-6 text-xs text-muted-foreground">
        <span>© 2025 ShieldFlow. Built on Zama fhEVM.</span>
        <span className="font-mono">v0.1.0 · Sepolia</span>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <SocialProof />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
