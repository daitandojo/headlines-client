import { NextResponse } from 'next/server';

const COOKIE_NAME = 'headlines-auth';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'default-secret-for-dev-please-change-in-production';

export function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // Log every request the middleware is running for.
    // This will show up in your `npm run dev` terminal.
    console.log(`[Middleware] Checking path: ${pathname}`);

    // Define paths that should NOT be protected by the password.
    const publicPaths = [
        '/login',
        // Add any other public paths here, e.g., '/about', '/privacy'
    ];

    // Check if the current path is one of the public paths.
    // We also exclude Next.js internal paths and API routes.
    if (
        publicPaths.includes(pathname) || 
        pathname.startsWith('/_next/') || 
        pathname.startsWith('/api/') ||
        pathname.includes('/favicon.ico')
    ) {
        // If it's a public path, do nothing and let the request continue.
        console.log(`[Middleware] Path is public. Allowing access.`);
        return NextResponse.next();
    }
    
    // --- If the path is NOT public, proceed with authentication check ---
    
    const authCookie = request.cookies.get(COOKIE_NAME);
    const isAuthenticated = authCookie && authCookie.value === COOKIE_SECRET;

    if (isAuthenticated) {
        // User has the correct cookie. Allow them to proceed to the protected page.
        console.log(`[Middleware] User is authenticated. Allowing access.`);
        return NextResponse.next();
    }

    // User is not authenticated. Redirect them to the login page.
    console.log(`[Middleware] User is NOT authenticated. Redirecting to /login.`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
}

// A simple, broad matcher to ensure the middleware runs on EVERY request.
// The logic inside the function will then decide which paths are public.
export const config = {
  matcher: '/:path*',
};