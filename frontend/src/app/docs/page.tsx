"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  LockedIcon,
  UserMultipleIcon,
  EyeIcon,
  PuzzleIcon,
  CheckmarkBadge02Icon,
  ShieldEnergyIcon,
  CircleLock02Icon,
} from "@hugeicons/core-free-icons";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
        copied
          ? "bg-surface-hover text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      )}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({
  code,
  language = "solidity",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">
          {title ?? language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto bg-background p-5 text-[13px] font-mono leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    info: "border-border bg-surface text-foreground",
    warning: "border-amber-500/30 bg-amber-950/30 text-amber-200",
    tip: "border-emerald-500/30 bg-emerald-950/30 text-emerald-200",
  };
  const labels: Record<string, string> = { info: "Note", warning: "Warning", tip: "Tip" };
  return (
    <div className={cn("my-5 rounded-lg border p-4 text-sm leading-relaxed", styles[type])}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest opacity-60">
        {labels[type]}
      </span>
      {children}
    </div>
  );
}

function SectionHeading({
  id,
  label,
  title,
  description,
}: {
  id: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 mb-8">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <h2 className="font-display mt-3 text-2xl font-medium md:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

{/*
function ZamaBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={ShieldEnergyIcon} size={11} strokeWidth={1.5} />
      Built on Zama fhEVM
    </span>
  );
}
*/}

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
          : "border-b border-transparent"
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
          <span className="text-sm font-medium uppercase tracking-[0.18em]">ShieldFlow</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/#how" className="text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="/#freelancers" className="text-muted-foreground transition-colors hover:text-foreground">
            For Freelancers
          </Link>
          <Link href="/#enterprise" className="text-muted-foreground transition-colors hover:text-foreground">
            For Enterprise
          </Link>
          <Link href="/docs" className="text-foreground">
            Docs
          </Link>
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

const TOC_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "features", label: "Core Features" },
  { id: "fhe-deep-dive", label: "FHE Deep Dive" },
  { id: "user-guides", label: "User Guides" },
  { id: "contract-reference", label: "Contract Reference" },
  { id: "security", label: "Security" },
  { id: "deployment", label: "Deployment" },
  { id: "roadmap", label: "Roadmap" },
];

function Sidebar({ activeId }: { activeId: string }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 w-52">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          On this page
        </p>
        <nav className="space-y-0.5">
          {TOC_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm transition-colors",
                activeId === item.id
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ShieldEnergyIcon} size={14} strokeWidth={1.5} />
            <span className="text-xs font-medium">Zama fhEVM</span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Relayer SDK v0.4.1
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Network: Sepolia
          </p>
          <a
            href="https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block truncate font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            0xF6105e…Bf621
          </a>
        </div>
      </div>
    </aside>
  );
}

const FLOW_STEPS = [
  {
    actor: "Client",
    fn: "createEscrow()",
    desc: "Register contractor, optional auditor, and milestone deadlines. No ETH yet.",
    status: "Pending",
    fhe: false,
  },
  {
    actor: "Client",
    fn: "deposit()",
    desc: "Send ETH + FHE-encrypted amounts for each milestone. Amounts are sealed on-chain.",
    status: "Active",
    fhe: true,
  },
  {
    actor: "Contractor",
    fn: "submitMilestone()",
    desc: "Mark a milestone as complete and ready for review.",
    status: "InProgress",
    fhe: false,
  },
  {
    actor: "Client",
    fn: "approveMilestone()",
    desc: "Verify deliverables and mark the milestone approved.",
    status: "Approved",
    fhe: false,
  },
  {
    actor: "Client",
    fn: "releaseMilestone()",
    desc: "Trigger FHE homomorphic add to update encrypted running total. Payment queued.",
    status: "Released",
    fhe: true,
  },
  {
    actor: "Contractor",
    fn: "withdrawReleased()",
    desc: "Pull accrued ETH to wallet. Escrow completes when all milestones are released.",
    status: "Completed",
    fhe: false,
  },
];

