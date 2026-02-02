// Format number as Korean Won currency
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with commas
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Format date for display
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date for input field
export function formatDateInput(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Get color class based on value (positive = green, negative = red)
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

// Get background color class based on alert status
export function getAlertBgColor(dropPercent: number): string {
  if (dropPercent <= -10) return 'bg-red-100 border-red-300';
  if (dropPercent <= -5) return 'bg-yellow-100 border-yellow-300';
  return 'bg-white border-gray-200';
}
