/**
 * [role]
 * next-feature@0.1.4-3
 * July 4th 2026, 12:04:04 am
 */
import type { Role } from '@feature/base/server';
export type { Role };

export const ROLE_HOME: Record<Role, string> = {
  candidate: '/candidate',
  marketer: '/marketer',
  supporter: '/supporter',
  admin: '/admin',
};
