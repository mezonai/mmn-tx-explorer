import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export const UpdateInstruction = () => {
  return (
    <Card className="dark:bg-dark dark:bg-card gap-4 rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardHeader>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">How updates are stored</h4>
      </CardHeader>
      <CardContent>
        <ol className="text-gray-600 dark:text-gray-400 text-xs list-disc pl-5 space-y-1">
            <li>Photos are uploaded to distributed storage (IPFS).</li>
            <li>Each update is anchored on the MMN chain with a content hash.</li>
            <li>If you edit an update, a new version is created and the old one is marked as superseded.</li>
            <li>Updates can be hidden from the feed, but the on-chain record remains for audit.</li>
        </ol>
      </CardContent>
    </Card>
  );
};
