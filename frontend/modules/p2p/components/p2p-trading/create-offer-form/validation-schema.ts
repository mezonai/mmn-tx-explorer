import { TradeTypes } from '@/modules/p2p/types';
import { z } from 'zod';

export const createOfferSchema = z
  .object({
    side: z.nativeEnum(TradeTypes),
    amount: z.number({ message: 'Amount is required' }).gt(0, 'Please enter the amount of đồng to sell'),
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
      bank: z.enum(['MB', 'VCB', 'TCB', 'ACB', 'TPBANK', 'VIETCOMBANK']),

      account_number: z
        .string()
        .min(1, 'Please enter the account number')
        .regex(/^\d+$/, 'Account number must contain only digits'),
      account_name: z.string().min(1, 'Please enter the account name'),
    }),
    symbol: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.side === TradeTypes.SELL) {
      if (parseFloat(data.price_rate) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the selling rate',
          path: ['price_rate'],
        });
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
            message: 'Minimum limit cannot exceed the sell amount',
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
            message: 'Maximum limit cannot exceed the sell amount',
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
    }
  });

export type CreateOfferFormValues = z.infer<typeof createOfferSchema>;
