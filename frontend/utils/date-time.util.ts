import { formatDistanceToNowStrict } from 'date-fns';

export class DateTimeUtil {
  static formatRelativeTime(timeString: Date | string | number): string {
    const diff = formatDistanceToNowStrict(timeString, { addSuffix: false });

    if (diff.includes('second')) return diff.replace(/\D/g, '') + 's ago';
    if (diff.includes('minute')) return diff.replace(/\D/g, '') + 'm ago';
    if (diff.includes('hour')) return diff.replace(/\D/g, '') + 'h ago';
    if (diff.includes('day')) return diff.replace(/\D/g, '') + 'd ago';
    if (diff.includes('month')) return diff.replace(/\D/g, '') + 'mo ago';
    if (diff.includes('year')) return diff.replace(/\D/g, '') + 'y ago';

    return diff + ' ago';
  }

  static formatRelativeTimeSec(timestampSec: number): string {
    return this.formatRelativeTime(timestampSec * 1000);
  }

  static toMilliseconds(timestamp: string | number): number {
    const numericTimestamp = typeof timestamp === 'string' ? Number(timestamp) : timestamp;

    // If timestamp is already in milliseconds (13 digits), return as is
    if (numericTimestamp.toString().length === 13) {
      return numericTimestamp;
    }

    // If timestamp is in seconds (10 digits), multiply by 1000
    return numericTimestamp * 1000;
  }
}
