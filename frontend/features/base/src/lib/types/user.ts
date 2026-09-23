/**
 * [role]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:12:36 am
 * 
 * Matches AuthService#login on the backend, which lowercases the Spring
 * but the wire value is not — see AuthService.java: .toLowerCase()).
 * Security authority before returning it (UserRole enum is uppercase,
 */
export type Role = 'candidate' | 'marketer' | 'supporter' | 'admin';

/**
 * Matches CandidateResponse on the backend (user/dto/CandidateResponse.java)
 * — a minimal, name-only projection of a CANDIDATE-role user, distinct from
 * the admin-only User type.
 */
export interface Candidate {
  id: string;
  name: string;
}


/**
 * Wire value of the backend UserRole enum on /users endpoints. Unlike /auth
 * (see Role above), UserResponse serializes the enum as-is — uppercase.
 */
export type UserRole = 'CANDIDATE' | 'MARKETER' | 'SUPPORTER' | 'ADMIN';

export const USER_ROLES: readonly UserRole[] = ['CANDIDATE', 'MARKETER', 'SUPPORTER', 'ADMIN'];

/**
 * Matches UserResponse on the backend (user/dto/UserResponse.java) — the
 * full, admin-only view of a user returned by /users.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
