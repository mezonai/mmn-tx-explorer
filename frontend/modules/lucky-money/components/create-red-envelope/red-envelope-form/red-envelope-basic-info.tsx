'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NumberUtil } from '@/utils';
import { useFormContext, Controller, ControllerProps, FieldValues } from 'react-hook-form';
import { CreateRedEnvelopeForm } from '@/modules/lucky-money/type';
import { MAX_PARTICIPANT_COUNT } from '@/modules/lucky-money/constants';
import { cn } from '@/lib/utils';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ErrorMsg = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="animate-in fade-in-50 mt-5 text-xs font-medium text-red-500">{message}</p>;
};

interface NumberInputProps<T extends FieldValues> extends Omit<ControllerProps<T>, 'render'> {
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const NumberInputControl = <T extends FieldValues>({
  control,
  name,
  rules,
  label,
  placeholder,
  className,
  disabled,
}: NumberInputProps<T>) => {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name as string]?.message as string | undefined;

  return (
    <div>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            {...field}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            value={value ? NumberUtil.formatWithCommas(value) : ''}
            className={cn('mt-2', error && 'border-red-400', className)}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/[^0-9]/g, '');
              const numberValue = rawValue === '' ? 0 : Number(rawValue);
              onChange(numberValue);
            }}
          />
        )}
      />
      <ErrorMsg message={error} />
    </div>
  );
};

export function BasicInfo() {
  const {
    register,
    control,
    watch,
    formState: { errors },
    getValues,
  } = useFormContext<CreateRedEnvelopeForm>();
  const { userBalance, isSuccess } = useCreateRedEnvelopeContext();
  const isRandom = watch('randomDistribution');
  const getNum = (key: keyof CreateRedEnvelopeForm) => Number(getValues(key) || 0);

  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4 md:gap-6">
      <div className="sm:col-span-2">
        <Input
          label="Name"
          className={cn('mt-2', errors.name && 'border-red-400')}
          placeholder="Lucky Money"
          disabled={isSuccess}
          {...register('name', {
            required: 'Name is required',
            maxLength: { value: 200, message: 'Name must not exceed 200 characters' },
          })}
        />
        <ErrorMsg message={errors.name?.message} />
      </div>

      <NumberInputControl
        control={control}
        name="totalAmount"
        label="Total Amount"
        placeholder="100"
        disabled={isSuccess}
        rules={{
          required: 'Please enter the total amount.',
          min: { value: 1, message: 'The amount must be at least 1.' },
          validate: (value) => {
            value = Number(value);

            if (value > userBalance) {
              return `Insufficient balance (Available: ${NumberUtil.formatWithCommas(userBalance)})`;
            }

            const count = getNum('participantCount');
            const isRandomMode = getValues('randomDistribution');

            if (isRandomMode) {
              const min = getNum('amountMin');
              const max = getNum('amountMax');

              if (count > 0 && min > 0 && value < min * count) {
                const required = NumberUtil.formatWithCommas(min * count);
                return `Not enough money! To give everyone at least ${min}, you need a total of ${required}.`;
              }

              if (count > 0 && max > 0 && value > max * count) {
                const maxPossible = NumberUtil.formatWithCommas(max * count);
                return `The system requires all money to be distributed. Even if everyone gets the maximum (${max}), you only use ${maxPossible}. You have extra money left over`;
              }
            } else {
              if (count > 0 && value < count) return 'The total amount is too small to share with this many people!';
            }
            return true;
          },
        }}
      />

      <NumberInputControl
        control={control}
        name="participantCount"
        label="Participant count"
        placeholder="10"
        disabled={isSuccess}
        rules={{
          required: 'Required',
          min: { value: 1, message: 'Min participant 1' },
          max: { value: MAX_PARTICIPANT_COUNT, message: `Participant count must not exceed ${MAX_PARTICIPANT_COUNT}` },
          validate: (value) => {
            value = Number(value);
            const totalAmount = getNum('totalAmount');
            if (totalAmount > 0 && value > 0 && totalAmount < value) {
              return 'Insufficient total amount for participants';
            }
            return true;
          },
        }}
      />

      <div className="mt-2 sm:col-span-2">
        <Controller
          control={control}
          name="randomDistribution"
          render={({ field: { value, onChange } }) => (
            <div className="mt-2 sm:col-span-2">
              <div className="border-border bg-card dark:bg-background flex items-center justify-between rounded-lg border p-2.5 sm:p-3 md:p-4 dark:border-white/10">
                <label htmlFor="random-dist" className="text-foreground text-xs font-medium sm:text-sm dark:text-white">
                  Random distribution
                </label>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      className="hover: cursor-pointer"
                      checked={value}
                      onCheckedChange={onChange}
                      disabled={isSuccess}
                      id="random-mode"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-foreground max-w-xs text-center text-sm break-all">
                    Distribute random amounts to each recipient
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        />
      </div>

      {isRandom && (
        <>
          <NumberInputControl
            control={control}
            name="amountMin"
            label="Amount Min"
            placeholder="10"
            disabled={isSuccess}
            rules={{
              required: 'Required',
              min: { value: 1, message: 'Must be at least 1.' },
              validate: (value) => {
                value = Number(value);
                const max = getNum('amountMax');
                if (max > 0 && value > max) return 'Amount min cannot be greater than amount max.';

                const totalAmount = getNum('totalAmount');
                const count = getNum('participantCount');

                // Case: Min is too high
                if (count > 0 && totalAmount > 0 && totalAmount < value * count) {
                  return `This minimum is too high! With ${count} people, your total budget isn't enough to give everyone ${value}.`;
                }
                return true;
              },
            }}
          />

          <NumberInputControl
            control={control}
            name="amountMax"
            label="Amount Max"
            placeholder="20"
            disabled={isSuccess}
            rules={{
              required: 'Required',
              min: { value: 1, message: 'Must be at least 1.' },
              validate: (value) => {
                value = Number(value);
                const min = getNum('amountMin');
                if (value < min) return 'Amount max must be greater than or equal to amount min';

                const totalAmount = getNum('totalAmount');
                const count = getNum('participantCount');

                // Case: Max is too low
                if (count > 0 && totalAmount > 0 && totalAmount > value * count) {
                  return `This maximum is too low! The system requires all money to be distributed. Even if everyone gets ${value}, there will still be money left over.`;
                }
                return true;
              },
            }}
          />
        </>
      )}

      <div className="sm:col-span-2">
        <Textarea
          className={cn('mt-2', errors.message && 'border-red-400')}
          label="Message"
          disabled={isSuccess}
          {...register('message', { required: 'Message is required' })}
        />
        <ErrorMsg message={errors.message?.message} />
      </div>
    </div>
  );
}
