import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // Public routes - allow access without auth check
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/login' || 
    pathname === '/signup'
  ) {
    return res;
  }

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && pathname !== '/login' && pathname !== '/signup') {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to chats if already authenticated and trying to access auth pages
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/chats', req.url));
  }

  return res;
}

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
