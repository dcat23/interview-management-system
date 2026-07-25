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

