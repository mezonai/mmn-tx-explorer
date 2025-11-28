'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';

export const LaunchCampaignCTA = () => {
  return (
    <article className="group border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 dark:border-brand-primary/40 dark:bg-brand-primary/10 dark:text-primary-light flex h-full flex-col rounded-3xl border border-dashed p-6 text-center text-sm shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="bg-brand-primary/20 dark:text-primary-light mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 5v14m7-7H5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-primary"
          />
        </svg>
      </div>
      <h3 className="text-brand-primary mt-4 text-lg font-semibold">Launch a new campaign</h3>
      <p className="text-brand-primary mt-2 text-sm leading-6">
        Prepare your storyline, media assets, and fundraising targets so you can publish as soon as stakeholders
        approve.
      </p>
      <Link href={ROUTES.CREATE_CAMPAIGN} className="mt-auto">
        <Button
          variant="link"
          className="bg-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/50 mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:no-underline"
        >
          Get started
        </Button>
      </Link>
    </article>
  );
};
