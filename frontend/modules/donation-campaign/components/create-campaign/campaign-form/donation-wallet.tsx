'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { useCreateCampaignContext } from '../../../context/CreateCampaignContext';
import { APP_CONFIG } from '@/configs/app.config';

export function DonationWallet() {
  const { form, generateWallet } = useCreateCampaignContext();

  return (
    <Card className="border-border bg-card dark:bg-card/80">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground text-lg">Donation wallet</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Generate a dedicated wallet or paste an existing address to receive {APP_CONFIG.CHAIN_SYMBOL}.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary">Required</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="border-brand-primary/40 bg-brand-primary/5 dark:bg-brand-primary/5 rounded-2xl border border-dashed p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-brand-primary font-semibold">Generate wallet keypair</p>
              <p className="text-brand-primary/80 mt-1 text-xs">
                Create a one-time address/private key pair for this campaign. Store the private key securely—we will not
                display it again after closing the modal.
              </p>
            </div>
            <Button
              type="button"
              onClick={generateWallet}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg"
            >
              Generate wallet
            </Button>
          </div>
        </div>

        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Donation address (public)</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="0xABCD...1234"
              value={form.donationWallet.address}
              onChange={(e) => e.preventDefault()}
              className="bg-gray-200 pr-12 font-mono dark:bg-gray-700"
              readOnly
              disabled
            />
            <CopyButton
              textToCopy={form.donationWallet.address}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 size-fit -translate-y-1/2 transform cursor-pointer p-2 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Private key (displayed once)</label>
          <div className="relative">
            <Textarea
              rows={3}
              placeholder="Store securely or download an encrypted file..."
              value={form.donationWallet.privateKey}
              onChange={(e) => {
                e.preventDefault();
              }}
              className="bg-gray-200 pr-12 font-mono text-xs dark:bg-gray-700"
              readOnly
              disabled
            />

            <CopyButton
              textToCopy={form.donationWallet.privateKey}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 size-fit -translate-y-1/2 transform cursor-pointer p-2 transition-colors"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Security reminder:</strong> Never share the private key via chat or
              email. Only campaign owners with treasury responsibility should have access.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
