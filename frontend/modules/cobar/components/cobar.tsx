'use client';
import { Hero } from './hero';
import { TodaysPayment } from './todaysPayment';
import { FeaturedProducts } from './featuredProducts';
import { HowItWorks } from './howItWorks';
import { useRef } from 'react';

export const Cobar = () => {
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full space-y-6">
      <Hero onHowItWorksClick={scrollToHowItWorks} />
      <TodaysPayment />
      <FeaturedProducts />
      <div ref={howItWorksRef}>
        <HowItWorks />
      </div>
    </div>
  );
};
