import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(time: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const offsetMinutes = date.getTimezoneOffset();
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absOffsetMinutes / 60);
  const offsetMins = absOffsetMinutes % 60;
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const tzString = `${sign}${pad(offsetHours)}:${pad(offsetMins)} UTC`;

  // Format the date in the user's local timezone
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return `${formattedDate} (${tzString})`;
}
