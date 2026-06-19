export interface MilestoneMeta {
  description: string;
  deliveryNote?: string;
  deliveryUrl?: string;
}

export interface EscrowMeta {
  title: string;
  scopeOfWork: string;
  milestones: MilestoneMeta[];
}

const key = (escrowId: string | bigint) => `sf_meta_${escrowId.toString()}`;

export function saveEscrowMeta(escrowId: bigint, meta: EscrowMeta): void {
  try {
    localStorage.setItem(key(escrowId), JSON.stringify(meta));
  } catch {
    // storage unavailable — silently ignore
  }
}

export function loadEscrowMeta(escrowId: string | bigint): EscrowMeta | null {
  try {
    const raw = localStorage.getItem(key(escrowId));
    if (!raw) return null;
    return JSON.parse(raw) as EscrowMeta;
  } catch {
    return null;
  }
}

export function saveMilestoneDelivery(
  escrowId: string | bigint,
  milestoneIndex: number,
  delivery: { note: string; url: string },
): void {
  try {
    const existing = loadEscrowMeta(escrowId) ?? {
      title: "",
      scopeOfWork: "",
      milestones: [],
    };
    while (existing.milestones.length <= milestoneIndex) {
      existing.milestones.push({ description: "" });
    }
    existing.milestones[milestoneIndex] = {
      ...existing.milestones[milestoneIndex],
      deliveryNote: delivery.note.trim() || undefined,
      deliveryUrl: delivery.url.trim() || undefined,
    };
    localStorage.setItem(key(escrowId), JSON.stringify(existing));
  } catch {
    // storage unavailable
  }
}
