'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCampaignContext } from '@/modules/donation-campaign/context/CreateCampaignContext';

interface CampaignBasicsProps {
  disableName?: boolean;
  disableDescription?: boolean;
}

export function CampaignBasics({ disableName = false, disableDescription = false }: CampaignBasicsProps) {
  const { form, updateField } = useCreateCampaignContext();

  const handleInputChange = (field: keyof typeof form, value: any) => {
    updateField(field, value);
  };

  return (
    <Card className="border-border bg-card dark:bg-card/80">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-foreground text-lg">Campaign basics</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              This information appears in the list view and helps donors understand the intent at a glance.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary">Required</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Campaign name</label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={disableName}
          />
        </div>

        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Short description (card)</label>
          <Textarea
            rows={3}
            value={form.shortDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange('shortDescription', e.target.value)
            }
            disabled={disableDescription}
          />
        </div>
      </CardContent>
    </Card>
  );
}
