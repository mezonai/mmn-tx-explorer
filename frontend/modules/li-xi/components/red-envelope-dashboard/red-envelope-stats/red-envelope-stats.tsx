import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_CONFIG } from "@/configs/app.config";
import { ROUTES } from "@/configs/routes.config";
import { cn } from "@/lib/utils"; 
import { useRedEnvelopeStats } from "@/modules/li-xi/hooks/useRedEnvelopeStats";
import { useUser } from "@/providers";
import {
  SendIcon,
  ExternalLinkIcon,
  WalletMinimalIcon,
  CoinsIcon,
  LucideMailOpen,
  BarChartIcon,
  GiftIcon,
} from "lucide-react";
import Link from "next/link";

export const RedEnvelopeStats = () => {
  const { user } = useUser();  
  const {stats} = useRedEnvelopeStats(user?.walletAddress ?? '');

  const statsCards = [
    {
      title: "TOTAL SENT",
      value: stats.total_sent.toLocaleString('en-US'),  
      unit: ` ${APP_CONFIG.CHAIN_SYMBOL}`,
      subValue: "Send to " + stats.count_sent_envelopes + " wallets",
      titleIcon: SendIcon,
      topRightIcon: ExternalLinkIcon,
    },
    {
      title: "TOTAL RECEIVED",
      value: stats.total_claimed.toLocaleString('en-US'),
      unit: ` ${APP_CONFIG.CHAIN_SYMBOL}`,
      subValue: "From to " + stats.count_claimed_envelopes + " wallets",
      titleIcon: WalletMinimalIcon,
      topRightIcon: CoinsIcon,
    },
    {
      title: "LIVE ENVELOPES",
      value: stats.total_active_envelopes,
      unit: "",
      subValue: "Currently active",
      titleIcon: LucideMailOpen,
      topRightIcon: BarChartIcon,
    },
  ];

  return (
    <section className="">
      <div className="">
        <PageHeader title="Mezon Lucky Money" header="Dashboard" />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
          {statsCards.map((item) => {
            const TitleIcon = item.titleIcon;
            const TopRightIcon = item.topRightIcon;
            const isLoading = item.value === undefined;
            const cardClassName = cn(
              'p-0', 
              isLoading ? 'bg-background' : 'bg-card', 
              'dark:border-primary/15'
            );
            return (
              <Card key={item.title} className={cardClassName}>
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TitleIcon className="size-5 text-violet-700 dark:text-violet-700" />
                      <span className="text-muted-foreground dark:text-gray-400">{item.title}</span>
                    </div>
                    {TopRightIcon && <TopRightIcon className="size-5 text-violet-600 dark:text-violet-500" />}
                  </div>

                  <div className="my-4">
                    <span className="text-2xl md:text-3xl font-semibold text-foreground dark:text-white break-words">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="text-2xl md:text-3xl font-semibold text-foreground dark:text-white break-words">
                        &nbsp;{item.unit}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-base font-medium text-muted-foreground dark:text-gray-400">{item.subValue}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        </div>
        <div className="mt-8 md:mt-14 flex justify-center">
          <Button
            asChild
            size="lg"
            className="
              bg-violet-600 text-white
              dark:bg-violet-800 text-white
              hover:bg-violet-900
              text-sm md:text-lg font-semibold
              py-4 md:py-7 px-6 md:px-16
              rounded-2xl
              transform transition-transform duration-300 hover:scale-105
              w-full sm:w-auto
            "
          >
            <Link
              href={ROUTES.CREATE_LI_XI}
              className="flex w-full items-center justify-center gap-2 sm:gap-3"
            >
              <GiftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="whitespace-nowrap">Create New Lucky Money</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
