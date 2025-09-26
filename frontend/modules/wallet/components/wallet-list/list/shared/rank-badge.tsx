import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RankBadgeProps {
  rank: number;
}

export const RankBadge = ({ rank }: RankBadgeProps) => {
  return <Badge className="text-utility-warning-700 bg-utility-warning-50 border-utility-warning-200">{rank}</Badge>;
};

export const RankBadgeSkeleton = () => {
  return <Skeleton className="h-5.5 w-8" />;
};
