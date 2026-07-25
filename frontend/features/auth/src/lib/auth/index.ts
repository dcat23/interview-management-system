import NextAuth, { CredentialsSignin, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';
import { login, me } from '../actions/auth';
import { logger } from '@next-feature/logging/server';

const log = logger.child({ module: "nextauth-config"})

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const response = await login({
          email: credentials.email as string,
          password: credentials.password as string
        })

        if (response.success) {
          const data = response.data;

          // Fetch full profile (real UUID id, name) so the session carries
          // more than the bare tokens login() returns. Falls back to the
          // email-as-id shape if this fails so a transient /auth/me error
          // doesn't block sign-in.
          const profile = await me({ jwtToken: data.accessToken });

          return {
            id: profile.success ? profile.data.id : (credentials.email as string),
            name: profile.success ? profile.data.name : undefined,
            email: credentials.email as string,
            jwtToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiration: data.expiration,
            role: data.role,
          } satisfies User;
        }
        
        if (response.error) {
          log.error(`authorize() ${JSON.stringify(response.error.body)}`);
          
        }

        throw new CredentialsSignin(response.message);
      },
    }),
  ],
});
