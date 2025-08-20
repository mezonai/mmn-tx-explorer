import { InfoSquare } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const MoreInfoButton = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoSquare className="text-muted-foreground size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>View details</TooltipContent>
    </Tooltip>
  );
};
