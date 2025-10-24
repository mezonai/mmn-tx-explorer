import type { Metadata } from 'next';

import { MezonGame } from '@/modules/mezon-game/components';

export const metadata: Metadata = {
  title: 'Mezon Game',
};

export default function MezonGamePage() {
  return <MezonGame />;
}
