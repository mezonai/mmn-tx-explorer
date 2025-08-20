export class NumberUtil {
  static format(value: number, decimals: number = 6): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  }
}
