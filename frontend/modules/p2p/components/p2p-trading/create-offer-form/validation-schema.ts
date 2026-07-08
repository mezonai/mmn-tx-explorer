import { TradeTypes } from '@/modules/p2p/types';
import { z } from 'zod';

export const createOfferSchema = z
  .object({
    side: z.nativeEnum(TradeTypes),
    amount: z.number({ message: 'Amount is required' }).gt(0, 'Please enter the amount'),
    price_rate: z
      .string()
      .min(1, 'Rate is required')
      .refine((val) => !isNaN(parseFloat(val)), 'Invalid number format')
      .refine((val) => parseFloat(val) > 0, 'Rate must be greater than 0'),
    limit: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }),
    bank_info: z.object({
      bank: z.enum(['MB', 'TCB', 'ACB', 'TPBANK', 'VIETCOMBANK']),
      account_number: z.string().optional(),
      account_name: z.string().optional(),
      is_primary: z.boolean().optional(),
    }),
    payment_info_id: z.number().optional(),
    symbol: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.side === TradeTypes.SELL) {
      if (!data.bank_info.account_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the account number',
          path: ['bank_info', 'account_number'],
        });
      } else if (!/^\d+$/.test(data.bank_info.account_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number must contain only digits',
          path: ['bank_info', 'account_number'],
        });
      }

      if (!data.bank_info.account_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the account name',
          path: ['bank_info', 'account_name'],
        });
      }
    }

    if (data.amount > 0) {
      if (data.limit.min <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the minimum limit',
          path: ['limit', 'min'],
        });
      } else if (data.limit.min > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimum limit cannot exceed the amount',
          path: ['limit', 'min'],
        });
      }

      if (data.limit.max <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the maximum limit',
          path: ['limit', 'max'],
        });
      } else if (data.limit.max > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum limit cannot exceed the amount',
          path: ['limit', 'max'],
        });
      } else if (data.limit.max < data.limit.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum limit must be greater than minimum limit',
          path: ['limit', 'max'],
        });
      }
    }
  });

export type CreateOfferFormValues = z.infer<typeof createOfferSchema>;
