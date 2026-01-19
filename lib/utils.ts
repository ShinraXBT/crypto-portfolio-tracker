export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function getDeltaClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (value > 0) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (value < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  return 'bg-gray-50 dark:bg-gray-700'
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
