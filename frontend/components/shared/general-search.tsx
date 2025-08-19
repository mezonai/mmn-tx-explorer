import { Search } from 'lucide-react';
import { Input } from '../ui/input';

export function GeneralSearch() {
  return (
    <div className="relative flex-1">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
      <Input placeholder="Search by address / txn hash / block / token..." className="pl-10" />
    </div>
  );
}
