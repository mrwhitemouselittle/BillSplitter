import { useMemo, useState } from 'react';
import { StepActions } from '../components/StepActions';
import { CheckboxGroup, formInputClassName, ListTable, mainButtonClassName, SectionCard } from '../components/ui';
import { participantLabel } from '../lib/bill-helpers';
import { formatCurrencyFromCents, parseCurrencyToCents } from '../lib/format';
import { useBill } from '../state/bill-state';
import type { ScopeType } from '../types';

const activeSegmentClassName = 'rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950';
const segmentClassName = 'rounded-md px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800';

export function ItemsPage() {
  const { state, dispatch } = useBill();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('all');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const activeParticipants = useMemo(() => state.participants.filter((participant) => participant.active), [state.participants]);

  const handleAddItem = () => {
    const trimmed = name.trim();
    const amountInCents = parseCurrencyToCents(amount);
    const targetIds = scopeType === 'all' ? activeParticipants.map((participant) => participant.id) : participantIds;

    if (!trimmed) {
      setError('款项名称不能为空。');
      return;
    }
    if (amountInCents === null || amountInCents <= 0) {
      setError('款项金额必须大于 0，且格式正确。');
      return;
    }
    if (scopeType === 'partial' && targetIds.length === 0) {
      setError('选择“部分”时必须勾选参与人。');
      return;
    }

    dispatch({
      type: 'add_item',
      payload: {
        id: crypto.randomUUID(),
        name: trimmed,
        amountInCents,
        scopeType,
        participantIds: targetIds,
      },
    });

    setName('');
    setAmount('');
    setScopeType('all');
    setParticipantIds([]);
    setError('');
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="添加款项">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>款项名称</span>
            <input className={formInputClassName} placeholder="例如：午餐" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>金额</span>
            <input className={formInputClassName} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="例如：128.00" />
          </label>
          <div className="flex items-end">
            <button className={`w-full md:w-auto ${mainButtonClassName}`} type="button" onClick={handleAddItem}>
              添加款项
            </button>
          </div>
        </div>

        <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            className={scopeType === 'all' ? activeSegmentClassName : segmentClassName}
            onClick={() => {
              setScopeType('all');
              setParticipantIds([]);
            }}
          >
            全体参与
          </button>
          <button
            type="button"
            className={scopeType === 'partial' ? activeSegmentClassName : segmentClassName}
            onClick={() => setScopeType('partial')}
          >
            部分参与
          </button>
        </div>

        {scopeType === 'partial' ? (
          <CheckboxGroup
            label="勾选参与这笔消费的人"
            participants={activeParticipants}
            value={participantIds}
            onChange={setParticipantIds}
          />
        ) : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </SectionCard>

      <SectionCard title="款项">
        <ListTable
          rows={state.items.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle:
              item.scopeType === 'all'
                ? '全体参与'
                : `部分参与：${item.participantIds.map((participantId) => participantLabel(participantId, state.participants)).join('、')}`,
            amount: formatCurrencyFromCents(item.amountInCents),
            onRemove: () => dispatch({ type: 'remove_item', itemId: item.id }),
          }))}
        />
      </SectionCard>

      <StepActions nextLabel="去录入优惠和费用" />
    </div>
  );
}