function FlowDiagram() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-surface px-4 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">Escrow Lifecycle</span>
      </div>
      <div className="divide-y divide-border">
        {FLOW_STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-5 py-4 hover:bg-surface/50 transition-colors"
          >
            <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-foreground">
                  {step.fn}
                </code>
                <span className="text-xs text-muted-foreground">caller: {step.actor}</span>
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  → {step.status}
                </span>
                {step.fhe && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                    <HugeiconsIcon icon={LockedIcon} size={10} strokeWidth={1.5} />
                    FHE
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPARISON_ROWS = [
  ["On-chain privacy", "✗ Amounts public", "⚡ Partial (proofs only)", "✓ Full encryption"],
  ["Compute on secrets", "✗ Raw data required", "✗ Prove, not compute", "✓ Homomorphic ops"],
  ["Trustless execution", "✗ Custodian required", "✓ Verifiable", "✓ On-chain, no trust"],
  ["Custodial risk", "High — single party holds funds", "None", "None — smart contract"],
  ["Programmable conditions", "Manual / off-chain", "Complex circuit design", "✓ FHE.select, FHE.add"],
  ["Selective disclosure", "All-or-nothing", "Difficult; verifier set", "✓ Per-address ACL"],
  ["Auditability", "Off-chain only", "Proof logs", "✓ On-chain ACL grants"],
];

function ComparisonTable() {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Property</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Centralized</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">ZK Proofs</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">
              FHE — ShieldFlow
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={i} className="hover:bg-surface/30 transition-colors">
              <td className="px-4 py-3 font-medium">{row[0]}</td>
              <td className="px-4 py-3 text-muted-foreground">{row[1]}</td>
              <td className="px-4 py-3 text-muted-foreground">{row[2]}</td>
              <td className="px-4 py-3 text-foreground">{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FUNCTIONS = [
  {
    name: "createEscrow(contractor, auditor, milestoneCount, deadlines)",
    caller: "Client",
    desc: "Registers a new escrow in Pending state. Sets parties and milestone deadlines. Returns escrowId.",
  },
  {
    name: "deposit(escrowId, encTotal, encAmounts, inputProof, amountsWei)",
    caller: "Client",
    desc: "Funds the escrow with ETH. Accepts FHE-encrypted total and per-milestone amounts via Zama inputProof. Transitions to Active.",
  },
  {
    name: "submitMilestone(escrowId, milestoneIndex)",
    caller: "Contractor",
    desc: "Marks a milestone as submitted (InProgress). Signals work is ready for client review.",
  },
  {
    name: "approveMilestone(escrowId, milestoneIndex)",
    caller: "Client",
    desc: "Approves a submitted milestone, setting status to Approved and enabling release.",
  },
  {
    name: "releaseMilestone(escrowId, milestoneIndex)",
    caller: "Client",
    desc: "Releases payment for an approved milestone using FHE homomorphic addition. Updates encrypted running total.",
  },
  {
    name: "withdrawReleased(escrowId)",
    caller: "Contractor",
    desc: "Transfers all queued ETH (from released milestones) to the contractor's wallet.",
  },
  {
    name: "grantAuditorAccess(escrowId, auditor)",
    caller: "Client",
    desc: "Adds an auditor address and grants FHE ACL read access to all encrypted handles in the escrow.",
  },
  {
    name: "cancelEscrow(escrowId)",
    caller: "Client",
    desc: "Cancels a Pending (unfunded) escrow. Cannot cancel after deposit.",
  },
  {
    name: "getEscrowInfo(escrowId)",
    caller: "Anyone",
    desc: "Returns parties, status, creation timestamp, and milestone count.",
  },
  {
    name: "getEscrowBalances(escrowId)",
    caller: "Anyone",
    desc: "Returns plaintext Wei amounts: totalDepositWei, releasedWei, pendingWithdrawal.",
  },
  {
    name: "getTotalDeposit(escrowId)",
    caller: "ACL holders",
    desc: "Returns the euint64 handle for the encrypted total deposit. Requires FHE ACL permission to decrypt.",
  },
  {
    name: "getMilestone(escrowId, index)",
    caller: "ACL holders",
    desc: "Returns milestone data including encrypted amount handle, deadline, and status flags.",
  },
];

const EVENTS = [
  { name: "EscrowCreated(escrowId, client, contractor, milestoneCount)", desc: "Fired on successful createEscrow()" },
  { name: "EscrowDeposited(escrowId, totalWei)", desc: "Fired after deposit confirms; reveals total Wei (not encrypted)" },
  { name: "MilestoneSubmitted(escrowId, milestoneIndex)", desc: "Contractor submitted a milestone" },
  { name: "MilestoneApproved(escrowId, milestoneIndex)", desc: "Client approved a submitted milestone" },
  { name: "MilestoneReleased(escrowId, milestoneIndex, amountWei)", desc: "Payment released for a milestone" },
  { name: "FundsWithdrawn(escrowId, contractor, amountWei)", desc: "Contractor withdrew ETH" },
  { name: "EscrowCompleted(escrowId)", desc: "All milestones released; escrow fully settled" },
  { name: "EscrowCancelled(escrowId)", desc: "Pending escrow cancelled by client" },
  { name: "AuditorGranted(escrowId, auditor)", desc: "Auditor ACL access granted" },
];

export default function DocsPage() {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -75% 0px" }
    );

    TOC_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <div className="relative overflow-hidden border-b border-border pt-32 pb-16">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1200px] px-6">
          {/* <ZamaBadge /> */}
          <h1 className="font-display mt-6 text-4xl font-medium tracking-tight md:text-5xl">
            Documentation
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            ShieldFlow is a confidential escrow and milestone payment protocol built on{" "}
            <a
              href="https://zama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:opacity-80"
            >
              Zama fhEVM
            </a>
            . Encrypted amounts, programmable milestones, and selective auditor access — all
            enforced on-chain without revealing values to the network.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "Deployed on Sepolia",
              "euint64 encrypted amounts",
              "ACL-based access control",
              "Non-custodial",
              "Open source",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <Sidebar activeId={activeId} />

          <div className="min-w-0">
            <section id="overview" className="scroll-mt-24 pb-16 border-b border-border">
              <SectionHeading
                id="overview"
                label="Introduction"
                title="What is ShieldFlow?"
                description="ShieldFlow solves a fundamental problem in on-chain escrow: every ETH amount and milestone condition is publicly visible on-chain by default, exposing deal terms to competitors, regulators, and adversaries before work is even complete."
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                By building on Zama&apos;s Fully Homomorphic Encryption (FHE) virtual machine,
                ShieldFlow keeps every payment amount encrypted at the smart contract layer.
                Counterparties see that funds exist, but the amounts remain sealed — the
                blockchain cannot read them, and neither can any third party unless explicitly
                granted access via on-chain ACL.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: LockedIcon,
                    title: "Encrypted by default",
                    body: "All amounts stored as euint64 ciphertexts. Plain values never appear in contract state.",
                  },
                  {
                    icon: UserMultipleIcon,
                    title: "Multi-party",
                    body: "Client, Contractor, and optional Auditor each get precisely scoped on-chain access.",
                  },
                  {
                    icon: PuzzleIcon,
                    title: "Composable",
                    body: "Built on fhEVM standards — ACL handles interoperate with other Zama-native contracts.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                  >
                    <HugeiconsIcon icon={card.icon} size={18} strokeWidth={1.5} className="text-muted-foreground" />
                    <h3 className="font-display mt-3 font-medium">{card.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="how-it-works"
                label="Process"
                title="How ShieldFlow Works"
                description="Escrows move through six on-chain steps. FHE operations happen at deposit and release — the two moments where financial values are read or updated."
              />

              <FlowDiagram />

              <h3 className="mt-8 font-display text-lg font-medium">Privacy at each step</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">1</span>
                  <p><strong className="text-foreground">Create</strong> — Only addresses are public. Milestone count is visible; amounts are not set yet.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">2</span>
                  <p><strong className="text-foreground">Deposit</strong> — ETH value in <code className="rounded bg-surface px-1">msg.value</code> is visible; the breakdown across milestones is hidden inside <code className="rounded bg-surface px-1">euint64</code> handles. Only permissioned parties can request decryption.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">3</span>
                  <p><strong className="text-foreground">Submit → Approve</strong> — Status flags are public. No amounts change; privacy unchanged.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">4</span>
                  <p><strong className="text-foreground">Release</strong> — Homomorphic addition updates the encrypted <code className="rounded bg-surface px-1">releasedAmount</code> in place. The Wei amount in the event log is visible, but <em>only after</em> the client decides to release.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">5</span>
                  <p><strong className="text-foreground">Withdraw</strong> — ETH transfer is on-chain; individual milestone allocations remain hidden in ciphertext.</p>
                </div>
              </div>

              <Callout type="tip">
                The total ETH deposited (<code>msg.value</code>) appears in the{" "}
                <code>EscrowDeposited</code> event. Per-milestone allocations are never revealed
                on-chain unless an authorised party requests FHE decryption through the relayer.
              </Callout>
            </section>

            <section id="features" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="features"
                label="Capabilities"
                title="Core Features"
              />

              <div className="space-y-6">
                {[
                  {
                    icon: LockedIcon,
                    title: "Confidential Escrow with Encrypted Amounts",
                    body: "Every monetary value — total deposit and per-milestone allocation — is stored as a euint64 ciphertext on Zama fhEVM. No smart contract, indexer, or blockchain explorer can read these values without explicit ACL permission. The escrow enforces correct payment ordering purely through FHE arithmetic.",
                  },
                  {
                    icon: UserMultipleIcon,
                    title: "Multi-Party: Client, Contractor, Auditor",
                    body: "Three roles with scoped privileges. The Client controls flow (create, deposit, approve, release). The Contractor submits milestones and withdraws. The Auditor gains read-only FHE access granted by the Client at any point during the escrow lifecycle — without disrupting the payment flow.",
                  },
                  {
                    icon: CheckmarkBadge02Icon,
                    title: "Milestone Management with FHE Conditions",
                    body: "Up to 10 milestones per escrow, each with an independent encrypted amount and deadline. Release uses FHE.select to guard against overflow — the running releasedAmount accumulates homomorphically and is only trusted if the operation succeeds. Milestones flow through: Pending → InProgress → Approved → Released.",
                  },
                  {
                    icon: EyeIcon,
                    title: "Programmable Auditor Access & Compliance",
                    body: "grantAuditorAccess() issues on-chain FHE.allow() calls for every encrypted handle in the escrow — total deposit, released total, and each milestone amount. This enables a compliance workflow where an auditor can prove payment occurred without parties having to reveal deal terms to the public.",
                  },
                  {
                    icon: PuzzleIcon,
                    title: "Composable with Zama fhEVM",
                    body: "ShieldFlow uses FHE.allowThis() so the contract can re-read its own ciphertexts in future transactions. ACL handles are standard fhEVM objects compatible with ERC-7984 and other Zama-native contracts. The pattern can be extended to support token-gated access, DAO governance, or automated oracle-triggered releases.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <HugeiconsIcon icon={f.icon} size={16} strokeWidth={1.5} />
                      </span>
                      <div>
                        <h3 className="font-display font-medium">{f.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="fhe-deep-dive" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="fhe-deep-dive"
                label="Technical"
                title="FHE Deep Dive"
                description="Fully Homomorphic Encryption allows arbitrary computation on ciphertexts without decrypting them first. Zama fhEVM implements this at the EVM level using the TFHE cryptosystem, enabling Solidity contracts to add, compare, and branch on encrypted integers."
              />

              <h3 className="font-display text-lg font-medium mb-4">Encrypted types used</h3>
              <div className="overflow-x-auto rounded-xl border border-border mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Solidity type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Used for</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">ABI encoding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">euint64</td>
                      <td className="px-4 py-3 text-muted-foreground">Milestone amounts, total deposit, released total (all in Gwei)</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">bytes32 handle</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">externalEuint64</td>
                      <td className="px-4 py-3 text-muted-foreground">User-submitted ciphertexts (before conversion with FHE.fromExternal)</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">bytes32</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">ebool</td>
                      <td className="px-4 py-3 text-muted-foreground">Encrypted boolean for overflow guard in releaseMilestone</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">bytes32 handle</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-display text-lg font-medium mb-3">1. Accepting and storing encrypted input</h3>
              <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                Users encrypt values client-side with the Zama relayer SDK before submitting.{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.fromExternal()</code> converts
                the user-submitted ciphertext and zero-knowledge input proof into an{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">euint64</code> that the contract
                can operate on. ACL calls immediately follow to register who may decrypt each handle.
              </p>
              <CodeBlock
                language="solidity"
                title="ShieldFlowEscrow.sol — deposit()"
                code={`// Convert user-submitted ciphertext + proof into an on-chain euint64
  euint64 encTotal = FHE.fromExternal(encryptedTotal, inputProof);
  e.totalDeposit = encTotal;

  // ACL: register who may request decryption via the relayer
  FHE.allowThis(e.totalDeposit);           // Contract can use it in future txns
  FHE.allow(e.totalDeposit, msg.sender);   // Client can decrypt
  FHE.allow(e.totalDeposit, e.contractor); // Contractor can decrypt

  // Same pattern applied to every per-milestone encrypted amount
  for (uint8 i = 0; i < e.milestoneCount; i++) {
      euint64 amt = FHE.fromExternal(encMilestoneAmts[i], inputProof);
      e.milestones[i].encryptedAmount = amt;
      FHE.allowThis(e.milestones[i].encryptedAmount);
      FHE.allow(e.milestones[i].encryptedAmount, msg.sender);
      FHE.allow(e.milestones[i].encryptedAmount, e.contractor);
      if (e.auditor != address(0)) {
          FHE.allow(e.milestones[i].encryptedAmount, e.auditor);
      }
  }`}
              />

              <h3 className="font-display text-lg font-medium mb-3 mt-8">2. Homomorphic arithmetic with overflow protection</h3>
              <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">releaseMilestone()</code> uses{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.add()</code> to accumulate
                the released total homomorphically — the contract never decrypts the value. To guard
                against 64-bit overflow,{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.select()</code> acts as an
                encrypted ternary: if overflow is detected (the result is less than the previous value),
                the old value is preserved.
              </p>
              <CodeBlock
                language="solidity"
                title="ShieldFlowEscrow.sol — releaseMilestone()"
                code={`// Homomorphic addition — both operands remain encrypted
euint64 newReleased = FHE.add(e.releasedAmount, m.encryptedAmount);

// Overflow guard: compare encrypted values without revealing them
ebool didOverflow = FHE.lt(newReleased, e.releasedAmount);

// FHE.select(cond, ifTrue, ifFalse) — branch without decrypting
// If overflow detected: keep old value. Otherwise: accept newReleased.
e.releasedAmount = FHE.select(didOverflow, e.releasedAmount, newReleased);

// Re-issue ACL after mutation so all parties retain read access
FHE.allowThis(e.releasedAmount);
FHE.allow(e.releasedAmount, e.client);
FHE.allow(e.releasedAmount, e.contractor);
if (e.auditor != address(0)) {
    FHE.allow(e.releasedAmount, e.auditor);
}`}
              />

              <h3 className="font-display text-lg font-medium mb-3 mt-8">3. ACL-based selective decryption</h3>
              <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                The Access Control List (ACL) is Zama fhEVM&apos;s mechanism for granting
                decryption rights. Every ciphertext handle exists in an on-chain ACL registry.
                When a user requests decryption through the Zama relayer, the relayer verifies the
                caller holds an ACL grant before returning the plaintext. No grant — no decryption.
              </p>
              <CodeBlock
                language="solidity"
                title="ShieldFlowEscrow.sol — grantAuditorAccess()"
                code={`function grantAuditorAccess(uint256 escrowId, address auditor)
    external onlyClient(escrowId)
{
    require(auditor != address(0), "ShieldFlow: invalid auditor address");
    Escrow storage e = _escrows[escrowId];

    e.auditor = auditor;

    // Issue ACL grants for every encrypted handle in the escrow
    FHE.allow(e.totalDeposit, auditor);
    FHE.allow(e.releasedAmount, auditor);
    for (uint8 i = 0; i < e.milestoneCount; i++) {
        if (FHE.isInitialized(e.milestones[i].encryptedAmount)) {
            FHE.allow(e.milestones[i].encryptedAmount, auditor);
        }
    }
    emit AuditorGranted(escrowId, auditor);
}`}
              />

              <h3 className="font-display text-lg font-medium mb-3 mt-8">4. Frontend: encrypting values with the Zama relayer SDK</h3>
              <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                The frontend encrypts ETH amounts Gwei before submitting them to the contract.
                The SDK generates a batched ZK input proof covering all values in a single call,
                which is passed as{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">inputProof</code> to{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">deposit()</code>.
              </p>
              <CodeBlock
                language="typescript"
                title="src/lib/fhe/fhevm.ts — Encrypting milestone amounts"
                code={`import { createInstance } from "@zama-fhe/relayer-sdk";

// Initialise the fhEVM instance for the connected wallet
const instance = await createInstance({
  kmsContractAddress,   // Zama KMS contract on Sepolia
  aclContractAddress,   // Zama ACL contract on Sepolia
  network: provider,
});

// Build a batched input — all values share one proof
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(totalGwei);           // Encrypted total
input.add64(milestone1Gwei);      // Per-milestone breakdown
input.add64(milestone2Gwei);
const { handles, inputProof } = await input.encrypt();

// handles[0] = encryptedTotal (externalEuint64)
// handles[1], handles[2] = encMilestoneAmts[]
// inputProof  = ZK proof the client knows the plaintexts
await deposit(escrowId, handles[0], [handles[1], handles[2]], inputProof, amountsWei);`}
              />

              <Callout type="info">
                The <code>inputProof</code> is a compact zero-knowledge proof generated by the
                Zama SDK that proves the user supplied well-formed 64-bit values. Without it,{" "}
                <code>FHE.fromExternal()</code> would revert. This prevents malformed ciphertext
                attacks that could corrupt encrypted state.
              </Callout>

              <h3 className="font-display text-lg font-medium mb-4 mt-8">FHE vs. alternatives</h3>
              <ComparisonTable />

              <Callout type="tip">
                ZK proofs can verify <em>that</em> something is true (e.g. &quot;I own this balance&quot;)
                but cannot perform <em>computation on</em> encrypted values. FHE can do both — which
                is why ShieldFlow can accumulate a running payment total and apply conditional logic
                without ever decrypting the underlying amounts.
              </Callout>
            </section>

            <section id="user-guides" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="user-guides"
                label="Guides"
                title="User Guides"
                description="Step-by-step instructions for each role in a ShieldFlow escrow."
              />

              <div className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface">
                    <HugeiconsIcon icon={CircleLock02Icon} size={14} strokeWidth={1.5} />
                  </span>
                  <h3 className="font-display text-lg font-medium">For Clients</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                  The Client creates and funds the escrow, approves completed milestones, and releases payments.
                </p>
                <ol className="space-y-3 text-sm">
                  {[
                    { step: "Connect wallet", detail: "Connect a Sepolia wallet in the app. ShieldFlow requires Sepolia — switch chains if prompted." },
                    { step: "Create an escrow", detail: "Go to /app/create. Enter the contractor's address, an optional auditor, and define 1–10 milestones with labels, ETH amounts, and deadlines." },
                    { step: "Review & deploy", detail: "Step 3 of the wizard shows a summary. Confirm the transaction. This registers the escrow on-chain at no cost except gas." },
                    { step: "Fund the escrow", detail: "After creation, the FundEscrowForm appears. Confirm the ETH amount. The frontend encrypts each milestone allocation and submits deposit() with the encrypted handles and input proof." },
                    { step: "Approve milestones", detail: "When the contractor submits work, visit /app/contracts/[id]. Review and click Approve Milestone. This does not release funds yet." },
                    { step: "Release payment", detail: "Click Release Milestone to trigger the FHE payment update and queue ETH for contractor withdrawal." },
                    { step: "Add an auditor (optional)", detail: "At any time, use Grant Auditor Access to give a compliance address read-only FHE decryption rights." },
                  ].map(({ step, detail }, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium text-foreground">{step}</span>
                        <span className="text-muted-foreground"> — {detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface">
                    <HugeiconsIcon icon={CheckmarkBadge02Icon} size={14} strokeWidth={1.5} />
                  </span>
                  <h3 className="font-display text-lg font-medium">For Contractors</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                  Contractors receive an escrow link from the client. No wallet connection is needed to view the invite; a Sepolia wallet is required to interact.
                </p>
                <ol className="space-y-3 text-sm">
                  {[
                    { step: "Receive the escrow link", detail: "The client shares a /app/contracts/[id] link. Visit it to see contract status, milestone count, and deadlines." },
                    { step: "View your encrypted amount", detail: "The Encrypted Value component lets you click-to-decrypt your milestone amounts using the Zama relayer. Only your wallet address can decrypt values you hold ACL grants for." },
                    { step: "Submit a milestone", detail: "When work is complete, click Submit Milestone on the relevant row. This calls submitMilestone() on-chain and notifies the client." },
                    { step: "Wait for approval", detail: "The client reviews and approves the milestone. You will see the milestone status change to Approved in the UI." },
                    { step: "Withdraw funds", detail: "After the client releases the milestone, click Withdraw Released Funds to pull all accrued ETH to your wallet via withdrawReleased()." },
                  ].map(({ step, detail }, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium text-foreground">{step}</span>
                        <span className="text-muted-foreground"> — {detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface">
                    <HugeiconsIcon icon={EyeIcon} size={14} strokeWidth={1.5} />
                  </span>
                  <h3 className="font-display text-lg font-medium">For Auditors</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                  Auditors have read-only decryption access. They cannot approve, release, or withdraw. Their role is to verify that payment amounts match agreed terms for compliance purposes.
                </p>
                <ol className="space-y-3 text-sm">
                  {[
                    { step: "Receive ACL grant", detail: "The client calls grantAuditorAccess(escrowId, yourAddress). This is an on-chain transaction that registers your address in the fhEVM ACL for all encrypted handles in the escrow." },
                    { step: "Connect wallet", detail: "Visit /app/contracts/[id] with the auditor wallet connected. The UI will show encrypted value placeholders." },
                    { step: "Decrypt & verify", detail: "Click any Encrypted Value component to trigger decryption via the Zama relayer. Your wallet signs the request; the relayer verifies your ACL grant and returns the plaintext." },
                    { step: "Confirm compliance", detail: "Cross-reference decrypted milestone amounts against your off-chain agreement. All decryption events are recorded by the relayer for audit trails." },
                  ].map(({ step, detail }, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[11px]">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium text-foreground">{step}</span>
                        <span className="text-muted-foreground"> — {detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                <Callout type="info">
                  Auditors <strong>cannot</strong> approve milestones, release funds, or withdraw ETH. The{" "}
                  <code>onlyClient</code> and <code>onlyContractor</code> modifiers enforce this at the
                  contract level.
                </Callout>
              </div>
            </section>

            <section id="contract-reference" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="contract-reference"
                label="Reference"
                title="Smart Contract Reference"
              />

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-foreground">ShieldFlowEscrow</span>
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  Sepolia · 0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621
                </span>
                <a
                  href="https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  View on Etherscan
                  <HugeiconsIcon icon={ArrowRight02Icon} size={11} strokeWidth={2} />
                </a>
              </div>

              <h3 className="font-display text-base font-medium mb-3 mt-6">Functions</h3>
              <div className="overflow-x-auto rounded-xl border border-border mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Function</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caller</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {FUNCTIONS.map((fn) => (
                      <tr key={fn.name} className="hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground align-top whitespace-nowrap">{fn.name.split("(")[0]}()</td>
                        <td className="px-4 py-3 text-muted-foreground align-top whitespace-nowrap">{fn.caller}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fn.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-display text-base font-medium mb-3">Events</h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {EVENTS.map((ev) => (
                      <tr key={ev.name} className="hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground align-top whitespace-nowrap">{ev.name.split("(")[0]}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ev.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="security" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="security"
                label="Security"
                title="Security & Best Practices"
              />

              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-base font-medium mb-3">ACL Implementation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Every ciphertext handle created or modified by ShieldFlowEscrow immediately receives ACL grants via <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.allowThis()</code> and role-specific <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.allow()</code>. Without <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.allowThis()</code>, the contract cannot re-read its own ciphertexts in future transactions — a common fhEVM mistake that would permanently freeze state.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                    {[
                      { who: "Contract", access: "allowThis() on all handles it creates and mutates" },
                      { who: "Client", access: "allow() on deposit, released total, all milestone amounts" },
                      { who: "Contractor", access: "allow() on deposit, released total, all milestone amounts" },
                      { who: "Auditor", access: "allow() issued on-demand via grantAuditorAccess()" },
                    ].map((row) => (
                      <div key={row.who} className="rounded-lg border border-border bg-surface p-3">
                        <div className="font-medium text-xs mb-1">{row.who}</div>
                        <div className="text-xs text-muted-foreground">{row.access}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-base font-medium mb-3">Gas Considerations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    FHE operations are significantly more gas-expensive than plaintext arithmetic on standard EVM chains. On Zama fhEVM Sepolia, each <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.add</code>, <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.lt</code>, and <code className="rounded bg-surface px-1.5 py-0.5 text-xs">FHE.select</code> carries an overhead computed by Zama&apos;s coprocessor. As a result:
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />Milestone count is capped at 10 to bound <code className="rounded bg-surface px-1 text-xs">deposit()</code> gas usage (10 <code className="rounded bg-surface px-1 text-xs">FHE.fromExternal</code> calls).</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" /><code className="rounded bg-surface px-1 text-xs">releaseMilestone()</code> performs 3 FHE ops (add, lt, select) per call — plan milestone granularity accordingly.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" /><code className="rounded bg-surface px-1 text-xs">grantAuditorAccess()</code> gas scales linearly with milestone count (one <code className="rounded bg-surface px-1 text-xs">FHE.allow</code> per milestone).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-base font-medium mb-3">Secure patterns used</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Checks-Effects-Interactions: state is updated before external ETH transfer in withdrawReleased().",
                      "Re-entrancy safe: pendingWithdrawal zeroed before call{}() in withdrawReleased().",
                      "Overflow-protected FHE addition via FHE.select(overflow, old, new) pattern.",
                      "Input validation: milestoneAmountsWei must sum exactly to msg.value on deposit().",
                      "Role modifiers: onlyClient, onlyContractor, onlyClientOrAuditor enforced at function level.",
                      "Status guards: escrowActive() and explicit status checks prevent out-of-order calls.",
                      "FHE.isInitialized() check before ACL grants to avoid operating on uninitialised handles.",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge02Icon} size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-base font-medium mb-3">Known Limitations</h3>
                  <Callout type="warning">
                    ShieldFlow has not undergone a formal security audit. It is deployed on Sepolia
                    testnet only and should not be used with real assets.
                  </Callout>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />No dispute resolution mechanism — a disputed escrow stays frozen until Completed or a future upgrade.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />Amounts in Gwei are bounded by uint64 max (~18.4 ETH equivalent). Large deals should split into sub-escrows.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />EscrowDeposited event leaks total Wei (not per-milestone). This is intentional for indexers but worth noting.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />Relayer decryption is asynchronous — UI may show a loading state while the relayer processes decrypt requests.</li>
                    <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />cancelEscrow() only works before deposit — post-deposit cancellation is not yet implemented.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="deployment" className="scroll-mt-24 py-16 border-b border-border">
              <SectionHeading
                id="deployment"
                label="Integration"
                title="Deployment & Integration"
              />

              <h3 className="font-display text-base font-medium mb-3">Deploy your own instance</h3>
              <CodeBlock
                language="bash"
                title="Terminal"
                code={`# 1. Clone and install
git clone https://github.com/your-org/shieldflow
cd shieldflow/fhevm-hardhat
pnpm install

# 2. Configure environment
cp .env.example .env
# Set PRIVATE_KEY and ALCHEMY_API_KEY in .env

# 3. Deploy to Sepolia
npx hardhat run deploy/deploy_ShieldFlowEscrow.ts --network sepolia

# Output: ShieldFlowEscrow deployed to: 0x...
# Update frontend/src/lib/contracts/addresses.ts with the new address`}
              />

              <h3 className="font-display text-base font-medium mb-3 mt-8">Frontend setup</h3>
              <CodeBlock
                language="bash"
                title="Terminal"
                code={`cd frontend
pnpm install
cp .env.local.example .env.local`}
              />

              <h3 className="font-display text-base font-medium mb-3 mt-6">Environment variables</h3>
              <div className="overflow-x-auto rounded-xl border border-border mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Variable</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["NEXT_PUBLIC_ALCHEMY_RPC_URL", "Alchemy RPC endpoint for Sepolia (or any Sepolia-compatible RPC)"],
                      ["NEXT_PUBLIC_CHAIN_ID", "11155111 for Sepolia"],
                    ].map(([key, desc]) => (
                      <tr key={key}>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{key}</td>
                        <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-display text-base font-medium mb-3">Updating the contract address</h3>
              <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                After redeploying, update the address in:
              </p>
              <CodeBlock
                language="typescript"
                title="src/lib/contracts/addresses.ts"
                code={`export const CONTRACT_ADDRESSES = {
  sepolia: {
    ShieldFlowEscrow: "0xYOUR_NEW_ADDRESS" as \`0x\${string}\`,
  },
} as const;`}
              />

              <h3 className="font-display text-base font-medium mb-3 mt-8">Relayer configuration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ShieldFlow uses the Zama hosted relayer on Sepolia. The relayer is initialized
                in <code className="rounded bg-surface px-1.5 py-0.5 text-xs">src/lib/fhe/fhevm.ts</code>{" "}
                using the public Zama KMS and ACL contract addresses for Sepolia. No API key
                is required for testnet usage. For production deployments, consult{" "}
                <a
                  href="https://docs.zama.ai/fhevm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-80"
                >
                  Zama fhEVM documentation
                </a>{" "}
                for relayer configuration options.
              </p>
            </section>

            <section id="roadmap" className="scroll-mt-24 py-16">
              <SectionHeading
                id="roadmap"
                label="Future"
                title="Roadmap & Future Work"
                description="ShieldFlow is actively developed. The following capabilities are planned for future releases."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    phase: "v0.2",
                    title: "Dispute Resolution",
                    items: [
                      "Arbitrator role with time-locked dispute window",
                      "FHE-conditional release: auto-approve on deadline if no dispute",
                      "Partial release support (percentage of milestone)",
                    ],
                  },
                  {
                    phase: "v0.3",
                    title: "Token Support",
                    items: [
                      "ERC-20 escrow alongside ETH (euint64 token amounts)",
                      "Encrypted token balances via fhEVM ERC-20 standard",
                      "Multi-token milestones (mixed asset deals)",
                    ],
                  },
                  {
                    phase: "v0.4",
                    title: "Oracle Integration",
                    items: [
                      "Chainlink Functions trigger for milestone auto-approval",
                      "FHE-encrypted oracle responses for private condition checks",
                      "Delivery confirmation hooks for digital goods",
                    ],
                  },
                  {
                    phase: "v0.5",
                    title: "Advanced Composability",
                    items: [
                      "On-chain identity integration (ENS, EAS attestations)",
                      "DAO governance for escrow parameter changes",
                      "Encrypted escrow factory for platform builders",
                    ],
                  },
                  {
                    phase: "v1.0",
                    title: "Mainnet Launch",
                    items: [
                      "Independent security audit",
                      "Formal Zama fhEVM mainnet deployment",
                      "SDK for third-party integrations",
                    ],
                  },
                  {
                    phase: "Ongoing",
                    title: "Infrastructure",
                    items: [
                      "Subgraph indexing for escrow discovery",
                      "Email/push notifications for milestone events",
                      "Mobile-optimised frontend",
                    ],
                  },
                ].map((item) => (
                  <div key={item.phase} className="rounded-xl border border-border bg-surface p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {item.phase}
                      </span>
                      <span className="font-display font-medium">{item.title}</span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {item.items.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-16">
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
              <span className="text-sm font-medium uppercase tracking-[0.18em]">ShieldFlow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Confidential escrow and milestone payments. Built on Zama fhEVM.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4 md:justify-self-end">
            {[
              { label: "App", href: "/app/dashboard" },
              { label: "Create Escrow", href: "/app/create" },
              { label: "GitHub", href: "https://github.com" },
              { label: "X / Twitter", href: "https://x.com" },
              {
                label: "Sepolia Explorer",
                href: "https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621",
              },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
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
    </div>
  );
}
