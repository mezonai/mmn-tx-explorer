'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCampaignContext } from '../../../context/CreateCampaignContext';

export function CampaignBasics() {
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
            placeholder="e.g. Build a School for Điện Biên Kids"
            value={form.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Short description (card)</label>
          <Textarea
            rows={3}
            placeholder="Share the mission and expected impact in two sentences..."
            value={form.shortDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange('shortDescription', e.target.value)
            }
          />
        </div>

        {/* <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Banner image URL</label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={form.bannerImageUrl}
            onChange={(e) => handleInputChange('bannerImageUrl', e.target.value)}
          />
          {form.bannerImageUrl && (
            <div className="mt-3">
              <p className="text-muted-foreground mb-2 text-xs">Preview:</p>
              <div className="max-w-sm overflow-hidden rounded-lg border">
                <img
                  src={form.bannerImageUrl}
                  alt="Banner preview"
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}
