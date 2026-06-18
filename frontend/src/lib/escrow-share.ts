export function escrowPath(escrowId: bigint | number | string): string {
  return `/app/contracts/${escrowId.toString()}`;
}

export function escrowShareUrl(escrowId: bigint | number | string): string {
  if (typeof window === "undefined") {
    return escrowPath(escrowId);
  }
  return `${window.location.origin}${escrowPath(escrowId)}`;
}
