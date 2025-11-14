import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RankBadgeProps {
  rank: number;
}

export const RankBadge = ({ rank }: RankBadgeProps) => {
  return <Badge className="bg-brand-primary min-w-8 text-white">{rank}</Badge>;
};

export const RankBadgeSkeleton = () => {
  return <Skeleton className="h-5.5 w-8" />;
};
