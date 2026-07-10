import type { NextAuthConfig } from 'next-auth';
import { Role } from '../types';

type Callbacks = NonNullable<NextAuthConfig['callbacks']>;

export const jwt: Callbacks['jwt'] = async ({ token, user }) => {
  if (user) {
    token.role = user.role;
    token.jwtToken = user.jwtToken ?? '';
    token.refreshToken = user.refreshToken ?? '';
    token.expiration = user.expiration ?? 0;
    return token;
  }

  const isExpiringSoon = Date.now() >= token.expiration - 6000;
  if (!isExpiringSoon) {
    return token;
  }

  // Dynamic import avoids a static cycle through lib/auth/index.ts (which
  // pulls in the credentials provider and its `login` action) — auth.config.ts
  // must stay importable without that provider graph.
  const { refresh } = await import('../actions/auth');
  const response = await refresh({ refreshToken: token.refreshToken });

  if (!response.success || !response.data) {
    return token;
  }

  token.jwtToken = response.data.accessToken;
  token.refreshToken = response.data.refreshToken;
  token.expiration = response.data.expiration;

  return token;
};

export const session: Callbacks['session'] = async ({ session, token }) => {
  if (token && session.user) {
    session.user.id = token.sub as string;
    session.user.role = token.role as Role;
    session.user.jwtToken = token.jwtToken as string;
    session.user.refreshToken = token.refreshToken as string;
  }
  return session;
};

export const redirect: Callbacks['redirect'] = async ({ url, baseUrl }) => {
  // Allows relative callback URLs
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  // Allows callback URLs on the same origin
  if (new URL(url).origin === baseUrl) return url;
  return baseUrl;
};

export const authorized: Callbacks['authorized'] = ({ auth, request }) => {
  // routing logic moves to the custom middleware wrapper
  return !!auth.user;
};
