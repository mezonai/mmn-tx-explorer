import { Profile } from '@/modules/profile/components/profile';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
};

export default function ProfilePage() {
  return <Profile />;
}
