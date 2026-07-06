import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StepActions } from '../components/StepActions';
import { ghostButtonClassName, IssueBanner, mainButtonClassName, MetricTile, SectionCard } from '../components/ui';
import { calculateBill } from '../lib/engine';
import { participantLabel } from '../lib/bill-helpers';
import { formatCurrencyFromCents } from '../lib/format';
import { createReviewShareUrl, getBillShareFromSearch } from '../lib/share';
import { useBill, useBillSummary } from '../state/bill-state';

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error('copy_failed');
  }
}

export function ReviewPage() {
  const location = useLocation();
  const { state: liveState } = useBill();
  const sharedState = useMemo(() => getBillShareFromSearch(location.search), [location.search]);
  const sharedParamPresent = new URLSearchParams(location.search).has('bill');
  const liveSummary = useBillSummary();
  const summary = sharedState ? calculateBill(sharedState) : liveSummary;
  const reviewState = sharedState ?? liveState;
  const sharedView = sharedState !== null;
  const shareUrl = createReviewShareUrl(reviewState);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (copyState !== 'copied') {
      return;
    }

    const timer = window.setTimeout(() => setCopyState('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopyShareLink = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 print:hidden md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="款项" value={formatCurrencyFromCents(summary.itemTotalInCents)} />
        <MetricTile label="优惠" value={`-${formatCurrencyFromCents(summary.discountTotalInCents)}`} />
        <MetricTile label="费用" value={formatCurrencyFromCents(summary.feeTotalInCents)} />
        <MetricTile label="应付" value={formatCurrencyFromCents(summary.payableTotalInCents)} />
      </div>

      <div className="print:hidden">
        <IssueBanner issues={summary.issues} />
      </div>

      {sharedParamPresent && !sharedState ? (
        <IssueBanner issues={['分享链接无效或已损坏，当前显示的是本地账单。']} />
      ) : null}

      <div className="print:hidden">
        <SectionCard title="结算总览">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-zinc-800 text-sm">
              <thead>
                <tr>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">参与人</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">原始</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">优惠</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">费用</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">应付</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">已付</th>
                  <th className="border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-left font-medium text-zinc-400">净额</th>
                </tr>
              </thead>
              <tbody>
                {summary.breakdowns.map((entry) => (
                  <tr key={entry.participantId}>
                    <td className="border-b border-zinc-800 px-3 py-2 text-zinc-200">{participantLabel(entry.participantId, reviewState.participants)}</td>
                    <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">{formatCurrencyFromCents(entry.originalAmountInCents)}</td>
                    <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">-{formatCurrencyFromCents(entry.discountShareInCents)}</td>
                    <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">{formatCurrencyFromCents(entry.feeShareInCents)}</td>
                    <td className="border-b border-zinc-800 px-3 py-2 font-medium text-zinc-50">{formatCurrencyFromCents(entry.finalAmountInCents)}</td>
                    <td className="border-b border-zinc-800 px-3 py-2 text-zinc-400">{formatCurrencyFromCents(entry.paidAmountInCents)}</td>
                    <td className={entry.netAmountInCents >= 0 ? 'border-b border-zinc-800 px-3 py-2 font-medium text-emerald-300' : 'border-b border-zinc-800 px-3 py-2 font-medium text-rose-300'}>
                      {entry.netAmountInCents >= 0 ? '收 ' : '补 '}
                      {formatCurrencyFromCents(Math.abs(entry.netAmountInCents))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <section className="receipt-paper rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm md:p-5 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <div className="receipt-header-block flex flex-col gap-3 border-b border-zinc-800 pb-4 md:flex-row md:items-start md:justify-between print:border-stone-200">
          <div>
            <p className="receipt-kicker text-sm font-medium text-amber-300 print:text-stone-700">结算收据</p>
            <h2 className="receipt-title mt-1 font-display text-2xl font-semibold text-zinc-50 md:text-3xl print:text-stone-900">{reviewState.meta.title || '未命名账单'}</h2>
          </div>
          <div className="receipt-meta grid gap-1 text-sm text-zinc-400 md:justify-items-end print:text-stone-500">
            <span>{reviewState.meta.createdAt.replace('T', ' ')}</span>
            <span>{summary.participants.length} 位参与人</span>
          </div>
        </div>

        {reviewState.meta.notes ? <p className="receipt-note mt-4 text-sm leading-6 text-zinc-400 print:text-stone-600">{reviewState.meta.notes}</p> : null}

        <div className="receipt-section mt-6 space-y-3">
          <h3 className="receipt-section-title font-display text-lg font-semibold text-zinc-50 print:text-stone-900">款项</h3>
          {reviewState.items.length === 0 ? (
            <p className="receipt-empty rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-4 text-sm text-zinc-500 print:border-stone-300 print:bg-white print:text-stone-500">暂无款项</p>
          ) : (
            <ul className="receipt-list space-y-2">
              {reviewState.items.map((item) => (
                <li key={item.id} className="receipt-line-item flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 md:flex-row md:items-center md:justify-between print:border-stone-200 print:bg-stone-50/75">
                  <div>
                    <strong className="receipt-item-name block text-sm font-semibold text-zinc-50 print:text-stone-900">{item.name}</strong>
                    <span className="receipt-item-sub mt-1 block text-sm text-zinc-400 print:text-stone-600">
                      {item.scopeType === 'all'
                        ? '全体'
                        : item.participantIds.map((participantId) => participantLabel(participantId, reviewState.participants)).join('、')}
                    </span>
                  </div>
                  <strong className="receipt-amount text-sm font-semibold text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(item.amountInCents)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="receipt-section mt-6 space-y-3">
          <h3 className="receipt-section-title font-display text-lg font-semibold text-zinc-50 print:text-stone-900">个人结果</h3>
          <div className="receipt-people grid gap-3 xl:grid-cols-2">
            {summary.breakdowns.map((entry) => (
              <article key={entry.participantId} className="receipt-person-card rounded-lg border border-zinc-800 bg-zinc-950 p-4 print:border-stone-200 print:bg-white">
                <header className="receipt-person-header flex items-start justify-between gap-4 border-b border-zinc-800 pb-3 print:border-stone-200">
                  <h4 className="receipt-person-name font-display text-lg font-semibold text-zinc-50 print:text-stone-900">{participantLabel(entry.participantId, reviewState.participants)}</h4>
                  <strong className="receipt-person-total text-base font-semibold text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(entry.finalAmountInCents)}</strong>
                </header>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="receipt-detail-line rounded-md bg-zinc-900 px-3 py-2 print:bg-stone-50">
                    <dt className="text-zinc-400 print:text-stone-500">原始</dt>
                    <dd className="font-medium text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(entry.originalAmountInCents)}</dd>
                  </div>
                  <div className="receipt-detail-line rounded-md bg-zinc-900 px-3 py-2 print:bg-stone-50">
                    <dt className="text-zinc-400 print:text-stone-500">优惠</dt>
                    <dd className="font-medium text-zinc-50 print:text-stone-900">-{formatCurrencyFromCents(entry.discountShareInCents)}</dd>
                  </div>
                  <div className="receipt-detail-line rounded-md bg-zinc-900 px-3 py-2 print:bg-stone-50">
                    <dt className="text-zinc-400 print:text-stone-500">费用</dt>
                    <dd className="font-medium text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(entry.feeShareInCents)}</dd>
                  </div>
                  <div className="receipt-detail-line rounded-md bg-zinc-900 px-3 py-2 print:bg-stone-50">
                    <dt className="text-zinc-400 print:text-stone-500">已付</dt>
                    <dd className="font-medium text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(entry.paidAmountInCents)}</dd>
                  </div>
                </dl>
                <p className={entry.netAmountInCents >= 0 ? 'receipt-summary-line mt-3 text-sm font-medium text-emerald-300 print:text-stone-900' : 'receipt-summary-line mt-3 text-sm font-medium text-rose-300 print:text-stone-900'}>
                  {entry.netAmountInCents >= 0 ? '应收 ' : '应补 '}
                  {formatCurrencyFromCents(Math.abs(entry.netAmountInCents))}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="receipt-section mt-6 space-y-3">
          <h3 className="receipt-section-title font-display text-lg font-semibold text-zinc-50 print:text-stone-900">转账</h3>
          {summary.transfers.length === 0 ? (
            <p className="receipt-empty rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-4 text-sm text-zinc-500 print:border-stone-300 print:bg-white print:text-stone-500">无需转账</p>
          ) : (
            <ul className="receipt-transfer-list space-y-2">
              {summary.transfers.map((transfer) => (
                <li key={`${transfer.fromParticipantId}-${transfer.toParticipantId}-${transfer.amountInCents}`} className="receipt-transfer-line flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 md:flex-row md:items-center md:justify-between print:border-stone-200 print:bg-stone-50/75">
                  <span className="receipt-transfer-text text-sm text-zinc-300 print:text-stone-700">
                    {participantLabel(transfer.fromParticipantId, reviewState.participants)} 转给 {participantLabel(transfer.toParticipantId, reviewState.participants)}
                  </span>
                  <strong className="receipt-amount text-sm font-semibold text-zinc-50 print:text-stone-900">{formatCurrencyFromCents(transfer.amountInCents)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <StepActions
        hideNavigation={sharedView}
        reviewAction={
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button className={mainButtonClassName} type="button" onClick={handleCopyShareLink}>
              {copyState === 'copied' ? '链接已复制' : copyState === 'error' ? '复制失败' : '复制分享链接'}
            </button>
            <button className={ghostButtonClassName} type="button" onClick={() => window.print()}>
              打印 / 导出 PDF
            </button>
          </div>
        }
      />
    </div>
  );
}
