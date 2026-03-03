'use client';

import { useState } from 'react';
import { useUser } from '@/providers';
import { ProfileTabs, ProfileTabType } from './profile-tabs';
import { AccountInfoTab } from './account-info-tab';
import { BankPaymentAccountsTab } from './bank-payment-accounts-tab';
import { ComingSoon } from '@/components/shared';

export const Profile = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('info');

  if (!user) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <AccountInfoTab />;
      case 'payment':
        return <BankPaymentAccountsTab />;
      default:
        return <ComingSoon title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />;
    }
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="w-full">
        {renderTabContent()}
      </div>
    </main>
  );
};
