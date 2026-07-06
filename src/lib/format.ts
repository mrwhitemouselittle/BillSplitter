const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
});

export function formatCurrencyFromCents(amountInCents: number): string {
  return currencyFormatter.format(amountInCents / 100);
}

export function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return '0.00%';
  }

  return `${((numerator / denominator) * 100).toFixed(2)}%`;
}

export function parseCurrencyToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/,/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const [whole, decimal = ''] = normalized.split('.');
  const cents = `${decimal}00`.slice(0, 2);
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(cents, 10);
}

export function toInputAmount(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}