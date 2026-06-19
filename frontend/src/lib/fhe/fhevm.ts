"use client";

import { bytesToHex, type Hex } from "viem";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

type BrowserEthereum = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const UINT64_MAX = BigInt("18446744073709551615");

let sdkInitialized = false;
let cachedUser: string | null = null;
let instancePromise: Promise<FhevmInstance> | null = null;

export function resetFhevmInstance() {
  cachedUser = null;
  instancePromise = null;
}

export function assertUint64Wei(wei: bigint, label = "Amount"): bigint {
  if (wei < BigInt(0) || wei > UINT64_MAX) {
    throw new Error(`${label} exceeds uint64 range (max ~18.4 ETH in wei)`);
  }
  return wei;
}

function assertCrossOriginIsolation() {
  if (typeof window === "undefined") return;

  if (!window.crossOriginIsolated) {
    throw new Error(
      "FHE encryption requires cross-origin isolation (COOP/COEP headers). Restart the dev server so Next.js can serve them, then hard-refresh this page.",
    );
  }
}

export async function getFhevmInstance(
  userAddress: `0x${string}`,
): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM SDK is only available in the browser");
  }

  assertCrossOriginIsolation();

  const provider = (window as Window & { ethereum?: BrowserEthereum }).ethereum;
  if (!provider) {
    throw new Error("No wallet provider found. Install MetaMask.");
  }

  const key = userAddress.toLowerCase();
  if (cachedUser !== key) {
    cachedUser = key;
    instancePromise = null;
  }

  if (!instancePromise) {
    instancePromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import(
        "@zama-fhe/relayer-sdk/web"
      );

      if (!sdkInitialized) {
        await initSDK();
        sdkInitialized = true;
      }

      return createInstance({
        ...SepoliaConfig,
        network: provider,
      });
    })();
  }

  return instancePromise;
}

export async function decryptHandle(params: {
  handle: `0x${string}`;
  contractAddress: `0x${string}`;
  userAddress: `0x${string}`;
}): Promise<bigint> {
  if (typeof window === "undefined") {
    throw new Error("FHE decryption is only available in the browser");
  }

  assertCrossOriginIsolation();

  if (
    !params.handle ||
    params.handle === ZERO_HANDLE
  ) {
    throw new Error("No encrypted value stored yet for this field");
  }

  const provider = (window as Window & { ethereum?: BrowserEthereum })
    .ethereum;
  if (!provider) throw new Error("No wallet provider found. Install MetaMask.");

  const instance = await getFhevmInstance(params.userAddress);
  const { privateKey, publicKey } = instance.generateKeypair();

  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;

  const eip712 = instance.createEIP712(
    publicKey,
    [params.contractAddress],
    startTimestamp,
    durationDays,
  );

  // MetaMask requires chainId as a plain number in EIP-712 domain
  const signableData = {
    types: eip712.types,
    primaryType: eip712.primaryType,
    domain: {
      ...eip712.domain,
      chainId: Number(eip712.domain.chainId),
    },
    message: eip712.message,
  };

  const signature = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [params.userAddress, JSON.stringify(signableData)],
  })) as string;

  const results = await instance.userDecrypt(
    [{ handle: params.handle, contractAddress: params.contractAddress }],
    privateKey,
    publicKey,
    signature,
    [params.contractAddress],
    params.userAddress,
    startTimestamp,
    durationDays,
  );

  // Result is keyed by handle bytes32 hex; try both casing forms
  const clearValue =
    results[params.handle] ??
    results[params.handle.toLowerCase() as `0x${string}`];

  if (clearValue === undefined) {
    throw new Error(
      "Decryption failed: the relayer returned no result for this handle. " +
        "Make sure your wallet is the authorized client, contractor, or auditor.",
    );
  }

  return clearValue as bigint;
}

export async function encryptUint64Batch(params: {
  contractAddress: `0x${string}`;
  userAddress: `0x${string}`;
  values: bigint[];
}): Promise<{
  handles: bigint[];
  handlesHex: Hex[];
  inputProof: Hex;
}> {
  const instance = await getFhevmInstance(params.userAddress);
  const input = instance.createEncryptedInput(
    params.contractAddress,
    params.userAddress,
  );

  for (const value of params.values) {
    assertUint64Wei(value);
    input.add64(value);
  }

  const encrypted = await input.encrypt();
  const handlesHex = encrypted.handles.map(
    (handle) => bytesToHex(handle) as Hex,
  );

  return {
    handles: handlesHex.map((h) => BigInt(h)),
    handlesHex,
    inputProof: bytesToHex(encrypted.inputProof) as Hex,
  };
}
