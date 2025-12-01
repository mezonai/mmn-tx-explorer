'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';

export function BasicInfo() {
  const { form, updateField } = useCreateRedEnvelopeContext();

  const handleInputChange = (field: keyof typeof form, value: string) => {
  if (['totalAmount', 'participantCount', 'amountMin', 'amountMax'].includes(field)) {
    const numeric = value.replace(/[^0-9.]/g, '');
    const parsed = numeric === '' ? 0 : parseFloat(numeric);
    updateField(field as any, parsed);
  } else {
    updateField(field as any, value);
  }
};

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 text-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          className="mt-2"
          label="Name"
          type="string"
          placeholder="Lucky Money"
          value={form.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>
      <Input
        className="mt-2"
        label="Total amount"
        type="number"
        placeholder="1000"
        suffix="đồng" 
        value={form.totalAmount || ''} 
        onChange={(e) => handleInputChange('totalAmount', e.target.value)}
      />
      <Input
        className="mt-2"
        label="Participant count"
        type="number"
        placeholder="25"
        value={form.participantCount || ''}
        onChange={(e) => handleInputChange('participantCount', e.target.value)}
      />
      <Input
        className="mt-2"
        label="Amount min"
        type="number"
        placeholder="10"
        value={form.amountMin || ''}
        onChange={(e) => handleInputChange('amountMin', e.target.value)}
      />
      <Input
        className="mt-2"
        label="Amount max"
        type="number"
        placeholder="80"
        value={form.amountMax || ''}
        onChange={(e) => handleInputChange('amountMax', e.target.value)}
      />
      <div className="sm:col-span-2">
        <Textarea
          className="mt-2"
          label="Message"
          rows={3}
          placeholder="Good luck!"
          value={form.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
        />
      </div>
    </div>
  );
}