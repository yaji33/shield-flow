export function isUserCancellation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message;
  return (
    m.includes("User rejected") ||
    m.includes("User denied") ||
    m.includes("rejected the request")
  );
}

export function getContractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Transaction failed";

  const message = error.message;

  if (
    message.includes("User rejected") ||
    message.includes("User denied") ||
    message.includes("rejected the request")
  ) {
    return "Transaction cancelled.";
  }

  if (
    message.includes("does not support threads") ||
    message.includes("cross-origin isolation") ||
    message.includes("crossOriginIsolated") ||
    message.includes("SharedArrayBuffer")
  ) {
    return "FHE encryption needs COOP/COEP headers. Restart the dev server and hard-refresh the page.";
  }

  if (message.includes("eip712Domain")) {
    return "FHE relayer setup failed. Confirm your wallet is on Sepolia, restart the dev server, and try again.";
  }

  if (message.includes("No encrypted value stored yet")) {
    return "No encrypted value yet — fund the escrow first.";
  }

  if (
    message.includes("ACL") ||
    message.includes("not authorized") ||
    message.includes("not allowed")
  ) {
    return "FHE ACL check failed — your wallet is not authorized to decrypt this value.";
  }

  if (
    message.includes("userDecrypt") ||
    message.includes("relayer returned no result")
  ) {
    return "FHE decryption failed — make sure your wallet is the authorized client, contractor, or auditor, and try again.";
  }

  if (message.includes("not_ready_for_decryption")) {
    return "The ciphertext is not yet ready for decryption. Wait a few seconds for the Zama relayer to process it.";
  }

  const shieldFlowReason = message.match(/ShieldFlow: [^.\n"]+/);
  if (shieldFlowReason) return shieldFlowReason[0];

  return message.split("\n")[0] || "Transaction failed";
}
