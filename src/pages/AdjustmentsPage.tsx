import { useState } from 'react';
import { StepActions } from '../components/StepActions';
import { CheckboxGroup, formInputClassName, ListTable, mainButtonClassName, SectionCard } from '../components/ui';
import { participantLabel } from '../lib/bill-helpers';
import { formatCurrencyFromCents, parseCurrencyToCents } from '../lib/format';
import { useBill } from '../state/bill-state';
import type { FeeAllocationMethod } from '../types';

const activeSegmentClassName = 'rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950';
const segmentClassName = 'rounded-md px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800';

export function AdjustmentsPage() {
  const { state, dispatch } = useBill();
  const [discountName, setDiscountName] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeAllocationMethod, setFeeAllocationMethod] = useState<FeeAllocationMethod>('equal');
  const [feeParticipantIds, setFeeParticipantIds] = useState<string[]>([]);
  const [discountError, setDiscountError] = useState('');
  const [feeError, setFeeError] = useState('');

  const handleAddDiscount = () => {
    const amountInCents = parseCurrencyToCents(discountAmount);
    if (amountInCents === null || amountInCents <= 0) {
      setDiscountError('优惠金额必须大于 0，且格式正确。');
      return;
    }

    dispatch({
      type: 'add_discount',
      payload: {
        id: crypto.randomUUID(),
        name: discountName.trim() || '整单优惠',
        amountInCents,
      },
    });
    setDiscountName('');
    setDiscountAmount('');
    setDiscountError('');
  };

  const handleAddFee = () => {
    const amountInCents = parseCurrencyToCents(feeAmount);
    if (!feeName.trim()) {
      setFeeError('费用名称不能为空。');
      return;
    }
    if (amountInCents === null || amountInCents <= 0) {
      setFeeError('费用金额必须大于 0，且格式正确。');
      return;
    }
    if (feeParticipantIds.length === 0) {
      setFeeError('费用至少要勾选一位参与人。');
      return;
    }

    dispatch({
      type: 'add_fee',
      payload: {
        id: crypto.randomUUID(),
        name: feeName.trim(),
        amountInCents,
        allocationMethod: feeAllocationMethod,
        participantIds: feeParticipantIds,
      },
    });
    setFeeName('');
    setFeeAmount('');
    setFeeAllocationMethod('equal');
    setFeeParticipantIds([]);
    setFeeError('');
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="整单优惠" accent="tint">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>优惠名称</span>
            <input className={formInputClassName} placeholder="例如：立减优惠" value={discountName} onChange={(event) => setDiscountName(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>优惠金额</span>
            <input className={formInputClassName} value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} placeholder="例如：20.00" />
          </label>
        </div>
        <button className={`w-full md:w-auto ${mainButtonClassName}`} type="button" onClick={handleAddDiscount}>
          添加优惠
        </button>
        {discountError ? <p className="text-sm text-rose-300">{discountError}</p> : null}
        <ListTable
          rows={state.discounts.map((discount) => ({
            id: discount.id,
            title: discount.name,
            subtitle: '按原始消费占比分摊',
            amount: `-${formatCurrencyFromCents(discount.amountInCents)}`,
            onRemove: () => dispatch({ type: 'remove_discount', discountId: discount.id }),
          }))}
        />
      </SectionCard>

      <SectionCard title="附加费用">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>费用名称</span>
            <input className={formInputClassName} placeholder="例如：配送费" value={feeName} onChange={(event) => setFeeName(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>费用金额</span>
            <input className={formInputClassName} value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} placeholder="例如：12.00" />
          </label>
        </div>

        <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            className={feeAllocationMethod === 'equal' ? activeSegmentClassName : segmentClassName}
            onClick={() => setFeeAllocationMethod('equal')}
          >
            按人数均分
          </button>
          <button
            type="button"
            className={feeAllocationMethod === 'byAmount' ? activeSegmentClassName : segmentClassName}
            onClick={() => setFeeAllocationMethod('byAmount')}
          >
            按消费比例
          </button>
        </div>

        <CheckboxGroup
          label="勾选参与这笔费用的人"
          participants={state.participants}
          value={feeParticipantIds}
          onChange={setFeeParticipantIds}
        />

        <button className={`w-full md:w-auto ${mainButtonClassName}`} type="button" onClick={handleAddFee}>
          添加费用
        </button>
        {feeError ? <p className="text-sm text-rose-300">{feeError}</p> : null}
        <ListTable
          rows={state.fees.map((fee) => ({
            id: fee.id,
            title: fee.name,
            subtitle: `${fee.allocationMethod === 'equal' ? '按人数均分' : '按消费比例'} · ${fee.participantIds.map((participantId) => participantLabel(participantId, state.participants)).join('、')}`,
            amount: formatCurrencyFromCents(fee.amountInCents),
            onRemove: () => dispatch({ type: 'remove_fee', feeId: fee.id }),
          }))}
        />
      </SectionCard>

      <StepActions nextLabel="去看结算收据" />
    </div>
  );
}
