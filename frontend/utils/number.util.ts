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

  static formatWithCommasAndScale(value: number | string, scale: number = 1_000_000): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const scaled = num / scale;
    return scaled.toLocaleString('en-US');
  }

  static formatWithCommasAndScaleShort(value: number | string, scale: number = 1_000_000): string {
    if (!value) return '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const scaled = num / scale;

    const format = (n: number, divisor: number, suffix: string) => {
      return (n / divisor).toFixed(1) + suffix;
    };

    if (scaled >= 1_000_000) {
      if (scaled >= 1_000_000_000) return format(scaled, 1_000_000_000, 'B');
      return format(scaled, 1_000_000, 'M');
    }
    return scaled.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  static scaleDown(value: number, scale: number = 1_000_000): number {
    if (!value) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;

    const scaled = num / scale;
    return scaled;
  }

  static formatAndScaleDown(value: number, scale: number = 1_000_000): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const scaled = num / scale;
    return scaled.toString();
  }
}
