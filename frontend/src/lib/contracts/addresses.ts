/**
 * Deployed contract addresses per network.
 * Sepolia address: fill from deployments/sepolia/ShieldFlowEscrow.json once deployed.
 * Source: web3/ShieldFlow/fhevm-hardhat/deployments/
 */
export const CONTRACT_ADDRESSES = {
  sepolia: {
    ShieldFlowEscrow: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const;
