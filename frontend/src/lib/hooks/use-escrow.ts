"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ShieldFlowEscrowABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { encryptUint64Batch } from "@/lib/fhe/fhevm";
export {
  EscrowStatus,
  MilestoneStatus,
  type EscrowStatusKey,
} from "@/lib/hooks/escrow-types";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.sepolia.ShieldFlowEscrow;

export function useGetEscrow(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getEscrowInfo",
    args: escrowId !== undefined ? [escrowId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 12_000,
    },
  });
}

export function useGetEscrowBalances(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getEscrowBalances",
    args: escrowId !== undefined ? [escrowId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 12_000,
    },
  });
}

export function useGetTotalDeposit(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getTotalDeposit",
    args: escrowId !== undefined ? [escrowId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 60_000,
    },
  });
}

export function useGetReleasedAmount(escrowId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getReleasedAmount",
    args: escrowId !== undefined ? [escrowId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 12_000,
    },
  });
}

export function useGetMilestone(
  escrowId: bigint | undefined,
  milestoneIndex: number,
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "getMilestone",
    args:
      escrowId !== undefined ? [escrowId, milestoneIndex] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 12_000,
    },
  });
}

export function useNextEscrowId() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ShieldFlowEscrowABI,
    functionName: "nextEscrowId",
    chainId: sepolia.id,
  });
}

export { useUserEscrows, useEscrowDashboardStats } from "@/lib/hooks/use-user-escrows";

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

export function useDeposit() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();

  const deposit = async (params: {
    escrowId: bigint;
    totalWei: bigint;
    milestoneAmountsWei: bigint[];
    value?: bigint;
  }) => {
    if (!address) throw new Error("Wallet not connected");

    const encryptedValues = [params.totalWei, ...params.milestoneAmountsWei];
    const { handlesHex, inputProof } = await encryptUint64Batch({
      contractAddress: CONTRACT_ADDRESS,
      userAddress: address,
      values: encryptedValues,
    });

    const [encryptedTotal, ...encMilestoneAmts] = handlesHex;

    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "deposit",
      args: [
        params.escrowId,
        encryptedTotal,
        encMilestoneAmts,
        inputProof,
        params.milestoneAmountsWei,
      ],
      value: params.value ?? params.totalWei,
      chainId: sepolia.id,
    });
  };

  return { deposit, isPending, error };
}

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

// ─── Write: approveMilestone ───────  ───────────
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

export function useWithdrawReleased() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const withdrawReleased = async (escrowId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "withdrawReleased",
      args: [escrowId],
      chainId: sepolia.id,
    });
  };

  return { withdrawReleased, isPending, error };
}

export function useGrantAuditorAccess() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const grantAuditorAccess = async (
    escrowId: bigint,
    auditor: `0x${string}`,
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ShieldFlowEscrowABI,
      functionName: "grantAuditorAccess",
      args: [escrowId, auditor],
      chainId: sepolia.id,
    });
  };

  return { grantAuditorAccess, isPending, error };
}

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
