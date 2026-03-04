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

export async function middleware(request: NextRequest) {
    const origin = request.headers.get("origin");
    const { pathname } = request.nextUrl;

    // 1. Handle preflight requests
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        if (origin) {
            response.headers.set("Access-Control-Allow-Origin", origin);
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
    if (origin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
