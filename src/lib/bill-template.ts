import type { BillState } from '../types';

export function getLocalDatetimeInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function createDefaultBillState(): BillState {
  return {
    meta: {
      title: '',
      createdAt: getLocalDatetimeInputValue(),
      notes: '',
    },
    participants: [],
    items: [],
    discounts: [],
    fees: [],
  };
}
