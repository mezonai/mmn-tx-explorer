import Link from 'next/link';
import Card from './shared/card';
import { Award04 } from '@/assets/icons';

export const FeaturedProducts = () => {
  return (
    <>
      <div className="flex w-full flex-row justify-between">
        <h2 className="text-xl font-bold">Featured Products</h2>
        <Link
          href="https://cobar.vn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary flex items-center text-xs hover:underline"
        >
          See more on Cobar.vn
        </Link>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          title="Mezon Barista Coffee Machine"
          price="3,200"
          description="A premium coffee machine for home and office use."
          icon={<Award04 className="h-6 w-6" />}
          iconBg="bg-brand-primary/8 text-brand-primary w-12 h-12"
          className="mt-0"
        />
        <Card
          title="Specialty Roasted Beans Combo"
          price="450"
          description="A selection of our finest roasted coffee beans."
          icon={<Award04 className="h-6 w-6" />}
          iconBg="bg-brand-primary/8 text-brand-primary w-12 h-12"
          className="mt-0"
        />

        <Card
          title="Digital Gift Card"
          price="100"
          description="Give the gift of great coffee with our digital gift cards."
          icon={<Award04 className="h-6 w-6" />}
          iconBg="bg-brand-primary/8 text-brand-primary w-12 h-12"
          className="mt-0"
        />
      </div>
    </>
  );
};
