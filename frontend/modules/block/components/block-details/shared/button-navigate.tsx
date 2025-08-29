import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ButtonNavigateBlockProps {
  direction: 'previous' | 'next';
  blockNumber: number;
}

export const ButtonNavigateBlock = ({ direction, blockNumber }: ButtonNavigateBlockProps) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/blocks/${blockNumber}`);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="size-7" onClick={handleNavigate}>
          {direction === 'previous' ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{direction === 'previous' ? 'Previous block' : 'Next block'}</span>
      </TooltipContent>
    </Tooltip>
  );
};
