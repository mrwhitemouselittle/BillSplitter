import { useBill } from '../state/bill-state';
import { StepActions } from '../components/StepActions';
import { formInputClassName, formTextareaClassName, SectionCard } from '../components/ui';

export function OverviewPage() {
  const { state, dispatch } = useBill();

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="基础信息" accent="tint">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>账单标题</span>
            <input
              className={formInputClassName}
              placeholder="请输入账单标题"
              value={state.meta.title}
              onChange={(event) => dispatch({ type: 'set_meta', field: 'title', value: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>账单时间</span>
            <input
              className={formInputClassName}
              type="datetime-local"
              value={state.meta.createdAt}
              onChange={(event) => dispatch({ type: 'set_meta', field: 'createdAt', value: event.target.value })}
            />
          </label>
        </div>
        <label className="mt-4 grid gap-2 text-sm text-zinc-300">
          <span>备注</span>
          <textarea
            className={formTextareaClassName}
            placeholder="可写入地点、人数或其他说明"
            rows={3}
            value={state.meta.notes}
            onChange={(event) => dispatch({ type: 'set_meta', field: 'notes', value: event.target.value })}
          />
        </label>
      </SectionCard>

      <StepActions nextLabel="去录入参与人" />
    </div>
  );
}
