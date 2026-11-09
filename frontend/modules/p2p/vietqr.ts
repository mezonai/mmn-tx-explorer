import { findBank, genQRText, type VietQrBank } from 'vietqr';

import { BANK_OPTIONS } from './constants';
import { UserPaymentInfo } from './types';

// NAPAS 247 limits: account numbers are alphanumeric, amounts are whole VND with at most 13 digits.
const ACCOUNT_NUMBER_PATTERN = /^[A-Za-z0-9]{3,25}$/;
const MAX_AMOUNT_DIGITS = 13;
const MAX_TRANSFER_NOTE_LENGTH = 50;

export interface VietQrPayment {
  payload: string;
  bank: VietQrBank;
  accountNumber: string;
  accountName: string;
  amount?: number;
  transferNote?: string;
}

interface BuildVietQrPaymentParams {
  paymentInfo: UserPaymentInfo;
  amount?: number;
  transferCode?: string | null;
}

// Banks reject transfer notes with diacritics or symbols, so keep the note to plain ASCII letters, digits and spaces.
const toTransferNote = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TRANSFER_NOTE_LENGTH);

// payment_info.bank_name stores the BANK_OPTIONS label (e.g. "MB Bank"); map it to a code VietQR knows.
export const resolveVietQrBank = (bankName: string): VietQrBank | undefined => {
  const option = BANK_OPTIONS.find((item) => item.label === bankName || item.value === bankName);
  return findBank(option?.value ?? bankName);
};

/** Returns null when the payment info cannot be encoded, so callers never show a QR that pays the wrong target. */
export const buildVietQrPayment = ({
  paymentInfo,
  amount,
  transferCode,
}: BuildVietQrPaymentParams): VietQrPayment | null => {
  const bank = resolveVietQrBank(paymentInfo.bank_name);
  const accountNumber = paymentInfo.account_number.replace(/\s+/g, '');
  if (!bank || !ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
    return null;
  }

  const wholeAmount = amount && amount > 0 ? Math.round(amount) : undefined;
  if (wholeAmount && String(wholeAmount).length > MAX_AMOUNT_DIGITS) {
    return null;
  }

  const transferNote = transferCode ? toTransferNote(transferCode) || undefined : undefined;

  const payload = genQRText({
    acqId: bank.bin,
    accountNo: accountNumber,
    amount: wholeAmount ? String(wholeAmount) : undefined,
    addInfo: transferNote,
  });

  return {
    payload,
    bank,
    accountNumber,
    accountName: paymentInfo.account_name.trim().toUpperCase(),
    amount: wholeAmount,
    transferNote,
  };
};
