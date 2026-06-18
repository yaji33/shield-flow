"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  type Address,
  type Hash,
  type PublicClient,
} from "viem";
import { ShieldFlowEscrowABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { fetchEscrowIdsForUser } from "@/lib/hooks/use-user-escrows";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.sepolia.ShieldFlowEscrow;
const POLL_INTERVAL_MS = 15_000;
const LOG_LOOKBACK = BigInt(50000);
const MAX_EVENTS = 25;

export type ActivityRow = {
  eventName: string;
  escrowId: bigint;
  detail: string;
  blockNumber: bigint;
  transactionHash: Hash;
  timestamp: Date | null;
};

async function getFromBlock(publicClient: PublicClient): Promise<bigint> {
  const latest = await publicClient.getBlockNumber();
  return latest > LOG_LOOKBACK ? latest - LOG_LOOKBACK : BigInt(0);
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

async function fetchUserActivity(
  publicClient: PublicClient,
  userAddress: Address,
): Promise<ActivityRow[]> {
  const fromBlock = await getFromBlock(publicClient);
  const escrowIds = await fetchEscrowIdsForUser(publicClient, userAddress);

  const rows: ActivityRow[] = [];

  const [createdAsClient, createdAsContractor] = await Promise.all([
    publicClient.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      eventName: "EscrowCreated",
      args: { client: userAddress },
      fromBlock,
    }),
    publicClient.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      eventName: "EscrowCreated",
      args: { contractor: userAddress },
      fromBlock,
    }),
  ]);

  const seenCreated = new Set<string>();
  for (const event of [...createdAsClient, ...createdAsContractor]) {
    const key = `${event.transactionHash}-${event.logIndex}`;
    if (seenCreated.has(key)) continue;
    seenCreated.add(key);

    rows.push({
      eventName: "EscrowCreated",
      escrowId: event.args.escrowId!,
      detail: `${event.args.milestoneCount} milestone${event.args.milestoneCount === 1 ? "" : "s"}`,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: null,
    });
  }

  for (const escrowId of escrowIds) {
    const [
      deposited,
      submitted,
      approved,
      released,
      completed,
      cancelled,
      auditorGranted,
    ] = await Promise.all([
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "EscrowDeposited",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "MilestoneSubmitted",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "MilestoneApproved",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "MilestoneReleased",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "EscrowCompleted",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "EscrowCancelled",
        args: { escrowId },
        fromBlock,
      }),
      publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ShieldFlowEscrowABI,
        eventName: "AuditorGranted",
        args: { escrowId },
        fromBlock,
      }),
    ]);

    for (const event of deposited) {
      rows.push({
        eventName: "EscrowDeposited",
        escrowId,
        detail: "—",
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of submitted) {
      rows.push({
        eventName: "MilestoneSubmitted",
        escrowId,
        detail: `Milestone ${Number(event.args.milestoneIndex!) + 1}`,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of approved) {
      rows.push({
        eventName: "MilestoneApproved",
        escrowId,
        detail: `Milestone ${Number(event.args.milestoneIndex!) + 1}`,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of released) {
      rows.push({
        eventName: "MilestoneReleased",
        escrowId,
        detail: `Milestone ${Number(event.args.milestoneIndex!) + 1}`,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of completed) {
      rows.push({
        eventName: "EscrowCompleted",
        escrowId,
        detail: "—",
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of cancelled) {
      rows.push({
        eventName: "EscrowCancelled",
        escrowId,
        detail: "—",
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }

    for (const event of auditorGranted) {
      const auditor = event.args.auditor as Address;
      rows.push({
        eventName: "AuditorGranted",
        escrowId,
        detail: `${auditor.slice(0, 6)}…${auditor.slice(-4)}`,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return 0;
    return a.blockNumber > b.blockNumber ? -1 : 1;
  });

  const limited = rows.slice(0, MAX_EVENTS);
  const blockNumbers = [...new Set(limited.map((row) => row.blockNumber))];
  const blockTimestamps = new Map<bigint, Date>();

  await Promise.all(
    blockNumbers.map(async (blockNumber) => {
      const block = await publicClient.getBlock({ blockNumber });
      blockTimestamps.set(blockNumber, new Date(Number(block.timestamp) * 1000));
    }),
  );

  return limited.map((row) => ({
    ...row,
    timestamp: blockTimestamps.get(row.blockNumber) ?? null,
  }));
}

export function useUserEscrowActivity() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });

  return useQuery({
    queryKey: ["userEscrowActivity", address, sepolia.id],
    queryFn: async () => {
      if (!publicClient || !address) return [];
      return fetchUserActivity(publicClient, address);
    },
    enabled: Boolean(isConnected && address && publicClient),
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
  });
}

export { formatRelativeTime };
