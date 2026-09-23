import { redirect } from 'next/navigation';
import { auth, me } from '@feature/auth/server';
import { getApiKeys } from '@feature/backend/server';
import { SettingsPanel } from '@app/atro-ui/components/supporter/settings-panel';
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@app/atro-ui/components/supporter/settings-fields';

interface Props {
  searchParams: Promise<{ section?: string }>;
}

function toSection(value: string | undefined): SettingsSection {
  return SETTINGS_SECTIONS.find((s) => s.id === value)?.id ?? 'profile';
}

async function AppSupporterSettingsPage(props: Props) {
  const session = await auth();

  if (session?.user?.role !== 'supporter' || !session.user.jwtToken) {
    redirect('/login');
  }

  const { section } = await props.searchParams;
  const [meResponse, apiKeysResponse] = await Promise.all([
    me({ jwtToken: session.user.jwtToken }),
    getApiKeys(),
  ]);

  if (!meResponse.success || !meResponse.data) {
    throw new Error(meResponse.message ?? 'Failed to load your profile');
  }

  return (
    <SettingsPanel
      me={meResponse.data}
      apiKeys={apiKeysResponse.success ? (apiKeysResponse.data ?? []) : []}
      initialSection={toSection(section)}
    />
  );
}

export default AppSupporterSettingsPage;
