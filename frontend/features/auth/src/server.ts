export { auth, handlers, signIn, signOut } from './lib/auth';

export * from './lib/actions/auth';
export * from './lib/types/index';
// Re-exported so the `declare module 'next-auth'` augmentation in this file
// (jwtToken/refreshToken/role/expiration/error on Session & JWT) is part of
// any consumer's TS program that imports from '@feature/auth/server' — the
// main './index' entry re-exports it too, but this entry didn't, so
// session.user.jwtToken was untyped for anyone importing only '/server'.
export type { JWT, Session, User } from './lib/types/next-auth';
