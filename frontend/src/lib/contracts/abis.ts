/**
 * ABI for ShieldFlowEscrow contract.
 * Derived from: ../../../fhevm-hardhat/contracts/ShieldFlowEscrow.sol
 *
 * NOTE: fhEVM encrypted types map to ABI types as follows:
 *   euint64 (stored handle)   → uint256
 *   externalEuint64 (input)   → uint256
 */
export const ShieldFlowEscrowABI = [
  // ─── Events ─────────────────────────────────────────────────────────
  {
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "contractor", type: "address", indexed: true },
      { name: "milestoneCount", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowDeposited",
    inputs: [{ name: "escrowId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "MilestoneSubmitted",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "milestoneIndex", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MilestoneApproved",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "milestoneIndex", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MilestoneReleased",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "milestoneIndex", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowCompleted",
    inputs: [{ name: "escrowId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "EscrowCancelled",
    inputs: [{ name: "escrowId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "AuditorGranted",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "auditor", type: "address", indexed: false },
    ],
  },

  // ─── Write Functions ─────────────────────────────────────────────────
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contractor", type: "address" },
      { name: "auditor", type: "address" },
      { name: "milestoneCount", type: "uint8" },
      { name: "deadlines", type: "uint64[]" },
    ],
    outputs: [{ name: "escrowId", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [
      { name: "escrowId", type: "uint256" },
      // TODO: integrate fhEVM SDK encrypt() call here — encryptedTotal (externalEuint64)
      { name: "encryptedTotal", type: "uint256" },
      // TODO: integrate fhEVM SDK encrypt() call here — encMilestoneAmts (externalEuint64[])
      { name: "encMilestoneAmts", type: "uint256[]" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "milestoneIndex", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "milestoneIndex", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "milestoneIndex", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "grantAuditorAccess",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "auditor", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "uint256" }],
    outputs: [],
  },

  // ─── View Functions ──────────────────────────────────────────────────
  {
    type: "function",
    name: "getEscrowInfo",
    stateMutability: "view",
    inputs: [{ name: "escrowId", type: "uint256" }],
    outputs: [
      { name: "client", type: "address" },
      { name: "contractor", type: "address" },
      { name: "auditor", type: "address" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "milestoneCount", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "getTotalDeposit",
    stateMutability: "view",
    inputs: [{ name: "escrowId", type: "uint256" }],
    // Returns euint64 handle — uint256 in ABI
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getReleasedAmount",
    stateMutability: "view",
    inputs: [{ name: "escrowId", type: "uint256" }],
    // Returns euint64 handle — uint256 in ABI
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getMilestone",
    stateMutability: "view",
    inputs: [
      { name: "escrowId", type: "uint256" },
      { name: "milestoneIndex", type: "uint8" },
    ],
    outputs: [
      // euint64 handle — uint256 in ABI
      { name: "encryptedAmount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "milestoneStatus", type: "uint8" },
      { name: "clientApproved", type: "bool" },
      { name: "contractorSubmitted", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "nextEscrowId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
