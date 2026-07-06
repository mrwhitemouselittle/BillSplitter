import { useEffect } from 'react';
import { useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { calculateBill } from '../lib/engine';
import { getBillShareFromSearch } from '../lib/share';
import { formatCurrencyFromCents } from '../lib/format';
import { billSteps, getStepByPath } from '../router/steps';
import { useBillSummary } from '../state/bill-state';

const siteDescription = 'AA 账单拆分器，适合聚餐、旅行和团体消费，支持参与人、部分消费、优惠费用和转账结算。';

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(property ? 'property' : 'name', name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(pathname: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = `${window.location.origin}${pathname === '/setup' ? '' : pathname}`;
}

export function AppShell() {
  const location = useLocation();
  const currentStep = getStepByPath(location.pathname);
  const sharedBill = useMemo(() => getBillShareFromSearch(location.search), [location.search]);
  const liveSummary = useBillSummary();
  const summary = sharedBill ? calculateBill(sharedBill) : liveSummary;
  const sharedView = sharedBill !== null;

  useEffect(() => {
    const title = sharedBill
      ? `${sharedBill.meta.title || '共享账单'} | AA 账单拆分器`
      : currentStep.index === 1
        ? 'AA 账单拆分器'
        : `${currentStep.title} | AA 账单拆分器`;
    const description = sharedBill
      ? `共享账单预览：${sharedBill.meta.title || '未命名账单'}。${siteDescription}`
      : `${currentStep.title}：${currentStep.caption}。${siteDescription}`;
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setCanonical(currentStep.path);
  }, [currentStep, sharedBill]);

  return (
    <div className="min-h-screen bg-[#0f1115] print:bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:py-6 print:block print:max-w-none print:p-0">
        <header className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-300">{sharedView ? '共享账单预览' : 'AA 账单拆分器'}</p>
              <h1 className="font-display text-2xl font-semibold text-zinc-50 md:text-3xl">
                {sharedBill ? sharedBill.meta.title || '结算收据' : currentStep.title}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm md:min-w-[420px]">
              <span className="rounded-md bg-zinc-800 px-3 py-2 text-zinc-400">
                人数 <strong className="text-zinc-50">{summary.participants.length}</strong>
              </span>
              <span className="rounded-md bg-zinc-800 px-3 py-2 text-zinc-400">
                款项 <strong className="text-zinc-50">{formatCurrencyFromCents(summary.itemTotalInCents)}</strong>
              </span>
              <span className="rounded-md bg-amber-400/10 px-3 py-2 text-amber-200">
                应付 <strong>{formatCurrencyFromCents(summary.payableTotalInCents)}</strong>
              </span>
            </div>
          </div>

          {sharedView ? null : (
            <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="账单步骤">
              {billSteps.map((step) => {
                return (
                  <NavLink
                    key={step.path}
                    className={
                      step.path === currentStep.path
                        ? 'flex items-center gap-2 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-amber-100'
                        : step.index < currentStep.index
                          ? 'flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-emerald-200 transition hover:border-emerald-400/50'
                          : 'flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900'
                    }
                    to={step.path}
                  >
                    <span
                      className={
                        step.path === currentStep.path
                          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-zinc-950'
                          : step.index < currentStep.index
                            ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white'
                            : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300'
                      }
                    >
                      {step.index}
                    </span>
                    <span className="text-sm font-medium">{step.title}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}
        </header>

        <div key={location.pathname} className="route-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
