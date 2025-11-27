import { CampaignUpdates } from '@/modules/donation-campaign/type';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/shared';
import { CopyButton } from '@/components/ui/copy-button';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import Link from 'next/link';

function getStatusChip(update: CampaignUpdates) {
  if (update.status === 'hidden') {
    return (
      <Chip variant="default" className="rounded-md">
        {update.title}
      </Chip>
    );
  }
  return (
    <Chip variant="brand" className="rounded-md">
      {update.title}
    </Chip>
  );
}

function getStatusMeta(update: CampaignUpdates) {
  if (update.owner) {
    return <div className="hidden pt-2 text-xs text-gray-500 lg:block">· posted by {update.owner}</div>;
  }
  return null;
}

function getStatusWarning(update: CampaignUpdates) {
  if (update.status === 'older') {
    return (
      <Chip variant="warning" className="mt-2 self-start rounded-md">
        Edited · New version on chain
      </Chip>
    );
  }
  if (update.status === 'hidden') {
    return (
      <Chip variant="warning" className="mt-2 self-start rounded-md">
        Hidden from public feed
      </Chip>
    );
  }
  return null;
}

function getStatusAction(update: CampaignUpdates) {
  if (update.status === 'recent') {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
        <p>On chain</p>
      </span>
    );
  }
  if (update.status === 'older') {
    return (
      <Link href="#" className="underline">
        See previous version
      </Link>
    );
  }
  return (
    <Link href="#" className="underline">
      Unhide
    </Link>
  );
}

function getContent(update: CampaignUpdates) {
  if (update.status === 'hidden') {
    return <i>This update has been hidden from the public feed, but the record remains on chain for audit.</i>;
  }
  return update.content;
}

function getImages(update: CampaignUpdates) {
  if (update.images && update.images.length > 0 && update.status !== 'hidden') {
    return (
      <div className="grid w-full grid-cols-1 gap-2 p-2 pl-3 sm:grid-cols-3 md:grid-cols-6">
        {update.images.map((imgUrl, idx) => (
          <img
            key={idx}
            src={imgUrl}
            alt={`Update Image ${idx + 1}`}
            className="h-40 w-full rounded-md object-cover sm:h-32 md:h-24"
          />
        ))}
      </div>
    );
  }
  return null;
}

export const UpdateList = ({ updates }: { updates: CampaignUpdates[] }) => {
  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <Card
          className={`dark:bg-dark dark:bg-card gap-4 rounded-3xl bg-white/90 shadow-sm ${update.status === 'hidden' ? 'border-amber-300/50 opacity-60' : 'border-gray-200 dark:border-white/10'}`}
          key={update.id}
        >
          <div className="flex w-full flex-col justify-between gap-3 px-4 md:flex-row">
            <div className="flex flex-row gap-2">
              {getStatusChip(update)}
              <div className="pt-2 text-xs text-gray-400">
                <ClientTimeDisplay timestamp={update.timestamp} />
              </div>
              {getStatusMeta(update)}
              {getStatusWarning(update)}
            </div>
            <div className="text-muted-foreground flex flex-row gap-1 text-xs">{getStatusAction(update)}</div>
          </div>
          <div className="text-foreground text-md w-full px-3 break-words">{getContent(update)}</div>
          {getImages(update)}
          <div className="flex w-full flex-row justify-end gap-4 px-4 text-xs">
            <div className="flex flex-row gap-2">
              <p>CID: </p>
              <p className="text-brand-primary middle-truncate">{update.cid.slice(0, 3)}...{update.cid.slice(-4)}</p>
              <CopyButton textToCopy={update.cid} />
            </div>
            <div className="flex flex-row gap-2">
              <p>TxHash: </p>
              <p className="text-brand-primary">{update.txHash.slice(0, 3)}...{update.txHash.slice(-4)}</p>
              <CopyButton textToCopy={update.txHash} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
