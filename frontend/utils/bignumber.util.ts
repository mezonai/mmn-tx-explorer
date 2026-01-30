import BigNumber from 'bignumber.js';

export class BigNumberUtil {
    static scaleDown(value: BigNumber): BigNumber {
        if (!value || value.isNaN()) return new BigNumber(0);
        return value.dividedBy(1_000_000);
    }

    static formatAndScaleDown(value: BigNumber): string {
        return this.scaleDown(value).toFormat();
    }
}
