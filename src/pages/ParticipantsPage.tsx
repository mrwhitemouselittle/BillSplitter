import { useState } from 'react';
import { StepActions } from '../components/StepActions';
import { formInputClassName, ghostButtonClassName, mainButtonClassName, SectionCard } from '../components/ui';
import { parseCurrencyToCents } from '../lib/format';
import { useBill } from '../state/bill-state';

export function ParticipantsPage() {
  const { state, dispatch } = useBill();
  const [name, setName] = useState('');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [error, setError] = useState('');

  const handleAddParticipant = () => {
    const trimmed = name.trim();
    const cents = parseCurrencyToCents(paidAmount);
    if (!trimmed) {
      setError('参与人姓名不能为空。');
      return;
    }
    if (cents === null) {
      setError('已付金额格式不正确。');
      return;
    }

    dispatch({
      type: 'add_participant',
      payload: {
        id: crypto.randomUUID(),
        name: trimmed,
        paidAmountInCents: cents,
        active: true,
      },
    });
    setName('');
    setPaidAmount('0.00');
    setError('');
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="添加参与人">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>姓名</span>
            <input className={formInputClassName} placeholder="例如：张三" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>已付金额</span>
            <input className={formInputClassName} placeholder="例如：35.00" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className={`w-full md:w-auto ${mainButtonClassName}`} type="button" onClick={handleAddParticipant}>
              添加参与人
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </SectionCard>

      <SectionCard title="参与人">
        {state.participants.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-5 text-sm text-zinc-500">暂无参与人</p>
        ) : (
          <div className="space-y-2">
            {state.participants.map((participant) => (
              <article key={participant.id} className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 md:flex-row md:items-end md:justify-between">
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>姓名</span>
                    <input
                      className={formInputClassName}
                      placeholder="例如：张三"
                      value={participant.name}
                      onChange={(event) =>
                        dispatch({
                          type: 'update_participant',
                          participantId: participant.id,
                          field: 'name',
                          value: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-zinc-300">
                    <span>已付金额</span>
                    <input
                      className={formInputClassName}
                      placeholder="0.00"
                      value={(participant.paidAmountInCents / 100).toFixed(2)}
                      onChange={(event) => {
                        const cents = parseCurrencyToCents(event.target.value);
                        if (cents !== null) {
                          dispatch({
                            type: 'update_participant',
                            participantId: participant.id,
                            field: 'paidAmountInCents',
                            value: cents,
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              <button
                type="button"
                className={ghostButtonClassName}
                onClick={() => dispatch({ type: 'remove_participant', participantId: participant.id })}
              >
                删除
              </button>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <StepActions nextLabel="去录入款项" />
    </div>
  );
}
