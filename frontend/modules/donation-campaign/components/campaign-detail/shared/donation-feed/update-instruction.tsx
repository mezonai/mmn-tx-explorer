import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const UpdateInstruction = () => {
  return (
    <Card className="bg-brand-primary/5 dark:bg-brand-primary/5 border-brand-primary/30 dark:border-brand-primary/30 gap-4 rounded-3xl border">
      <CardHeader className="text-md text-foreground font-semibold">How updates are stored</CardHeader>
      <CardContent>
        <ol className="list-disc space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-400">
          <li>Photos are uploaded to distributed storage (IPFS).</li>
          <li>Each update is anchored on the MMN chain with a content hash.</li>
          <li>If you edit an update, a new version is created and the old one is marked as superseded.</li>
          <li>Updates can be hidden from the feed, but the on-chain record remains for audit.</li>
        </ol>
      </CardContent>
    </Card>
  );
};
