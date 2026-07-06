import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { Participant } from '../types';

const inputClassName =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';

const secondaryButtonClassName =
  'inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800';

const primaryButtonClassName =
  'inline-flex items-center justify-center rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300';

export const formInputClassName = inputClassName;
export const formTextareaClassName = `${inputClassName} resize-y`;
export const ghostButtonClassName = secondaryButtonClassName;
export const mainButtonClassName = primaryButtonClassName;

export function PageIntro(props: { eyebrow?: string; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      {props.eyebrow ? <p className="text-sm font-medium text-amber-300">{props.eyebrow}</p> : null}
      <h1 className="font-display text-2xl font-semibold text-zinc-50 md:text-3xl">{props.title}</h1>
    </div>
  );
}

export function SectionCard(props: { title: string; description?: string; children: ReactNode; accent?: 'plain' | 'tint' }) {
  return (
    <section
      className={
        props.accent === 'tint'
          ? 'rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 shadow-sm md:p-5'
          : 'rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm md:p-5'
      }
    >
      <div className={props.description ? 'mb-4 space-y-1' : 'mb-4'}>
        <h2 className="font-display text-lg font-semibold text-zinc-50">{props.title}</h2>
        {props.description ? <p className="text-sm leading-6 text-zinc-400">{props.description}</p> : null}
      </div>
      <div className="space-y-4">{props.children}</div>
    </section>
  );
}

export function StepButtonLink(props: { to: string; children: ReactNode; emphasis?: 'primary' | 'ghost' }) {
  return (
    <NavLink
      className={
        props.emphasis === 'ghost'
          ? secondaryButtonClassName
          : primaryButtonClassName
      }
      to={props.to}
    >
      {props.children}
    </NavLink>
  );
}

export function MetricTile(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm">
      <span className="block text-xs text-zinc-400">{props.label}</span>
      <strong className="mt-1 block text-xl font-semibold text-zinc-50">{props.value}</strong>
      {props.hint ? <small className="mt-1 block text-xs text-zinc-400">{props.hint}</small> : null}
    </div>
  );
}

export function CheckboxGroup(props: {
  label: string;
  participants: Participant[];
  value: string[];
  onChange: (participantIds: string[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-300">{props.label}</legend>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {props.participants.map((participant) => {
          const checked = props.value.includes(participant.id);
          return (
            <label
              key={participant.id}
              className={
                checked
                  ? 'flex items-center gap-3 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-2.5 text-amber-100 transition'
                  : 'flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900'
              }
            >
              <input
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-amber-400 focus:ring-amber-400/30"
                type="checkbox"
                checked={checked}
                onChange={() =>
                  props.onChange(checked ? props.value.filter((id) => id !== participant.id) : [...props.value, participant.id])
                }
              />
              <span>{participant.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ListTable(props: {
  rows: Array<{ id: string; title: string; subtitle: string; amount: string; onRemove: () => void }>;
}) {
  if (props.rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-5 text-sm text-zinc-500">暂无内容</p>;
  }

  return (
    <div className="space-y-2">
      {props.rows.map((row) => (
        <article
          key={row.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 md:flex-row md:items-start md:justify-between"
        >
          <div>
            <strong className="text-sm font-semibold text-zinc-50">{row.title}</strong>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{row.subtitle}</p>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            <strong className="text-sm font-semibold text-zinc-50">{row.amount}</strong>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
              onClick={row.onRemove}
            >
              删除
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function IssueBanner(props: { issues: string[] }) {
  if (props.issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">
      {props.issues.map((issue) => (
        <p key={issue}>{issue}</p>
      ))}
    </div>
  );
}
