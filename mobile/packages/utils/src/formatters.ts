/**
 * Shared percentage and confidence score formatter for CSCRS Mobile.
 *
 * Handles both fractional ratios (0.0 to 1.0) and already-scaled percentages (e.g. 66.67)
 * without multiplying already-scaled percentages by 100 (which previously caused 6667%).
 *
 * Normalization rules:
 * - null, undefined, or NaN -> '0%'
 * - 0 -> '0%'
 * - > 0 and <= 1 -> value * 100 (e.g. 0.6667 -> 66.67%, 1 -> 100%)
 * - > 1 -> already scaled (e.g. 66.67 -> 66.67%)
 * - Clamped at 100% maximum (unless explicitly permitted).
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  const num = Number(value);
  if (num <= 0) {
    return '0%';
  }

  // If num is between 0 and 1, it is a fractional ratio (e.g. 0.6667 or 1.0)
  // If num > 1, it is already a percent (e.g. 66.67 or 92.4)
  let percent = num <= 1 ? num * 100 : num;

  // Clamp at 100% max
  if (percent > 100) {
    percent = 100;
  }

  // Format to requested decimals, stripping trailing zeros if integer
  const formatted = percent.toFixed(decimals);
  const cleanNumber = formatted.endsWith('.0')
    ? formatted.slice(0, -2)
    : formatted.replace(/0+$/, '').replace(/\.$/, '');

  return `${cleanNumber}%`;
}
