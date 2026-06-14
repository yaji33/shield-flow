# Contract Integration Notes

## Deployed Contracts (Sepolia)

- **ShieldFlowEscrow**: `0x0000000000000000000000000000000000000000`
  - Update `src/lib/contracts/addresses.ts` after deploying via:
    ```bash
    cd ../fhevm-hardhat
    npx hardhat run deploy/deploy_ShieldFlowEscrow.ts --network sepolia
    ```
  - Deployment info saved to: `../fhevm-hardhat/deployments/sepolia/ShieldFlowEscrow.json`

## ABI Source

Extracted from: `../fhevm-hardhat/contracts/ShieldFlowEscrow.sol`
ABI file: `src/lib/contracts/abis.ts`

> Note: fhEVM encrypted types (`euint64`, `externalEuint64`) map to `uint256` in the ABI.
> Actual encrypted handles must be produced by the fhEVM SDK before passing to the contract.

## fhEVM Integration Points

All locations requiring fhEVM SDK `encrypt()` calls are marked with:

```
// TODO: integrate fhEVM SDK encrypt() call here — <paramName>
```

### `src/lib/contracts/abis.ts`
- `deposit.encryptedTotal` — encrypt the total deposit amount as `euint64`
- `deposit.encMilestoneAmts` — encrypt each milestone amount as `euint64[]`

### `src/lib/hooks/use-escrow.ts`
- `useDeposit()` — `encryptedTotal` and `encMilestoneAmts` params need fhEVM encryption
- `useGetEscrow()` / `useGetMilestone()` — return encrypted handles; decrypt with fhEVM SDK `decrypt()`

### `src/app/app/contracts/[id]/page.tsx`
- `getTotalDeposit` result display — decrypt via fhEVM SDK
- `getReleasedAmount` result display — decrypt via fhEVM SDK
- Each milestone's `encryptedAmount` — decrypt via fhEVM SDK

### `src/app/app/create/page.tsx`
- After `createEscrow()`, call `deposit()` with fhEVM-encrypted amounts

## How to Run

```bash
cd web3/ShieldFlow/frontend

# Install dependencies
pnpm install

# Copy and fill env
cp .env.local.example .env.local

# Start dev server
pnpm dev

# Production build
pnpm build
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | Alchemy RPC URL for Sepolia |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (11155111 for Sepolia) |
