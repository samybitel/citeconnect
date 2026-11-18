import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'cc_session';
const PROTECTED = ['/dashboard', '/account', '/services', '/transport', '/notifications'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/services/:path*', '/transport/:path*', '/notifications/:path*'],
};