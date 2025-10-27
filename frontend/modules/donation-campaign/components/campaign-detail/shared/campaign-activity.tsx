'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function CampaignActivity({ campaign }: { campaign: any }) {
  const [activeTab, setActiveTab] = useState<'recent' | 'top' | 'about'>('recent');

  return (
    <section>
      <div className="mb-4 flex border-b">
        {[
          { key: 'recent', label: 'Recent Activity' },
          { key: 'top', label: 'Top Contributors' },
          { key: 'about', label: 'About' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key ? 'border-primary text-primary' : 'hover:text-primary border-transparent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'recent' && (
        <Card className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2">Sender</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Tx Hash</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {campaign.recentActivity.map((tx: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 border-b">
                  <td className="py-2 font-mono">{tx.sender}</td>
                  <td>${tx.amount}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="font-mono text-xs">{tx.txHash}</td>
                  <td>{tx.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'top' && (
        <Card className="space-y-3 p-4">
          {campaign.topContributors.map((contrib: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b pb-2">
              <span className="font-mono text-sm">{contrib.wallet}</span>
              <div className="text-right">
                <div className="font-medium">${contrib.amount}</div>
                <div className="text-muted-foreground text-xs">{contrib.percentage}%</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'about' && (
        <Card className="space-y-2 p-4">
          <p className="text-muted-foreground whitespace-pre-line">{campaign.about}</p>
        </Card>
      )}
    </section>
  );
}
