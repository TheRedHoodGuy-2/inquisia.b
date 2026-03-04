import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "projects";

        let csv = "";
        let filename = "";

        if (type === "users") {
            const users = await AdminService.getUsers();
            csv = "ID,Email,Role,FullName,DisplayName,Department,Status,CreatedAt\n";
            users.forEach(u => {
                const escapedName = `"${(u.full_name || u.display_name || '').replace(/"/g, '""')}"`;
                const escapedDept = `"${(u.department?.name || '').replace(/"/g, '""')}"`;
                csv += `${u.id},${u.email},${u.role},${escapedName},${u.display_name || ''},${escapedDept},${u.account_status},${u.created_at}\n`;
            });
            filename = `inquisia_users_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            const projects = await AdminService.getProjects();
            csv = "ID,Title,Status,Supervisor,Department,Author,CreatedAt\n";
            projects.forEach(p => {
                const escapedTitle = `"${(p.title || '').replace(/"/g, '""')}"`;
                const supervisorName = `"${(p.supervisor?.full_name || p.supervisor?.display_name || '').replace(/"/g, '""')}"`;
                const authorName = `"${(p.project_authors?.[0]?.student?.full_name || '').replace(/"/g, '""')}"`;
                const escapedDept = `"${(p.department?.name || '').replace(/"/g, '""')}"`;
                csv += `${p.id},${escapedTitle},${p.status},${supervisorName},${escapedDept},${authorName},${p.created_at}\n`;
            });
            filename = `inquisia_projects_${new Date().toISOString().split('T')[0]}.csv`;
        }

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
