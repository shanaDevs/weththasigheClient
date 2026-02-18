import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs.';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${num.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDiscount(mrp: number | string, sellingPrice: number | string): number {
  const m = typeof mrp === 'string' ? parseFloat(mrp) : mrp;
  const s = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
  if (m <= 0) return 0;
  return Math.round(((m - s) / m) * 100);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    out_for_delivery: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[status] || colors.pending;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    credit: 'bg-blue-100 text-blue-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || colors.pending;
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function getImageUrl(path?: string): string {
  if (!path) return '/placeholder-product.jpg';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  return `${baseUrl}${path}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
