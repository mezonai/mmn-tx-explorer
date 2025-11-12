'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Download, Shield } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { useCreateCampaignContext } from '../../../context/CreateCampaignContext';
import { APP_CONFIG } from '@/configs/app.config';
import { useState } from 'react';

function WalletForm({
  wallet,
}: {
  wallet: {
    address: string;
    privateKey: string;
  };
}) {
  return (
    <>
      <div>
        <label className="text-foreground mb-2 block text-sm font-medium">Donation address (public)</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="0xABCD...1234"
            value={wallet.address}
            onChange={(e) => e.preventDefault()}
            className="bg-gray-200 pr-12 font-mono dark:bg-gray-700"
            readOnly
            disabled
          />
          <CopyButton
            textToCopy={wallet.address}
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
            value={wallet.privateKey}
            onChange={(e) => {
              e.preventDefault();
            }}
            className="bg-gray-200 pr-12 font-mono text-xs dark:bg-gray-700"
            readOnly
            disabled
          />

          <CopyButton
            textToCopy={wallet.privateKey}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 size-fit -translate-y-1/2 transform cursor-pointer p-2 transition-colors"
          />
        </div>
      </div>
    </>
  );
}

export function DonationWallet() {
  const { form, generateWallet, isSaving, isWalletDownloaded, setIsWalletDownloaded } = useCreateCampaignContext();

  const [showDialog, setShowDialog] = useState(false);

  const hasWallet = form.donationWallet.address && form.donationWallet.privateKey;

  const handleGenerateWallet = async () => {
    const success = await generateWallet();
    if (success) {
      setShowDialog(true);
    }
  };

  const handleDownload = () => {
    const walletData = {
      address: form.donationWallet.address,
      privateKey: form.donationWallet.privateKey,
      generatedAt: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE. Never share the private key with anyone.',
    };

    const dataStr = JSON.stringify(walletData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet-${form.donationWallet.address}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsWalletDownloaded(true);
    setShowDialog(false);
  };

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
              onClick={handleGenerateWallet}
              disabled={!!hasWallet || isSaving}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Generating...' : hasWallet ? 'Wallet Generated' : 'Generate wallet'}
            </Button>
          </div>
        </div>

        <WalletForm wallet={form.donationWallet} />

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

      {/* Wallet Generation Success Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          // Only allow closing if wallet has been downloaded
          if (!open && isWalletDownloaded) {
            setShowDialog(false);
          }
        }}
      >
        <DialogContent
          className="max-w-lg [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Wallet Generated Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong className="font-semibold">Security reminder:</strong> Never share the private key via chat or
                  email. Only campaign owners with treasury responsibility should have access.
                </div>
              </div>
            </div>

            <WalletForm wallet={form.donationWallet} />

            <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 dark:border-red-500/30 dark:bg-red-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-200">
                  <strong>Required:</strong> You must download the wallet file to continue.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="w-full">
            <Button onClick={handleDownload} className="bg-brand-primary hover:bg-brand-primary/90 w-full text-white">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
