import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
    "/dashboard",
    "/upload",
    "/supervisor",
    "/admin"
];

// Routes that can't be visited if we are ALREADY logged in
const AUTH_ROUTES = ["/login", "/register"];

// ── Allowed CORS origins ────────────────────────────────────────────────────
// Add your Vercel frontend URL as FRONTEND_URL in Netlify's environment variables.
// localhost:5173 is always allowed for local development.
function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;

    const allowed: string[] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ];

    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) allowed.push(frontendUrl);

    // Also allow any *.vercel.app subdomain (covers preview deployments)
    if (origin.match(/^https:\/\/[a-z0-9-]+\.vercel\.app$/)) return true;

    return allowed.includes(origin);
}

export async function middleware(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { pathname } = request.nextUrl;

    // 1. Handle preflight requests
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        if (isAllowedOrigin(origin)) {
            response.headers.set("Access-Control-Allow-Origin", origin!);
            response.headers.set("Access-Control-Allow-Credentials", "true");
            response.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
            response.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
        }
        return response;
    }

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
    const sessionToken = request.cookies.get("inquisia_session")?.value;

    let response: NextResponse;

    if (isProtectedRoute && !sessionToken) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        response = NextResponse.redirect(url);
    } else if (isAuthRoute && sessionToken) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        response = NextResponse.redirect(url);
    } else {
        response = NextResponse.next();
    }

    // Apply CORS headers to all responses
    if (isAllowedOrigin(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin!);
        response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
