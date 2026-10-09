// Locale-aware formatting helpers for DynForge.
// Currency is always Vietnamese Dong (₫); only the grouping/locale changes.

type Lang = 'en' | 'vi';

function localeFor(lang: Lang): string {
  return lang === 'vi' ? 'vi-VN' : 'en-GB';
}

function toDate(date: Date | string | number): Date {
  return date instanceof Date ? date : new Date(date);
}

/** Format a date (no time). e.g. vi: "08 thg 10, 2026" · en: "08 Oct 2026" */
export function formatDate(
  date: Date | string | number,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(localeFor(lang), options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a date together with time. */
export function formatDateTime(
  date: Date | string | number,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(localeFor(lang), options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format an amount in Vietnamese Dong. */
export function formatCurrency(vnd: number, lang: Lang = 'vi'): string {
  return new Intl.NumberFormat(localeFor(lang)).format(vnd || 0) + '₫';
}
