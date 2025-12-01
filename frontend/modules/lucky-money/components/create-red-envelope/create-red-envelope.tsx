'use client';

import { BreadcrumbNavigation, PageHeader } from '@/components/shared';
import { RedEnvelopeForm } from './red-envelope-form/red-envelope-form';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { RedEnvelopeSidebar } from './red-envelope-sidebar';
import { CreateRedEnvelopeProvider } from '../../context/CreateRedEnvelopeContext';

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Lucky Money', href: ROUTES.LUCKY_MONEY},
  { label: 'Create Lucky Money', href: '#' },
] as const;

function CreateRedEnvelopeContent() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 sm:space-y-12 md:space-y-16 px-3 sm:px-4 pb-8 sm:pb-12 md:pb-16">
      <div className="space-y-4 sm:space-y-6 md:space-y-8"> 
        <div className="space-y-2 sm:space-y-4">
          <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <PageHeader
            title="Lucky Money"
            header="Create Lucky Money drops with QR codes and lucky messages."
            description="Launch Lucky Money drops with custom rules, quick QR claims, and tight expiry controls."
          />
        </div>
      </div>
      <section className="grid gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <RedEnvelopeForm />
        <RedEnvelopeSidebar />
      </section>
    </div>
  );
}

export function CreateLuckyMoney() {
  return (
    <CreateRedEnvelopeProvider>
      <CreateRedEnvelopeContent />
    </CreateRedEnvelopeProvider>
  );
}