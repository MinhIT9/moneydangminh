import 'server-only';

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

export const registrationSettingTag = 'registration-setting';

const getCachedRegistrationOpen = unstable_cache(
  async () => {
    const registrationSetting = await db.appSetting.findUnique({
      where: { key: 'registration_open' },
    });

    return registrationSetting?.value !== 'false';
  },
  ['registration-open'],
  {
    revalidate: false,
    tags: [registrationSettingTag],
  },
);

/**
 * The registration switch is public, read frequently, and changes only through
 * the admin action. That action calls updateTag(), so visitors see a new state
 * immediately without querying MariaDB for every visit or route prefetch.
 */
export function isRegistrationOpen() {
  return getCachedRegistrationOpen();
}
