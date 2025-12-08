import { IDonationFeed } from '../type';

export const mockDonationFeed: IDonationFeed[] = [
  {
    id: 1,
    tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    owner_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    campaign_address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    extra_info: {
      title: 'Construction Progress - December 2025',
      description:
        'Great progress this month! The foundation is complete and we have started building the walls. The construction team has been working diligently despite the weather challenges. We expect to complete the structural work by end of January.',
      image_cids: [
        'bafybeiaqhzmh67por267a3sy6xowd7lx4rmqil6vswlzcvhx4gcr5stn6m',
        'bafybeih37xg6wjbi6emu7kjnszsiunx34lezzv4wgjqvcc6fyxerk3iana',
        'bafybeiaqhzmh67por267a3sy6xowd7lx4rmqil6vswlzcvhx4gcr5stn6m',

      ],
    },
    created_at: '2025-12-05T10:30:00Z',
  },
  {
    id: 2,
    tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    owner_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    campaign_address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    extra_info: {
      title: 'Foundation Work Completed',
      description:
        'We are excited to share that the foundation work has been successfully completed! The concrete has cured properly and all inspections have passed. Next phase will begin next week.',
      image_cids: [
        'bafybeiaqhzmh67por267a3sy6xowd7lx4rmqil6vswlzcvhx4gcr5stn6m',
        'bafybeih37xg6wjbi6emu7kjnszsiunx34lezzv4wgjqvcc6fyxerk3iana',
      ],
    },
    created_at: '2025-11-28T14:20:00Z',
  },
  {
    id: 3,
    tx_hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    owner_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    campaign_address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    extra_info: {
      title: 'Project Kickoff',
      description:
        'Thank you all for your generous donations! We have officially started the construction project. The site has been cleared and foundation excavation is underway. Stay tuned for more updates!',
      image_cids: ['bafybeiaqhzmh67por267a3sy6xowd7lx4rmqil6vswlzcvhx4gcr5stn6m',],
    },
    created_at: '2025-11-15T09:00:00Z',
  },
  {
    id: 4,
    tx_hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    owner_address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    campaign_address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    extra_info: {
      title: 'Reaching Our First Milestone',
      description:
        'Amazing news! We have reached 50% of our funding goal. Your support means the world to us. With this momentum, we can start the construction phase ahead of schedule.',
      image_cids: [],
    },
    created_at: '2025-11-01T16:45:00Z',
  },
];
