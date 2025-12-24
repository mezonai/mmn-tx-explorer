import { Chip } from '@/components/shared';
import { CardHeader, CardTitle } from '@/components/ui/card';

export const UpdateFormHeader = () => {
  return (
    <CardHeader className="text-brand-primary border-none px-4 pt-3 text-left">
      <CardTitle className="text-primary text-lg font-semibold">Campaign Update</CardTitle>
      <Chip
        variant="outline-warning"
        className="mt-2 rounded-md bg-amber-100 p-3 text-sm font-normal hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/10"
      >
        Each update is permanently recorded on the MMN chain using a unique content hash that proves the data's
        authenticity.
      </Chip>
    </CardHeader>
  );
};
