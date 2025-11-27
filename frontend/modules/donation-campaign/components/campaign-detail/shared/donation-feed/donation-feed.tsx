import { Button } from '@/components/ui/button';
import { UpdateInstruction } from './update-instruction';
import { UpdateList } from './update-list';
import { CampaignUpdates } from '@/modules/donation-campaign/type';

const updatesMock: CampaignUpdates[] = [
  {
    id: '1',
    campaign_id: '1',
    title: 'First Update',
    content:
      'Our CSR team visited the planned school site in Điện Biên. The local committee confirmed that the land has been allocated and basic access roads are available. We captured the current condition of the classrooms and dormitory area. http://localhost:3000/donation-campaign/ncc-build-school-2025rivnmebntibnoinrlekvrorinvoinvoi5nvtoivnroivnroivnroinvoenvrvrvr',
    timestamp: 1764144381,
    owner: '0x123...abc',
    images: [
      'https://s.yimg.com/ny/api/res/1.2/KtDOljqM2P1gMbIQPQRUUQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTYzMA--/https://media.zenfs.com/en/buzzfeed_articles_778/bf3b1668931854e68006c93874469cd8',
    ],
    cid: 'de1a7a3918ec00fb8b99ce3e9382a58f8a2bde1tujjyjbd0904ujyujy',
    txHash: 'dytnytttttttttttnrnt58f8a2bde153a05cf331fe1dbd0904aad51',
    created_at: '2024-01-01T10:00:00Z',
    status: 'recent',
  },
  {
    id: '2',
    campaign_id: '1',
    title: 'Second Update',
    content:
      'Our CSR team visited the planned school site in Điện Biên. The local committee confirmed that the land has been allocated and basic access roads are available. We captured the current condition of the classrooms and dormitory area.',
    timestamp: 1764144381,
    owner: '0x123...abc',
    images: [
      'https://profile.mezon.ai/1946198449917530112/1993505323268182016.jpg',
    ],
    cid: 'de1a7a3918ec00fb8b99ce3e9382a58f8a2bde153a05tbreberberb',
    txHash: 'de1a7a3918vevrevrbrtbf8a2bde153a05cf331fe1dbd0904aad51',
    created_at: '1764144381',
    status: 'older',
  },
  {
    id: '3',
    campaign_id: '1',
    title: 'Update #3 · Site inspection',
    content:
      'Our CSR team visited the planned school site in Điện Biên. The local committee confirmed that the land has been allocated and basic access roads are available. We captured the current condition of the classrooms and dormitory area.',
    timestamp: 1764144381,
    owner: '0x123...abc',
    images: [
        'https://th.bing.com/th/id/OIP.XYXlyd5ucp1HT4YGKAqu3QHaEZ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
        
    ],
    cid: 'de1a7a3918ec00fb8b99ce3e9382a58f8a2bde153a05tbreberberb',
    txHash: 'de1a7a3918vevrevrbrtbf8a2bde153a05cf331fe1dbd0904aad51',
    created_at: '1764144381',
    status: 'hidden',
  }
];

export const DonationFeed = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex w-full flex-row justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Updates</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Follow the full journey of this campaign.</p>
        </div>
        <div>
          <Button variant="default" className="bg-brand-primary hover:bg-brand-primary/80 text-white">
            + Add Update
          </Button>
        </div>
      </div>
      <UpdateInstruction />
      {updatesMock.length === 0 ? (
        <p className="text-center text-muted-foreground">No updates have been posted for this campaign yet.</p>
      ) : (
      <UpdateList updates={updatesMock} />
      )}
    </div>
  );
};
