'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { DonationCampaign } from '@/modules/donation-campaign/type';

export function CampaignExtras({ campaign }: { campaign: DonationCampaign }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    toast.success('Message sent successfully!');
    setMessage('');
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Campaign Impact</CardTitle>
        </CardHeader>
        {/* <CardContent className="text-muted-foreground space-y-4 text-sm">
          {campaign.impact.map((item: string, idx: number) => (
            <p key={idx}>• {item.text}</p>
          ))}
        </CardContent> */}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Owner</CardTitle>
        </CardHeader>
        {/* <CardContent className="space-y-3 text-sm">
          <p>
            <b>Name:</b> {campaign.owner.name}
          </p>
          <p>
            <b>Email:</b> {campaign.owner.email}
          </p>
          <p>
            <b>Wallet:</b> {campaign.owner.wallet}
          </p>
          <Button onClick={() => toast.success('Opening email client...')} className="w-full">
            Send Email
          </Button>
        </CardContent> */}
      </Card>

      {/* 3️⃣ Message Form */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Leave a Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Your name" />
          <Input
            placeholder="Write your message to the campaign..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSend}>Send Message</Button>
        </CardContent>
      </Card>
    </div>
  );
}
