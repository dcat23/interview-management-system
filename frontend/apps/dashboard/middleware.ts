import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig, ROLE_HOME, type Role } from '@feature/auth';
import { logger } from '@next-feature/logging/server';
const log = logger.child({module: "middleware"})

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const role = req.auth?.user?.role as Role | undefined;
  // Set by the jwt() callback when a refresh attempt fails against an old
  // or invalid refresh token — the access token on file is dead even though
  // the session cookie itself is still present, so route as unauthenticated.
  const hasRefreshError = !!req.auth?.error;

  if (pathname === '/login') {
    if (role && !hasRefreshError) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(role && !hasRefreshError ? "/dashboard" : '/login', req.url),
    );
  }

  if (!role || hasRefreshError) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // const home = ROLE_HOME[role];
  // if (!pathname.startsWith(home)) {
  //   return NextResponse.redirect(new URL(home, req.url));
  // }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
