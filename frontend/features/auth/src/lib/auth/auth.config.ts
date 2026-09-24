import { logger } from '@next-feature/logging/server';
import type { NextAuthConfig } from 'next-auth';
import { authorized, jwt, redirect, session } from './callbacks';
import { ApiAuthError } from './error';

const log = logger.child({ module: 'auth-config' });
const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

// Edge-safe config (no providers) — usable in middleware for route protection.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: '/login', // Error code passed in query string as ?error=
    newUser: '/onboarding',
  },
  callbacks: {
    authorized,
    jwt,
    session,
    redirect,
  },
  session: { strategy: 'jwt' },
  cookies: {
    csrfToken: {
      name: 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  logger: {
    error(error) {
      if (error instanceof ApiAuthError) {
        log.error(error.body, error.name);
        return;
      }
      log.error(`${error.name}: ${error.message}`);
    },
  },
  providers: [],
};
