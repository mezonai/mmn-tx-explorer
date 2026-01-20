'use client';

import { cn } from '@/lib/utils';

export type ProfileTabType = 'info' | 'payment' | 'security' | 'notifications' | 'history';

interface ProfileTabsProps {
    activeTab: ProfileTabType;
    onChange: (tab: ProfileTabType) => void;
}

const tabs: { id: ProfileTabType; label: string }[] = [
    { id: 'info', label: 'Personal Information' },
    { id: 'payment', label: 'Payment Methods' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'history', label: 'Login History' },
];

export const ProfileTabs = ({ activeTab, onChange }: ProfileTabsProps) => {
    return (
        <div className="border-b border-border mb-8 overflow-x-auto scrollbar-hide">
            <nav className="flex space-x-8 min-w-max px-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap',
                            activeTab === tab.id
                                ? 'text-brand-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};
