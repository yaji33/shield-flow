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

  const shieldFlowReason = message.match(/ShieldFlow: [^.\n"]+/);
  if (shieldFlowReason) return shieldFlowReason[0];

  return message.split("\n")[0] || "Transaction failed";
}
