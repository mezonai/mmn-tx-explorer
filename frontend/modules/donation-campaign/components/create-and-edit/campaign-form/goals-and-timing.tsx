'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/datepicker';
import { useCreateCampaignContext } from '@/modules/donation-campaign/context/CreateCampaignContext';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { DATE_PICKER_FORMAT } from '@/constant';

interface GoalsAndTimingProps {
  disableGoal?: boolean;
  disableEndDate?: boolean;
  disableOwner?: boolean;
}

export function GoalsAndTiming({
  disableOwner = false,
  disableGoal = false,
  disableEndDate = false,
}: GoalsAndTimingProps) {
  const { form, updateField } = useCreateCampaignContext();

  const handleInputChange = (field: keyof typeof form, value: string) => {
    if (field === 'fundraisingGoal') {
      let numeric = value.replace(/[^0-9]/g, '');
      if (numeric.length > 1 && numeric.startsWith('0')) {
        numeric = numeric.replace(/^0+/, '');
      }
      const limitedValue = numeric.slice(0, 15);
      updateField(field, limitedValue);
    } else {
      updateField(field, value);
    }
  };

  const handleDateChange = (date: Date | null) => {
    const dateString = date ? format(date, DATE_PICKER_FORMAT) : '';
    handleInputChange('endDate', dateString);
  };

  return (
    <Card className="border-border bg-card dark:bg-card/80">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground text-lg">Goals & timing</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">Set targets so progress stays accurate.</p>
          </div>
          <Badge variant="outline" className="bg-muted/50">
            Optional but recommended
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Fundraising goal ({APP_CONFIG.CHAIN_SYMBOL})
            </label>
            <Input
              placeholder="e.g. 20000"
              type="text"
              value={form.fundraisingGoal ? NumberUtil.formatWithCommas(form.fundraisingGoal || '') : ''}
              onChange={(e) => handleInputChange('fundraisingGoal', e.target.value)}
              disabled={disableGoal}
            />
          </div>
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">End date</label>
            <DatePicker
              selected={form.endDate ? new Date(form.endDate) : null}
              onChange={handleDateChange}
              placeholder="Select end date"
              minDate={new Date()}
              className="w-full"
              disabled={disableEndDate}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-foreground mb-2 block text-sm font-medium">Partner / campaign owner</label>
            <Input
              type="text"
              value={form.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              disabled={disableOwner}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
