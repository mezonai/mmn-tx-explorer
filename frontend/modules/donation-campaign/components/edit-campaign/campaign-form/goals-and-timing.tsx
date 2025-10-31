'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/datepicker';
import { useUpdateCampaignContext } from '@/modules/donation-campaign/context/UpdateCampaignContext';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { DATE_FORMAT } from '@/constant';

export function GoalsAndTiming() {
  const { form, updateField } = useUpdateCampaignContext();

  const handleInputChange = (field: keyof typeof form, value: string) => {
    if (field === 'fundraisingGoal') {
      let numeric = value.replace(/[^0-9]/g, '');
      if (numeric.length > 1 && numeric.startsWith('0')) {
        numeric = numeric.replace(/^0+/, '');
      }
      const limitedValue = numeric.slice(0, 15);
      updateField(field, limitedValue);
    } else {
      updateField(field, value.trim());
    }
  };

  const handleDateChange = (date: Date | null) => {
    const dateString = date ? format(date, DATE_FORMAT) : '';
    handleInputChange('endDate', dateString);
  };

  return (
    <Card className="border-border bg-card dark:bg-card/80">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground text-lg">Goals & timing</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Set targets so the progress bar and reports stay accurate.
            </p>
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
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-foreground mb-2 block text-sm font-medium">Partner / campaign owner</label>
            <Input
              type="text"
              placeholder="e.g. Mezon Team"
              value={form.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
