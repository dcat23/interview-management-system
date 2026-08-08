import type { NextAuthConfig } from 'next-auth';
import { Role } from '../types';
import { logger } from '@next-feature/logging/server';
import moment from 'moment';

const log = logger.child({ module: "auth-callbacks"})

type Callbacks = NonNullable<NextAuthConfig['callbacks']>;

export const jwt: Callbacks['jwt'] = async ({ token, user }) => {
  if (user) {
    token.role = user.role;
    token.jwtToken = user.jwtToken ?? '';
    token.refreshToken = user.refreshToken ?? '';
    token.expiration = user.expiration ?? 0;
    token.name = user.name;
    token.email = user.email;
    delete token.error;
    return token;
  }
  const expirationThreshold = moment(token.expiration).subtract(5, 'm');
  const isExpiringSoon = moment().isSameOrAfter(expirationThreshold);


  if (!isExpiringSoon) {
    return token;
  }

  // Dynamic import avoids a static cycle through lib/auth/index.ts (which
  // pulls in the credentials provider and its `login` action) — auth.config.ts
  // must stay importable without that provider graph.
  log.info(
    {
      expiration: expirationThreshold.fromNow().valueOf(),
    },
    'Jwt token expiration',
  );
  const { refresh } = await import('../actions/auth');
  const response = await refresh({ refreshToken: token.refreshToken });

  if (!response.success || !response.data) {
    log.info(response.error?.body, "Refresh failed");
    // Refresh token is old, invalid, or already used — flag the token as
    // errored so the session callback and middleware can treat this as
    // unauthenticated and bounce the user to /login instead of silently
    // continuing with a dead access token.
    return { ...token, error: 'RefreshTokenError' as const };
  }

  token.jwtToken = response.data.accessToken;
  token.refreshToken = response.data.refreshToken;
  token.expiration = response.data.expiration;
  delete token.error;

  return token;
};

export const session: Callbacks['session'] = async ({ session, token }) => {
  if (token && session.user) {
    session.user.id = token.sub as string;
    session.user.role = token.role as Role;
    session.user.jwtToken = token.jwtToken as string;
    session.user.refreshToken = token.refreshToken as string;
  }
  if (token.error) {
    session.error = token.error;
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
  return true;
};
