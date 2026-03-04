import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase-admin";
import { User, SessionData } from "../types";

const SESSION_COOKIE_NAME = "inquisia_session";

export async function createSessionCookie(token: string, expiresAt: Date) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });
}

export async function destroySessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

// Internal function to check the session token against the DB
export async function getSession(req?: NextRequest): Promise<SessionData | null> {
    const token = req
        ? req.cookies.get(SESSION_COOKIE_NAME)?.value
        : (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    // Validate the token and fetch user details
    const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from("sessions")
        .select(`
      expires_at,
      user_id,
      users:users (
        id, email, role, full_name, display_name, bio, links, matric_no, staff_id, degrees,
        level, department_id, is_verified, is_active, account_status, status_reason, status_set_by,
        status_set_at, created_at, updated_at
      )
    `)
        .eq("token", token)
        .single();

    if (sessionError || !sessionData) return null;

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
        await supabaseAdmin.from("sessions").delete().eq("token", token);
        return null; // Expired
    }

    // Next.js handles foreign key relationships as arrays or objects depending on cardinality. `users` will be a single object.
    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users;

    if (!user || user.account_status === "banned" || !user.is_active) {
        // If banned or inactive, automatically purge their session row to secure the entrypoint
        await supabaseAdmin.from("sessions").delete().eq("token", token);
        return null;
    }

    return {
        user: user as unknown as User,
    };
}

// Wrapper to be used inside protected Route Handlers or Server Actions
export async function requireAuth(req?: NextRequest): Promise<User> {
    const session = await getSession(req);
    if (!session) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

// Wrapper to be used inside Admin protected Route Handlers or Server Actions
export async function requireAdmin(req?: NextRequest): Promise<User> {
    const user = await requireAuth(req);
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    return user;
}
