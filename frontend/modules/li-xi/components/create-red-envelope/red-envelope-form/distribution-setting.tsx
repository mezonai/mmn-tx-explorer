'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { useCreateRedEnvelopeContext } from "@/modules/li-xi/context/CreateRedEnvelopeContext";


export function DistributionSettings() {
  const { form, updateField } = useCreateRedEnvelopeContext();

  return (
    <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:gap-4 text-xs">
      <div className="flex items-center justify-between rounded-lg border border-border dark:border-white/10 bg-card dark:bg-background p-2.5 sm:p-3 md:p-4">
        <label htmlFor="random-dist" className="text-xs sm:text-sm text-foreground dark:text-white">Random distribution</label>
        <Checkbox
          id="random-dist"
          checked={form.randomDistribution}
          onCheckedChange={(checked) => updateField('randomDistribution', checked as boolean)}
        />
      </div>
    </div>
  );
}