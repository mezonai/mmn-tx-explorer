// Minimal typings for the parts of `vietqr` (https://github.com/vietqr/vietqr-node) the app uses.
declare module 'vietqr' {
  export interface VietQrBank {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
    transferSupported: number;
    lookupSupported: number;
    swift_code?: string | null;
  }

  export interface VietQrTextInput {
    acqId: string;
    accountNo: string;
    amount?: string;
    addInfo?: string;
  }

  /** Builds the EMVCo / NAPAS 247 payload string encoded in a VietQR code. */
  export function genQRText(input: VietQrTextInput): string;

  /** Looks a bank up by BIN, code (e.g. `VCB`) or short name (e.g. `Vietcombank`). */
  export function findBank(id: string): VietQrBank | undefined;

  export const BANKS: VietQrBank[];
}
