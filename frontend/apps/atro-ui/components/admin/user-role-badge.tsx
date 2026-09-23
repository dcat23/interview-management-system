import type { UserRole } from '@feature/base/server';
import { Badge } from '@app/atro-ui/components/ui/common/badge';

export const ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE: 'Candidate',
  MARKETER: 'Marketer',
  SUPPORTER: 'Supporter',
  ADMIN: 'Admin',
};

interface Props {
  role: UserRole;
}

export function UserRoleBadge({ role }: Props) {
  return (
    <Badge variant={role === 'ADMIN' ? 'default' : 'outline'} className="text-[10px]">
      {ROLE_LABEL[role]}
    </Badge>
  );
}

export default UserRoleBadge;
