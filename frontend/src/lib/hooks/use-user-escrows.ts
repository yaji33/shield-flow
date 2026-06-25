"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  type Address,
  getAddress,
  isAddressEqual,
  type PublicClient,
} from "viem";
import { ShieldFlowEscrowABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import {
  EscrowStatus,
  MilestoneStatus,
  type EscrowStatusKey,
} from "@/lib/hooks/escrow-types";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.sepolia.ShieldFlowEscrow;
const POLL_INTERVAL_MS = 15_000;

export type EscrowStatusVariant = "active" | "pending" | "completed" | "disputed";

export type UserEscrowRow = {
  id: bigint;
  role: "client" | "contractor" | "auditor";
  counterparty: Address;
  status: EscrowStatusKey;
  statusVariant: EscrowStatusVariant;
  nextMilestone: string;
  milestoneCount: number;
  releasedCount: number;
  isFunded: boolean;
};

const STATUS_KEY: Record<number, EscrowStatusKey> = {
  [EscrowStatus.Pending]: "Pending",
  [EscrowStatus.Active]: "Active",
  [EscrowStatus.Completed]: "Completed",
  [EscrowStatus.Disputed]: "Disputed",
  [EscrowStatus.Cancelled]: "Cancelled",
};

const STATUS_VARIANT: Record<number, EscrowStatusVariant> = {
  [EscrowStatus.Pending]: "pending",
  [EscrowStatus.Active]: "active",
  [EscrowStatus.Completed]: "completed",
  [EscrowStatus.Disputed]: "disputed",
  [EscrowStatus.Cancelled]: "pending",
};

function shortAddress(address: Address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function assertSepoliaContract(publicClient: PublicClient) {
  const chainId = await publicClient.getChainId();
  if (chainId !== sepolia.id) {
    throw new Error(
      `RPC is connected to chain ${chainId}, not Sepolia (${sepolia.id}). In Vercel, set NEXT_PUBLIC_ALCHEMY_RPC_URL to https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`,
    );
  }

  const code = await publicClient.getBytecode({ address: CONTRACT_ADDRESS });
  if (!code || code === "0x") {
    throw new Error(
      `ShieldFlow contract not found at ${CONTRACT_ADDRESS} on this RPC. Your Alchemy URL is likely Mainnet — use https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`,
    );
  }
}

async function fetchEscrowIdsForUser(
  publicClient: PublicClient,
  userAddress: Address,
): Promise<bigint[]> {
  const nextId = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "nextEscrowId",
  });

  if (nextId === BigInt(0)) return [];

  const ids: bigint[] = [];
  for (let id = BigInt(0); id < nextId; id++) {
    const info = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "getEscrowInfo",
      args: [id],
    });

    const [client, contractor, auditor] = info;
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const isAuditor =
      auditor !== ZERO_ADDRESS && isAddressEqual(auditor, userAddress);

    if (
      isAddressEqual(client, userAddress) ||
      isAddressEqual(contractor, userAddress) ||
      isAuditor
    ) {
      ids.push(id);
    }
  }

  return ids.reverse();
}

async function describeNextMilestone(
  publicClient: PublicClient,
  escrowId: bigint,
  status: number,
  milestoneCount: number,
): Promise<{ label: string; releasedCount: number }> {
  if (status === EscrowStatus.Pending) {
    return { label: "Initial Deposit", releasedCount: 0 };
  }

  if (status === EscrowStatus.Completed) {
    return { label: "—", releasedCount: milestoneCount };
  }

  if (status === EscrowStatus.Cancelled) {
    return { label: "Cancelled", releasedCount: 0 };
  }

  let releasedCount = 0;

  for (let i = 0; i < milestoneCount; i++) {
    const milestone = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "getMilestone",
      args: [escrowId, i],
    });

    const milestoneStatus = Number(milestone[3]);
    const contractorSubmitted = Boolean(milestone[5]);

    if (milestoneStatus === MilestoneStatus.Released) {
      releasedCount++;
      continue;
    }

    const indexLabel = `Milestone ${i + 1}`;
    if (milestoneStatus === MilestoneStatus.Approved) {
      return { label: `${indexLabel} — Ready to release`, releasedCount };
    }
    if (milestoneStatus === MilestoneStatus.InProgress || contractorSubmitted) {
      return { label: `${indexLabel} — Awaiting approval`, releasedCount };
    }
    return { label: `${indexLabel} — Not started`, releasedCount };
  }

  return { label: "—", releasedCount };
}

async function fetchUserEscrowRows(
  publicClient: PublicClient,
  userAddress: Address,
): Promise<UserEscrowRow[]> {
  const escrowIds = await fetchEscrowIdsForUser(publicClient, userAddress);
  if (escrowIds.length === 0) return [];

  const rows = await Promise.all(
    escrowIds.map(async (id) => {
      const info = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        functionName: "getEscrowInfo",
        args: [id],
      });

      const [client, contractor, auditor, status, , milestoneCount] = info;
      const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
      const isAuditor =
        auditor !== ZERO_ADDRESS && isAddressEqual(auditor, userAddress);
      const role = isAddressEqual(client, userAddress)
        ? "client"
        : isAddressEqual(contractor, userAddress)
          ? "contractor"
          : "auditor";
      const counterparty = isAuditor
        ? client
        : role === "client"
          ? contractor
          : client;
      const { label, releasedCount } = await describeNextMilestone(
        publicClient,
        id,
        status,
        milestoneCount,
      );

      const isFunded = status !== EscrowStatus.Pending;

      const statusKey = STATUS_KEY[status] ?? "Pending";

      return {
        id,
        role,
        counterparty: getAddress(counterparty),
        status: statusKey,
        statusVariant: STATUS_VARIANT[status] ?? "pending",
        nextMilestone: label,
        milestoneCount,
        releasedCount,
        isFunded,
      } satisfies UserEscrowRow;
    }),
  );

  return rows;
}

export function useUserEscrows() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });

  return useQuery({
    queryKey: ["userEscrows", address, sepolia.id],
    queryFn: async () => {
      if (!publicClient || !address) return [];
      await assertSepoliaContract(publicClient);
      return fetchUserEscrowRows(publicClient, address);
    },
    enabled: Boolean(isConnected && address && publicClient),
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
  });
}

export function useEscrowDashboardStats() {
  const { data: escrows = [], isLoading } = useUserEscrows();

  const activeCount = escrows.filter(
    (e) => e.statusVariant === "active",
  ).length;

  const pendingMilestones = escrows.reduce((sum, escrow) => {
    if (escrow.status !== "Active") return sum;
    return sum + (escrow.milestoneCount - escrow.releasedCount);
  }, 0);

  return {
    escrows,
    activeCount,
    pendingMilestones,
    isLoading,
  };
}

export { shortAddress, fetchEscrowIdsForUser };