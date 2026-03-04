import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ChangeRequestService } from "@/services/change-request.service";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const result = await ChangeRequestService.withdrawRequest(id, user.id);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
