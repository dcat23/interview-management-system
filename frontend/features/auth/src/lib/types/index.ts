/**
 * [role]
 * next-feature@0.1.4-3
 * July 4th 2026, 12:04:04 am
 */
// Matches AuthService#login on the backend, which lowercases the Spring
// Security authority before returning it (UserRole enum is uppercase,
// but the wire value is not — see AuthService.java: .toLowerCase()).
export type Role = 'candidate' | 'marketer' | 'supporter' | 'admin';

export const ROLE_HOME: Record<Role, string> = {
  candidate: '/candidate',
  marketer: '/marketer',
  supporter: '/supporter',
  admin: '/admin',
};
