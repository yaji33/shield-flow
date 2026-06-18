export const EscrowStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Disputed: 3,
  Cancelled: 4,
} as const;

export type EscrowStatusKey = keyof typeof EscrowStatus;

export const MilestoneStatus = {
  Pending: 0,
  InProgress: 1,
  Approved: 2,
  Released: 3,
  Disputed: 4,
} as const;
