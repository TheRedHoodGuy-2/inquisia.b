import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);

        const getSafeParam = (name: string) => {
            const val = searchParams.get(name);
            return (val === "undefined" || val === "null" || !val) ? undefined : val;
        };

        const query = getSafeParam("query");
        const role = getSafeParam("role");
        const status = getSafeParam("status");

        const users = await AdminService.getUsers(query, role, status);
        const responseJson = { success: true, data: users };
        console.log(`[API /admin/users] params -> query: ${query}, role: ${role}, status: ${status} | found ${users?.length} users`);
        return NextResponse.json(responseJson);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
