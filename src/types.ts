export type ScopeType = 'all' | 'partial';
export type FeeAllocationMethod = 'equal' | 'byAmount';

export interface Participant {
  id: string;
  name: string;
  paidAmountInCents: number;
  active: boolean;
}

export interface ChargeItem {
  id: string;
  name: string;
  amountInCents: number;
  scopeType: ScopeType;
  participantIds: string[];
}

export interface Discount {
  id: string;
  name: string;
  amountInCents: number;
}

export interface Fee {
  id: string;
  name: string;
  amountInCents: number;
  allocationMethod: FeeAllocationMethod;
  participantIds: string[];
}

export interface BillMeta {
  title: string;
  createdAt: string;
  notes: string;
}

export interface ItemLine {
  itemId: string;
  itemName: string;
  totalAmountInCents: number;
  shareInCents: number;
  participantCount: number;
  scopeType: ScopeType;
}

export interface FeeLine {
  feeId: string;
  feeName: string;
  totalAmountInCents: number;
  shareInCents: number;
  allocationMethod: FeeAllocationMethod;
}

export interface PersonBreakdown {
  participantId: string;
  originalAmountInCents: number;
  itemLines: ItemLine[];
  discountShareInCents: number;
  feeShareInCents: number;
  feeLines: FeeLine[];
  finalAmountInCents: number;
  paidAmountInCents: number;
  netAmountInCents: number;
}

export interface Transfer {
  fromParticipantId: string;
  toParticipantId: string;
  amountInCents: number;
}

export interface CalculationSummary {
  participants: Participant[];
  itemTotalInCents: number;
  discountTotalInCents: number;
  feeTotalInCents: number;
  payableTotalInCents: number;
  breakdowns: PersonBreakdown[];
  transfers: Transfer[];
  issues: string[];
}

export interface BillState {
  meta: BillMeta;
  participants: Participant[];
  items: ChargeItem[];
  discounts: Discount[];
  fees: Fee[];
}