import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { requireAuth } from "@/lib/session";
import { profileUpdateSchema } from "@/schemas";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await UserService.getProfileById(id);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found." },
                { status: 404 }
            );
        }

        // Exclude password hashes or sensitive fields. (Our DB returns the hash if requested via '*' so we must manually scrub)
        const { password_hash, ...safeUser } = user as any;

        return NextResponse.json({ success: true, data: safeUser }, { status: 200 });
    } catch (error: any) {
        console.error("Fetch profile error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch profile." },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Authenticate Request
        const sessionUser = await requireAuth();
        const { id } = await params;

        // 2. Authorization check: Only the owning user can edit their own profile
        if (sessionUser.id !== id && sessionUser.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Forbidden. You can only update your own profile." },
                { status: 403 }
            );
        }

        // 3. Validation
        const body = await request.json();
        const validation = profileUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // 4. Update
        const updatedUser = await UserService.updateProfile(id, validation.data);

        // Filter sensitive info
        const { password_hash, ...safeUser } = updatedUser as any;

        return NextResponse.json({ success: true, data: safeUser }, { status: 200 });

    } catch (error: any) {
        console.error("Update profile error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
