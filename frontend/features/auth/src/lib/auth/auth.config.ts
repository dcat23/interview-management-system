import type { NextAuthConfig } from 'next-auth';
import { authorized, jwt, redirect, session } from './callbacks';

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

// Edge-safe config (no providers) — usable in middleware for route protection.
export const authConfig = {
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
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  providers: [],
} satisfies NextAuthConfig;
