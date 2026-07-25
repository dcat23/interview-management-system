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


  if (pathname === '/login') {
    if (role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(role ? ROLE_HOME[role] : '/login', req.url),
    );
  }

  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const home = ROLE_HOME[role];
  if (!pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
