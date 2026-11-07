const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** 16500 -> "₹16,500" */
export function formatINR(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return inr.format(amount);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
