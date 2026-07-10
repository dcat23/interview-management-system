import type { DefaultSession, DefaultUser, Session, User } from 'next-auth';
import type { DefaultJWT, JWT } from 'next-auth/jwt';
import { Role } from '.';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: User;
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
    jwtToken?: string;
    refreshToken?: string;
    expiration?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: Role;
    jwtToken: string;
    expiration: number;
    refreshToken: string;
  }
}

export type { JWT, Session, User };
