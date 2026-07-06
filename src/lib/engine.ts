import type {
  BillState,
  CalculationSummary,
  ChargeItem,
  Fee,
  FeeLine,
  Participant,
  PersonBreakdown,
  Transfer,
} from '../types';

interface ShareResult {
  shares: Map<string, number>;
  anchorId: string | null;
}

function activeParticipants(participants: Participant[]): Participant[] {
  return participants.filter((participant) => participant.active);
}

function resolveChargeParticipants(item: ChargeItem, activeIds: Set<string>): string[] {
  const participantIds = item.scopeType === 'all' ? Array.from(activeIds) : item.participantIds.filter((id) => activeIds.has(id));
  return Array.from(new Set(participantIds));
}

function resolveFeeParticipants(fee: Fee, activeIds: Set<string>): string[] {
  return fee.participantIds.filter((id) => activeIds.has(id));
}

function pickAnchorId(candidateIds: string[], baseAmounts: Map<string, number>): string | null {
  if (candidateIds.length === 0) {
    return null;
  }

  return [...candidateIds].sort((left, right) => {
    const baseDiff = (baseAmounts.get(right) ?? 0) - (baseAmounts.get(left) ?? 0);
    if (baseDiff !== 0) {
      return baseDiff;
    }
    return left.localeCompare(right, 'zh-CN');
  })[0];
}

function splitEqually(totalInCents: number, participantIds: string[], baseAmounts: Map<string, number>): ShareResult {
  const shares = new Map<string, number>();
  if (participantIds.length === 0 || totalInCents <= 0) {
    return { shares, anchorId: null };
  }

  const baseShare = Math.floor(totalInCents / participantIds.length);
  const remainder = totalInCents - baseShare * participantIds.length;
  for (const participantId of participantIds) {
    shares.set(participantId, baseShare);
  }

  const anchorId = pickAnchorId(participantIds, baseAmounts);
  if (anchorId) {
    shares.set(anchorId, (shares.get(anchorId) ?? 0) + remainder);
  }

  return { shares, anchorId };
}

function splitByAmount(totalInCents: number, participantIds: string[], baseAmounts: Map<string, number>): ShareResult {
  const shares = new Map<string, number>();
  if (participantIds.length === 0 || totalInCents <= 0) {
    return { shares, anchorId: null };
  }

  const denominator = participantIds.reduce((sum, participantId) => sum + (baseAmounts.get(participantId) ?? 0), 0);
  if (denominator <= 0) {
    return splitEqually(totalInCents, participantIds, baseAmounts);
  }

  let allocated = 0;
  for (const participantId of participantIds) {
    const rawShare = Math.floor((totalInCents * (baseAmounts.get(participantId) ?? 0)) / denominator);
    shares.set(participantId, rawShare);
    allocated += rawShare;
  }

  const anchorId = pickAnchorId(participantIds, baseAmounts);
  if (anchorId) {
    shares.set(anchorId, (shares.get(anchorId) ?? 0) + (totalInCents - allocated));
  }

  return { shares, anchorId };
}

