import type { Metadata } from 'next';
import HomeUnderConstruction from '@/components/Home/HomeUnderConstruction';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Under construction',
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return <HomeUnderConstruction siteName={SITE_NAME} />;
}
