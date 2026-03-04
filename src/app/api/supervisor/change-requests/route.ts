import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ChangeRequestService } from "@/services/change-request.service";

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        if (user.role !== "supervisor") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const requests = await ChangeRequestService.getSupervisorRequests(user.id);
        return NextResponse.json({ success: true, data: requests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
