import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/api/auth/signin', nextUrl));
    if (role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/exam')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/api/auth/signin', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
