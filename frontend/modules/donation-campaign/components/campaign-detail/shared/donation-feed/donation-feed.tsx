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
      'https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/481276965_568917986196742_8398674223485037358_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=VuyK__jNh-kQ7kNvwHCWuAA&_nc_oc=AdkEvKKbAi3hvWN-ZPOGaNXU1ggUsVVJSOgs20q1ppRdgoqbPuGF_6egi-HAMCGMsks&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=08IBDCcW4P9gnjCq-Qx-yw&oh=00_AfgjIdnslLvHQYFMjJdmH08mdQCnsVrze_xCRLCdV2GILQ&oe=692DB9B8',
      'https://scontent.fhan17-1.fna.fbcdn.net/v/t39.30808-6/480945157_568917989530075_2497638292110411262_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=tAskDEKK5YoQ7kNvwEOIs7B&_nc_oc=AdnE4NLb8AAGHcQlJTtnAnV_DNe0jnk9cW_n0xZsa5i0sdJkY5y_Rz4gLAkNQfF5v38&_nc_zt=23&_nc_ht=scontent.fhan17-1.fna&_nc_gid=umL2OEsHL1Nqtlyb9xyQYg&oh=00_AfjgG8BYzB7A-Ork-QYCT5eMdjTcSBVXUHvVzs8WPEtIpw&oe=692DF0C8',
      'https://scontent.fhan17-1.fna.fbcdn.net/v/t39.30808-6/468546903_498405553247986_582207766095035070_n.jpg?stp=cp6_dst-jpegr_tt6&_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=MURmYzH2ALwQ7kNvwEjr95z&_nc_oc=AdlUdAhdtajls6aSWc7XuxsAm7YhRrt-q8DNWU7Ws4My4XHuJ2q7eX99u2S9-igDLxY&_nc_zt=23&se=-1&_nc_ht=scontent.fhan17-1.fna&_nc_gid=i99H9Rc54pFH1LiYM7zVKQ&oh=00_AfiGq3f4GXVBbn5N1kJG7372dlnhHo-1bYBOKLfUqeRfmw&oe=692DBCBC',
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
      'https://th.bing.com/th/id/R.34bdc0ab541552ee99fcc08bf5b8ace8?rik=CsTpM5iYVxV%2bMw&riu=http%3a%2f%2fgetwallpapers.com%2fwallpaper%2ffull%2fe%2f6%2f8%2f364124.jpg&ehk=pPAyRGiw998Mk%2fAGorAYz9RO4BV%2f%2flQvgV%2bQCkwhxcM%3d&risl=&pid=ImgRaw&r=0',
      'https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/481352518_568918106196730_2311658650252299929_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Unp5OXz1aygQ7kNvwEpn2tA&_nc_oc=AdkKTWFOfoSdpmtyqZ8ikKmCWD6FNqqcsyos1eE-2teUiib_UNp60jH8Rh_8uJnC6yI&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=y84u7h4mXTF2fNaZb3xSXw&oh=00_AfgF6eo-cThur79of1jcxaOu4Z41MIjXv-Ewv968JrWamQ&oe=692DCDCC',
    ],
    cid: 'de1a7a3918ec00fb8b99ce3e9382a58f8a2bde153a05tbreberberb',
    txHash: 'de1a7a3918vevrevrbrtbf8a2bde153a05cf331fe1dbd0904aad51',
    created_at: '1764144381',
    status: 'older',
  },
  {
    id: '3',
    campaign_id: '1',
    title: 'Third Update',
    content:
      'Our CSR team visited the planned school site in Điện Biên. The local committee confirmed that the land has been allocated and basic access roads are available. We captured the current condition of the classrooms and dormitory area.',
    timestamp: 1764144381,
    owner: '0x123...abc',
    images: ['https://th.bing.com/th/id/OIP.XYXlyd5ucp1HT4YGKAqu3QHaEZ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3'],
    cid: 'de1a7a3918ec00fb8b99ce3e9382a58f8a2bde153a05tbreberberb',
    txHash: 'de1a7a3918vevrevrbrtbf8a2bde153a05cf331fe1dbd0904aad51',
    created_at: '1764144381',
    status: 'hidden',
  },
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
        <p className="text-muted-foreground text-center">No updates have been posted for this campaign yet.</p>
      ) : (
        <UpdateList updates={updatesMock} />
      )}
    </div>
  );
};
