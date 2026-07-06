import { createDefaultBillState } from './bill-template';
import type { BillState, ChargeItem, Discount, Fee, FeeAllocationMethod, Participant, ScopeType } from '../types';

const SHARE_PARAM = 'bill';
const SHARE_VERSION = 1;
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toNonNegativeCents(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : fallback;
}

function toScopeType(value: unknown): ScopeType {
  return value === 'partial' ? 'partial' : 'all';
}

function toFeeAllocationMethod(value: unknown): FeeAllocationMethod {
  return value === 'byAmount' ? 'byAmount' : 'equal';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function normalizeDatetimeLocal(value: unknown, fallback: string): string {
  return typeof value === 'string' && DATETIME_LOCAL_PATTERN.test(value) ? value : fallback;
}

function normalizeParticipant(value: unknown): Participant | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toString(value.id, '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: toString(value.name, '').trim() || '未命名参与人',
    paidAmountInCents: toNonNegativeCents(value.paidAmountInCents, 0),
    active: toBoolean(value.active, true),
  };
}

function normalizeItem(value: unknown): ChargeItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toString(value.id, '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: toString(value.name, '').trim() || '未命名款项',
    amountInCents: toNonNegativeCents(value.amountInCents, 0),
    scopeType: toScopeType(value.scopeType),
    participantIds: toStringArray(value.participantIds),
  };
}

function normalizeDiscount(value: unknown): Discount | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toString(value.id, '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: toString(value.name, '').trim() || '整单优惠',
    amountInCents: toNonNegativeCents(value.amountInCents, 0),
  };
}

function normalizeFee(value: unknown): Fee | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toString(value.id, '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: toString(value.name, '').trim() || '附加费用',
    amountInCents: toNonNegativeCents(value.amountInCents, 0),
    allocationMethod: toFeeAllocationMethod(value.allocationMethod),
    participantIds: toStringArray(value.participantIds),
  };
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBillShare(state: BillState): string {
  return encodeBase64Url(JSON.stringify({ v: SHARE_VERSION, state }));
}

export function decodeBillShare(encoded: string): BillState | null {
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(encoded));
    if (!isRecord(parsed) || parsed.v !== SHARE_VERSION || !isRecord(parsed.state)) {
      return null;
    }

    const defaults = createDefaultBillState();
    return {
      meta: {
        title: toString(parsed.state.meta && isRecord(parsed.state.meta) ? parsed.state.meta.title : undefined, defaults.meta.title),
        createdAt: normalizeDatetimeLocal(
          parsed.state.meta && isRecord(parsed.state.meta) ? parsed.state.meta.createdAt : undefined,
          defaults.meta.createdAt,
        ),
        notes: toString(parsed.state.meta && isRecord(parsed.state.meta) ? parsed.state.meta.notes : undefined, defaults.meta.notes),
      },
      participants: Array.isArray(parsed.state.participants)
        ? parsed.state.participants.map(normalizeParticipant).filter((participant): participant is Participant => participant !== null)
        : [],
      items: Array.isArray(parsed.state.items)
        ? parsed.state.items.map(normalizeItem).filter((item): item is ChargeItem => item !== null)
        : [],
      discounts: Array.isArray(parsed.state.discounts)
        ? parsed.state.discounts.map(normalizeDiscount).filter((discount): discount is Discount => discount !== null)
        : [],
      fees: Array.isArray(parsed.state.fees)
        ? parsed.state.fees.map(normalizeFee).filter((fee): fee is Fee => fee !== null)
        : [],
    };
  } catch {
    return null;
  }
}

export function getBillShareFromSearch(search: string): BillState | null {
  const params = new URLSearchParams(search);
  const raw = params.get(SHARE_PARAM);
  return raw ? decodeBillShare(raw) : null;
}

export function createReviewShareUrl(state: BillState) {
  const encoded = encodeBillShare(state);
  return `${window.location.origin}/review?${SHARE_PARAM}=${encoded}`;
}
