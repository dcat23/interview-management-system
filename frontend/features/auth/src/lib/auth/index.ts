import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';
import { login } from '../actions/auth';

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
          return {
            id: credentials.email as string,
            email: credentials.email as string,
            jwtToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiration: data.expiration,
            role: data.role,
          } satisfies User;
        }
        return null;
      },
    }),
  ],
});
