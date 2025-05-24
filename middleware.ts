import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create Supabase client specific to this request
    const supabase = createMiddlewareClient({ req, res });
    
    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isAuthPage = req.nextUrl.pathname === '/login';
    const isPublicPath = ['/login'].includes(req.nextUrl.pathname);

    // Redirect authenticated users from login page
    if (isAuthPage && session) {
      return NextResponse.redirect(new URL('/chats', req.url));
    }

    // Redirect unauthenticated users to login page
    if (!session && !isPublicPath) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      const encodedFrom = encodeURIComponent(from);
      return NextResponse.redirect(
        new URL(`/login?from=${encodedFrom}`, req.url)
      );
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, redirect to login if not already there
    if (req.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
