import { createContext, useContext, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { createDefaultBillState } from '../lib/bill-template';
import { calculateBill } from '../lib/engine';
import type { BillState, ChargeItem, Discount, Fee, Participant } from '../types';

export type BillAction =
  | { type: 'set_meta'; field: 'title' | 'createdAt' | 'notes'; value: string }
  | { type: 'add_participant'; payload: Participant }
  | { type: 'update_participant'; participantId: string; field: 'name' | 'paidAmountInCents'; value: string | number }
  | { type: 'remove_participant'; participantId: string }
  | { type: 'add_item'; payload: ChargeItem }
  | { type: 'remove_item'; itemId: string }
  | { type: 'add_discount'; payload: Discount }
  | { type: 'remove_discount'; discountId: string }
  | { type: 'add_fee'; payload: Fee }
  | { type: 'remove_fee'; feeId: string };

function reducer(state: BillState, action: BillAction): BillState {
  switch (action.type) {
    case 'set_meta':
      return {
        ...state,
        meta: {
          ...state.meta,
          [action.field]: action.value,
        },
      };
    case 'add_participant':
      return { ...state, participants: [...state.participants, action.payload] };
    case 'update_participant':
      return {
        ...state,
        participants: state.participants.map((participant) =>
          participant.id === action.participantId
            ? {
                ...participant,
                [action.field]: action.value,
              }
            : participant,
        ),
      };
    case 'remove_participant': {
      const participants = state.participants.filter((participant) => participant.id !== action.participantId);
      const items = state.items.map((item) => ({
        ...item,
        participantIds: item.participantIds.filter((participantId) => participantId !== action.participantId),
      }));
      const fees = state.fees.map((fee) => ({
        ...fee,
        participantIds: fee.participantIds.filter((participantId) => participantId !== action.participantId),
      }));
      return { ...state, participants, items, fees };
    }
    case 'add_item':
      return { ...state, items: [...state.items, action.payload] };
    case 'remove_item':
      return { ...state, items: state.items.filter((item) => item.id !== action.itemId) };
    case 'add_discount':
      return { ...state, discounts: [...state.discounts, action.payload] };
    case 'remove_discount':
      return { ...state, discounts: state.discounts.filter((discount) => discount.id !== action.discountId) };
    case 'add_fee':
      return { ...state, fees: [...state.fees, action.payload] };
    case 'remove_fee':
      return { ...state, fees: state.fees.filter((fee) => fee.id !== action.feeId) };
    default:
      return state;
  }
}

interface BillContextValue {
  state: BillState;
  dispatch: Dispatch<BillAction>;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider(props: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createDefaultBillState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <BillContext.Provider value={value}>{props.children}</BillContext.Provider>;
}

export function useBill() {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBill must be used within BillProvider');
  }
  return context;
}

export function useBillSummary() {
  const { state } = useBill();
  return useMemo(() => calculateBill(state), [state]);
}
