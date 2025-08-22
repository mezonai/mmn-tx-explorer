export class NumberUtil {
  static roundUp(value: number, decimals: number = 6): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const multiplier = Math.pow(10, decimals);
    const roundedUp = Math.ceil(num * multiplier) / multiplier;
    return roundedUp.toFixed(decimals);
  }

  static roundDown(value: number, decimals: number = 6): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const multiplier = Math.pow(10, decimals);
    const roundedDown = Math.floor(num * multiplier) / multiplier;
    return roundedDown.toFixed(decimals);
  }

  static formatWithCommas(value: number | string): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    return num.toLocaleString('en-US');
  }
}
