import { redirect } from 'next/navigation';
import { auth, me } from '@feature/auth/server';
import { SettingsPanel } from '@app/atro-ui/components/supporter/settings-panel';
import { MARKETER_SETTINGS_SECTIONS } from '@app/atro-ui/components/supporter/settings-fields';

async function AppMarketerSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer' || !session.user.jwtToken) {
    redirect('/login');
  }

  const meResponse = await me({ jwtToken: session.user.jwtToken });

  if (!meResponse.success || !meResponse.data) {
    throw new Error(meResponse.message ?? 'Failed to load your profile');
  }

  // Profile is the only section marketers get, so there's no ?section= to read.
  return <SettingsPanel me={meResponse.data} initialSection="profile" sections={MARKETER_SETTINGS_SECTIONS} />;
}

export default AppMarketerSettingsPage;
