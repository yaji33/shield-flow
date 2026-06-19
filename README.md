<div align="center">

<img width="100" height="100" alt="ShieldFlow Logo" src="https://github.com/user-attachments/assets/9c1384f3-0c34-442b-89a0-faefd1701791" />

# ShieldFlow

**Confidential milestone escrow on Ethereum, powered by Zama fhEVM.**

ShieldFlow lets a client lock ETH into a milestone-based escrow where every amount — total deposit, per-milestone allocation, and running released balance — is stored as an FHE-encrypted ciphertext on-chain. Only the authorized client, contractor, or auditor can decrypt them. Third parties and blockchain explorers see nothing but opaque handles.

[![Built for Zama Season 3](https://img.shields.io/badge/Zama-Season%203%20Hackathon-blue?style=flat-square)](https://www.zama.ai/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia-orange?style=flat-square)](https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621)
[![Tests](https://img.shields.io/badge/Tests-20%20passing-brightgreen?style=flat-square)](#tests)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20BSD--3--Clause-lightgrey?style=flat-square)](./LICENSE)

[Contract on Etherscan](https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621) · [Frontend](#running-locally) · [Tests](#tests)

</div>

---

## Value Proposition

Traditional on-chain escrows expose all payment terms publicly. Anyone can inspect the contract, see every milestone amount, and track cumulative payouts in real time. For freelance work, business contracts, or sensitive service agreements, this is a fundamental privacy problem.

ShieldFlow solves it by keeping the financial layer confidential:

- Amounts are stored as `euint64` FHE ciphertexts — unreadable without an authorized decryption request
- The escrow logic (submit, approve, release) runs directly on encrypted values using FHE arithmetic — no plaintext ever appears on-chain during computation
- Access is ACL-gated at the contract level: only wallets explicitly granted by `FHE.allow()` can decrypt through the Zama KMS relayer

The workflow itself stays familiar: two parties agree on deliverables and payment, funds are locked, and ETH is released milestone by milestone — just without leaking the amounts to the world.

---

## Target Users

| Role | What they do |
|---|---|
| **Client** | Creates the escrow, defines milestones, funds it, reviews submissions, and releases payments |
| **Contractor** | Receives the share link, submits work with a delivery note or link, withdraws released ETH |
| **Auditor** | A trusted third party (optional). Client grants on-chain read access; auditor can decrypt amounts if a dispute arises |

Practical use cases: freelance development, design projects, legal retainers, agency engagements, grant disbursements — any situation where two parties want trustless payment enforcement without public financial disclosure.

---

## How It Works

### 1. Create

The client fills in the project title, scope of work, contractor address, and up to 10 milestones (each with a deliverable description, ETH amount, and deadline). An optional auditor address can be set.

### 2. Fund

Two wallet transactions:
1. **Register** — saves parties and milestone structure on-chain (no ETH moves)
2. **Deposit** — client submits FHE-encrypted amounts generated in the browser by the Zama relayer SDK. The contract calls `FHE.fromExternal()` to convert them to on-chain ciphertexts and grants ACL access to client and contractor

### 3. Work & Submit

The contractor does the work off-platform (code, design, document — whatever was agreed), then submits the milestone in ShieldFlow with an optional delivery link and note. This calls `submitMilestone()` on-chain.

### 4. Approve & Release

The client reviews the delivery, calls `approveMilestone()`, then `releaseMilestone()`. The contract performs **encrypted addition** on the running `releasedAmount` ciphertext — no intermediate plaintext appears on-chain.

### 5. Withdraw

The contractor calls `withdrawReleased()` to transfer ETH to their wallet.

### 6. Reveal (any time)

Any authorized party can click the lock icon next to any amount in the UI. The frontend generates an ephemeral ML-KEM keypair, the user signs an EIP-712 proof in MetaMask, and the Zama KMS checks the on-chain ACL before returning the re-encrypted plaintext. Decryption happens locally in the browser.

---

## FHE Privacy Model

| Data | On-chain storage | Readable by |
|---|---|---|
| Total deposit | `euint64` ciphertext | Client, Contractor, Auditor (if granted) |
| Released amount | `euint64` ciphertext | Client, Contractor, Auditor |
| Per-milestone amount | `euint64` ciphertext | Client, Contractor, Auditor |
| Party addresses | Plaintext `address` | Everyone |
| ETH transfer amounts | Plaintext `uint256` | Everyone |

Party addresses and ETH transfer amounts are inherently public — Ethereum requires them for transaction routing. The `euint64` ciphertexts carry the same values confidentially, demonstrating the encrypt/decrypt cycle via the Zama KMS.

---

## Architecture

```
ShieldFlow/
├── fhevm-hardhat/
│   ├── contracts/
│   │   └── ShieldFlowEscrow.sol       # FHE escrow contract
│   ├── test/
│   │   └── ShieldFlowEscrow.test.ts   # 20 Hardhat tests
│   └── hardhat.config.ts
│
└── frontend/
    └── src/
        ├── app/app/
        │   ├── create/                # 3-step creation wizard
        │   ├── contracts/             # Escrow list
        │   ├── contracts/[id]/        # Detail: milestone flow + FHE decrypt UI
        │   ├── dashboard/             # Stats overview
        │   └── activity/              # Event log
        ├── components/
        │   ├── encrypted-value.tsx    # Lock icon → userDecrypt → ETH display
        │   ├── fund-escrow-form.tsx   # Deposit with FHE encryption
        │   └── escrow-role-banner.tsx # Context banner per role
        └── lib/
            ├── fhe/fhevm.ts           # encryptUint64Batch + decryptHandle
            ├── hooks/use-escrow.ts    # All contract read/write hooks
            ├── escrow-meta.ts         # Off-chain metadata (localStorage)
            └── contracts/             # ABI + addresses
```

---

## Contract

**Network:** Ethereum Sepolia  
**Address:** `0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621`  
**Verified:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xF6105e05B9d8cB39151F56b1e4AA411C8F2bF621)

### Key functions

| Function | Caller | Description |
|---|---|---|
| `createEscrow` | Client | Register parties and milestones |
| `deposit` | Client | Fund with FHE-encrypted amounts |
| `submitMilestone` | Contractor | Signal work is done |
| `approveMilestone` | Client | Accept the submission |
| `releaseMilestone` | Client | Transfer ETH + update encrypted running total |
| `withdrawReleased` | Contractor | Pull released ETH to wallet |
| `grantAuditorAccess` | Client | `FHE.allow()` all handles for auditor |
| `cancelEscrow` | Client | Cancel before funding |

### FHE operations used

| Operation | Where |
|---|---|
| `FHE.fromExternal()` | Convert browser-encrypted handles to on-chain ciphertexts |
| `FHE.add()` | Accumulate `releasedAmount` without decrypting |
| `FHE.lt()` + `FHE.select()` | Overflow guard on encrypted addition |
| `FHE.allow()` / `FHE.allowThis()` | ACL grants for client, contractor, auditor, contract |

---

## Tests

**20 tests — all passing** (Hardhat + `@fhevm/mock-utils` coprocessor)

| Suite | Tests | Coverage |
|---|---|---|
| `createEscrow` | 6 | Single/multi milestone, self-as-contractor revert, milestone count bounds, deadline mismatch, sequential IDs |
| `deposit` | 3 | Encrypted deposit, non-client revert, double-deposit revert |
| `Milestone flow` | 5 | Submit → approve → release, all-milestones completion, role guards, release-without-approve revert |
| `ACL` | 4 | Handle availability post-deposit, auditor grant + event, stranger grant revert, mock decryption of `euint64` handle |
| `cancelEscrow` | 2 | Cancel pending escrow, cancel active escrow revert |

```bash
cd fhevm-hardhat
npm install
npm run test
```

---

## Tech Stack

### Contract
- Solidity `^0.8.24`
- `@fhevm/solidity` — `FHE`, `euint64`, `ebool`, `externalEuint64`, `ZamaEthereumConfig`
- Hardhat + `@fhevm/mock-utils` for local testing

### Frontend
- Next.js 15 (App Router), React 19, TypeScript
- wagmi v3, viem v2, TanStack Query — Ethereum interaction
- `@zama-fhe/relayer-sdk` v0.4.1 — browser-side FHE encryption and `userDecrypt`
- Tailwind CSS v4, Sonner (toasts), Hugeicons

### Infrastructure
- Ethereum Sepolia testnet
- Zama KMS relayer — EIP-712–gated decryption
- COOP/COEP headers required in the Next.js server for SharedArrayBuffer (FHE WASM)

---

## Running Locally

### Contract (optional — already deployed)

```bash
cd fhevm-hardhat
npm install
npm run test          # run all tests against mock coprocessor
npm run compile       # compile contracts
```

### Frontend

```bash
cd frontend
pnpm install

cp .env.example .env.local
# set NEXT_PUBLIC_ALCHEMY_RPC_URL to your Alchemy Sepolia endpoint

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and connect MetaMask on **Sepolia**.

| Environment variable | Value |
|---|---|
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | Alchemy Sepolia RPC URL |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |

---

## License

- `frontend/` — [MIT](./LICENSE)
- `fhevm-hardhat/` — [BSD 3-Clause Clear](./fhevm-hardhat/LICENSE) (Zama template)