function buildTransfers(breakdowns: PersonBreakdown[]): Transfer[] {
  const creditors = breakdowns
    .filter((entry) => entry.netAmountInCents > 0)
    .map((entry) => ({ participantId: entry.participantId, amountInCents: entry.netAmountInCents }));
  const debtors = breakdowns
    .filter((entry) => entry.netAmountInCents < 0)
    .map((entry) => ({ participantId: entry.participantId, amountInCents: Math.abs(entry.netAmountInCents) }));

  const transfers: Transfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountInCents = Math.min(creditor.amountInCents, debtor.amountInCents);

    if (amountInCents > 0) {
      transfers.push({
        fromParticipantId: debtor.participantId,
        toParticipantId: creditor.participantId,
        amountInCents,
      });
    }

    creditor.amountInCents -= amountInCents;
    debtor.amountInCents -= amountInCents;

    if (creditor.amountInCents === 0) {
      creditorIndex += 1;
    }
    if (debtor.amountInCents === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}

export function calculateBill(state: BillState): CalculationSummary {
  const participants = activeParticipants(state.participants);
  const participantIds = new Set(participants.map((participant) => participant.id));
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const issues: string[] = [];
  const originalAmounts = new Map<string, number>();
  const itemLines = new Map<string, PersonBreakdown['itemLines']>();
  const feeLines = new Map<string, FeeLine[]>();
  const discountShares = new Map<string, number>();
  const feeShares = new Map<string, number>();

  for (const participant of participants) {
    originalAmounts.set(participant.id, 0);
    itemLines.set(participant.id, []);
    feeLines.set(participant.id, []);
    discountShares.set(participant.id, 0);
    feeShares.set(participant.id, 0);
  }

  let itemTotalInCents = 0;
  for (const item of state.items) {
    itemTotalInCents += item.amountInCents;
    const resolvedParticipants = resolveChargeParticipants(item, participantIds);
    if (resolvedParticipants.length === 0) {
      issues.push(`款项“${item.name}”没有有效参与人。`);
      continue;
    }

    const shareResult = splitEqually(item.amountInCents, resolvedParticipants, originalAmounts);
    for (const participantId of resolvedParticipants) {
      const shareInCents = shareResult.shares.get(participantId) ?? 0;
      originalAmounts.set(participantId, (originalAmounts.get(participantId) ?? 0) + shareInCents);
      itemLines.get(participantId)?.push({
        itemId: item.id,
        itemName: item.name,
        totalAmountInCents: item.amountInCents,
        shareInCents,
        participantCount: resolvedParticipants.length,
        scopeType: item.scopeType,
      });
    }
  }

  const payableBaseInCents = Array.from(originalAmounts.values()).reduce((sum, amount) => sum + amount, 0);

  let discountTotalInCents = 0;
  for (const discount of state.discounts) {
    discountTotalInCents += discount.amountInCents;
    if (participants.length === 0) {
      issues.push(`优惠“${discount.name}”无法分摊，因为没有有效参与人。`);
      continue;
    }

    const shareResult = splitByAmount(discount.amountInCents, participants.map((participant) => participant.id), originalAmounts);
    for (const participant of participants) {
      discountShares.set(participant.id, (discountShares.get(participant.id) ?? 0) + (shareResult.shares.get(participant.id) ?? 0));
    }
  }

  let feeTotalInCents = 0;
  for (const fee of state.fees) {
    feeTotalInCents += fee.amountInCents;
    const resolvedParticipants = resolveFeeParticipants(fee, participantIds);
    if (resolvedParticipants.length === 0) {
      issues.push(`费用“${fee.name}”没有有效参与人。`);
      continue;
    }

    const shareResult = fee.allocationMethod === 'byAmount'
      ? splitByAmount(fee.amountInCents, resolvedParticipants, originalAmounts)
      : splitEqually(fee.amountInCents, resolvedParticipants, originalAmounts);

    for (const participantId of resolvedParticipants) {
      const shareInCents = shareResult.shares.get(participantId) ?? 0;
      feeShares.set(participantId, (feeShares.get(participantId) ?? 0) + shareInCents);
      feeLines.get(participantId)?.push({
        feeId: fee.id,
        feeName: fee.name,
        totalAmountInCents: fee.amountInCents,
        shareInCents,
        allocationMethod: fee.allocationMethod,
      });
    }
  }

  const breakdowns = participants.map<PersonBreakdown>((participant) => {
    const originalAmountInCents = originalAmounts.get(participant.id) ?? 0;
    const discountShareInCents = discountShares.get(participant.id) ?? 0;
    const feeShareInCents = feeShares.get(participant.id) ?? 0;
    const finalAmountInCents = originalAmountInCents - discountShareInCents + feeShareInCents;
    const paidAmountInCents = participant.paidAmountInCents;
    const netAmountInCents = paidAmountInCents - finalAmountInCents;

    return {
      participantId: participant.id,
      originalAmountInCents,
      itemLines: itemLines.get(participant.id) ?? [],
      discountShareInCents,
      feeShareInCents,
      feeLines: feeLines.get(participant.id) ?? [],
      finalAmountInCents,
      paidAmountInCents,
      netAmountInCents,
    };
  });

  const payableTotalInCents = breakdowns.reduce((sum, entry) => sum + entry.finalAmountInCents, 0);
  const paidTotalInCents = breakdowns.reduce((sum, entry) => sum + entry.paidAmountInCents, 0);
  if (payableTotalInCents < 0) {
    issues.push('优惠总额超过应付总额，结果出现负数。');
  }
  if (payableTotalInCents !== paidTotalInCents) {
    issues.push('当前已付总额与应付总额不一致，转账结果仅供参考。');
  }
  if (state.items.length === 0) {
    issues.push('请至少添加一笔款项。');
  }
  if (participants.length === 0) {
    issues.push('请至少添加一位参与人。');
  }

  return {
    participants,
    itemTotalInCents,
    discountTotalInCents,
    feeTotalInCents,
    payableTotalInCents,
    breakdowns,
    transfers: buildTransfers(breakdowns),
    issues,
  };
}