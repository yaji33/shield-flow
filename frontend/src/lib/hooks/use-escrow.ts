"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ShieldFlowEscrowABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.sepolia.ShieldFlowEscrow;

// ─── EscrowStatus enum (mirrors Solidity) ────────────────────────────────────
export const EscrowStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Disputed: 3,
  Cancelled: 4,
} as const;

export type EscrowStatusKey = keyof typeof EscrowStatus;

// ─── MilestoneStatus enum ─────────────────────────────────────────────────────
export const MilestoneStatus = {
  Pending: 0,
  InProgress: 1,
  Approved: 2,
  Released: 3,
  Disputed: 4,
} as const;

// ─── Read: getEscrowInfo ──────────────────────────────────────────────────────
export function useGetEscrow(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getEscrowInfo",
    args: escrowId !== undefined ? [escrowId] : undefined,
    chainId: sepolia.id,
    query: { enabled: escrowId !== undefined },
  });
}

// ─── Read: getMilestone ───────────────────────────────────────────────────────
export function useGetMilestone(
  escrowId: bigint | undefined,
  milestoneIndex: number,
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getMilestone",
    args:
      escrowId !== undefined
        ? [escrowId, milestoneIndex]
        : undefined,
    chainId: sepolia.id,
    query: { enabled: escrowId !== undefined },
  });
}

// ─── Read: nextEscrowId ───────────────────────────────────────────────────────
export function useNextEscrowId() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "nextEscrowId",
    chainId: sepolia.id,
  });
}

// ─── Read: getUserEscrows (derived — reads all IDs up to nextEscrowId) ────────
export function useGetUserEscrows(userAddress: `0x${string}` | undefined) {
  const { data: nextId } = useNextEscrowId();

  // NOTE: The contract does not have an on-chain index of escrows per user.
  // A production implementation would use event logs (EscrowCreated) filtered
  // by client/contractor address. This hook returns a placeholder.
  // TODO: Replace with viem getLogs on EscrowCreated event for userAddress.
  void nextId;
  void userAddress;

  return {
    data: [] as bigint[],
    isLoading: false,
    error: null,
  };
}

// ─── Write: createEscrow ──────────────────────────────────────────────────────
export function useCreateEscrow() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const createEscrow = async (params: {
    contractor: `0x${string}`;
    auditor: `0x${string}`;
    milestoneCount: number;
    deadlines: bigint[];
  }) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "createEscrow",
      args: [
        params.contractor,
        params.auditor,
        params.milestoneCount,
        params.deadlines,
      ],
      chainId: sepolia.id,
    });
  };

  return { createEscrow, isPending, error };
}

// ─── Write: deposit ───────────────────────────────────────────────────────────
export function useDeposit() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const deposit = async (params: {
    escrowId: bigint;
    // TODO: integrate fhEVM SDK encrypt() call here — encryptedTotal (externalEuint64)
    encryptedTotal: bigint;
    // TODO: integrate fhEVM SDK encrypt() call here — encMilestoneAmts (externalEuint64[])
    encMilestoneAmts: bigint[];
    inputProof: `0x${string}`;
    value?: bigint;
  }) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "deposit",
      args: [
        params.escrowId,
        params.encryptedTotal,
        params.encMilestoneAmts,
        params.inputProof,
      ],
      value: params.value,
      chainId: sepolia.id,
    });
  };

  return { deposit, isPending, error };
}

// ─── Write: releaseMilestone ──────────────────────────────────────────────────
export function useReleaseMilestone() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const releaseMilestone = async (
    escrowId: bigint,
    milestoneIndex: number,
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "releaseMilestone",
      args: [escrowId, milestoneIndex],
      chainId: sepolia.id,
    });
  };

  return { releaseMilestone, isPending, error };
}

// ─── Write: approveMilestone ──────────────────────────────────────────────────
export function useApproveMilestone() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const approveMilestone = async (
    escrowId: bigint,
    milestoneIndex: number,
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "approveMilestone",
      args: [escrowId, milestoneIndex],
      chainId: sepolia.id,
    });
  };

  return { approveMilestone, isPending, error };
}

// ─── Write: submitMilestone ───────────────────────────────────────────────────
export function useSubmitMilestone() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const submitMilestone = async (
    escrowId: bigint,
    milestoneIndex: number,
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "submitMilestone",
      args: [escrowId, milestoneIndex],
      chainId: sepolia.id,
    });
  };

  return { submitMilestone, isPending, error };
}

// ─── Write: cancelEscrow ──────────────────────────────────────────────────────
export function useCancelEscrow() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();

  const cancelEscrow = async (escrowId: bigint) => {
    if (!address) throw new Error("Wallet not connected");
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "cancelEscrow",
      args: [escrowId],
      chainId: sepolia.id,
    });
  };

  return { cancelEscrow, isPending, error };
}
