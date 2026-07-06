import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getNextStep, getPreviousStep } from '../router/steps';
import { StepButtonLink } from './ui';

export function StepActions(props: { nextLabel?: string; reviewAction?: ReactNode; hideNavigation?: boolean }) {
  const location = useLocation();
  const previousStep = getPreviousStep(location.pathname);
  const nextStep = getNextStep(location.pathname);

  return (
    <div className="mt-1 flex flex-col gap-3 border-t border-zinc-800 pt-4 print:hidden md:flex-row md:items-center md:justify-between">
      <div>{props.hideNavigation ? null : previousStep ? <StepButtonLink to={previousStep.path} emphasis="ghost">上一步</StepButtonLink> : null}</div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {props.reviewAction}
        {props.hideNavigation ? null : nextStep ? (
          <StepButtonLink to={nextStep.path}>{props.nextLabel ?? '下一步'}</StepButtonLink>
        ) : null}
      </div>
    </div>
  );
}
