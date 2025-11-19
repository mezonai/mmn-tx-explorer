import Card from './shared/card';
import { Button } from '@/components/ui/button';
import { CreditCardRefresh, ArrowRight } from '@/assets/icons';
import { CircleDollarSign, StoreIcon, CircleQuestionMarkIcon } from 'lucide-react';
import { Chip } from '@/components/shared';
import Link from 'next/link';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';

interface HeroProps {
  onHowItWorksClick?: () => void;
}
const breadcrumbs: IBreadcrumb[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Cobar', href: '#' },
] as const;

export const Hero = ({ onHowItWorksClick }: HeroProps) => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      </div>
      <Card className="">
        <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:gap-2">
          <div className="flex flex-1 flex-col">
            <div className="p-4">
              <Chip variant="outline-brand" className="gap-1.5 bg-white">
                <CircleDollarSign className="text-brand-primary h-5 w-5" /> Marketplace integration{' '}
              </Chip>
              <h1 className="text-foreground mt-3 mt-5 text-2xl font-bold sm:text-3xl lg:text-4xl dark:text-white">
                Cobar.vn × Mezon Đồng
              </h1>
              <h3 className="mt-4 max-w-2xl text-sm text-gray-400 sm:text-base">
                Cobar.vn is the official marketplace supporting payments with Mezon Đồng.
              </h3>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row">
              <Link href="https://cobar.vn" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  className="dark:bg-brand-primary dark:text-foreground sm:text-md dark:hover:bg-brand-primary/70 w-full py-5 text-sm font-semibold"
                >
                  <StoreIcon className="h-5 w-5" />
                  Shop on Cobar.vn
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="border-foreground/20 sm:text-md flex w-full items-center gap-2 border py-5 text-sm font-semibold sm:w-auto"
                onClick={onHowItWorksClick}
              >
                <CircleQuestionMarkIcon className="h-5 w-5" />
                How it works
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <Card
              icon={<CreditCardRefresh className="text-white" />}
              iconBg="bg-brand-primary"
              title="Shop with Mezon Đồng on Cobar.vn"
              description="Fast checkout · Low fees · On-chain transparency"
              className="dark:bg-background bg-brand-primary/3 h-full p-2"
            >
              <Link href="https://cobar.vn" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  className="dark:bg-brand-primary dark:text-foreground dark:hover:bg-brand-primary/70 flex items-center gap-2"
                >
                  Start Shopping <ArrowRight />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};
