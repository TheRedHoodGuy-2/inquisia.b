import { supabaseAdmin } from "@/lib/supabase-admin";
import { User, AccountStatus } from "@/types";

export class AdminService {
    /**
     * Get platform-wide metrics
     */
    static async getPlatformMetrics() {
        const [
            { count: totalUsers },
            { count: totalProjects },
            { count: pendingSupps },
            { count: pendingProjects }
        ] = await Promise.all([
            supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
            supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "approved"),
            supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "supervisor").eq("is_verified", false),
            supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "pending")
        ]);

        return {
            totalUsers: totalUsers || 0,
            totalProjects: totalProjects || 0,
            pendingSupervisors: pendingSupps || 0,
            pendingProjects: pendingProjects || 0
        };
    }

    /**
     * Fetch all users with search and filter
     */
    static async getUsers(query?: string, role?: string, status?: string) {
        let supabaseQuery = supabaseAdmin
            .from("users")
            .select(`
                *,
                department:departments(name)
            `)
            .order("created_at", { ascending: false });

        if (role) supabaseQuery = supabaseQuery.eq("role", role);
        if (status) supabaseQuery = supabaseQuery.eq("account_status", status);
        if (query) {
            supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
        }

        const { data, error } = await supabaseQuery;
        console.log(`[AdminService.getUsers] data length: ${data?.length}, error: ${error?.message || 'none'}`);
        if (error) throw new Error(`Failed to fetch users: ${error.message}`);
        return data as any[];
    }

    /**
     * Verify a supervisor
     */
    static async verifySupervisor(userId: string) {
        const { error } = await supabaseAdmin
            .from("users")
            .update({ is_verified: true })
            .eq("id", userId);

        if (error) throw new Error(`Failed to verify supervisor: ${error.message}`);
        return { success: true };
    }

    /**
     * Moderation action: warning, restriction, ban
     */
    static async updateUserStatus(userId: string, adminId: string, status: AccountStatus, reason: string) {
        const { error } = await supabaseAdmin
            .from("users")
            .update({
                account_status: status,
                status_reason: reason,
                status_set_by: adminId,
                status_set_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (error) throw new Error(`Failed to update user status: ${error.message}`);

        if (status === "banned") {
            await supabaseAdmin.from("sessions").delete().eq("user_id", userId);
        }

        return { success: true };
    }

    /**
     * Manage lookup data (Departments / AI Categories)
     */
    static async manageLookupData(table: "departments" | "ai_categories", action: "create" | "update" | "delete", id?: string, data?: any) {
        if (action === "create") {
            const { error } = await supabaseAdmin.from(table).insert(data);
            if (error) throw new Error(`Failed to create ${table}: ${error.message}`);
        } else if (action === "update" && id) {
            const { error } = await supabaseAdmin.from(table).update(data).eq("id", id);
            if (error) throw new Error(`Failed to update ${table}: ${error.message}`);
        } else if (action === "delete" && id) {
            if (table === "departments") {
                const { count } = await supabaseAdmin.from("users").select("*", { count: 'exact', head: true }).eq("department_id", id);
                if (count && count > 0) throw new Error(`Cannot delete — ${count} user(s) are assigned to this department.`);
            } else if (table === "ai_categories") {
                const { count } = await supabaseAdmin.from("ai_categories").select("*", { count: 'exact', head: true });
                if (count && count <= 1) throw new Error("Cannot delete the only remaining AI category.");
            }

            const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
            if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
        }
        return { success: true };
    }

    /**
     * Get recent logs/actions
     */
    static async getRecentActivity() {
        // Fetch new users and new project submissions
        const [users, projects] = await Promise.all([
            supabaseAdmin.from("users").select("full_name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
            supabaseAdmin.from("projects").select("title, status, created_at").order("created_at", { ascending: false }).limit(5)
        ]);

        const combined = [
            ...(users.data || []).map(u => ({ type: 'user', title: u.full_name || u.email, subtitle: `New ${u.role} registered`, date: u.created_at })),
            ...(projects.data || []).map(p => ({ type: 'project', title: p.title, subtitle: `New project ${p.status}`, date: p.created_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

        return combined;
    }

    /**
     * Fetch all projects for admin oversight
     */
    static async getProjects(query?: string, status?: string, departmentId?: string) {
        let supabaseQuery = supabaseAdmin
            .from("projects")
            .select(`
                *,
                department:departments(name),
                supervisor:supervisor_id(full_name, display_name),
                project_authors(
                    student:student_id(full_name, display_name)
                )
            `)
            .order("created_at", { ascending: false });

        if (status) supabaseQuery = supabaseQuery.eq("status", status);
        if (departmentId) supabaseQuery = supabaseQuery.eq("department_id", departmentId);
        if (query) {
            supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,abstract.ilike.%${query}%`);
        }

        const { data, error } = await supabaseQuery;
        if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
        return data as any[];
    }

    /**
     * Forcefully update project status
     */
    static async updateProjectStatus(projectId: string, adminId: string, status: string, reason: string) {
        const { error } = await supabaseAdmin
            .from("projects")
            .update({
                status,
                supervisor_feedback: `[Admin Intervention] ${reason}`,
                updated_at: new Date().toISOString()
            })
            .eq("id", projectId);

        if (error) throw new Error(`Failed to update project status: ${error.message}`);
        return { success: true };
    }

    /**
     * Hard delete a project
     */
    static async deleteProject(projectId: string) {
        const { error } = await supabaseAdmin
            .from("projects")
            .delete()
            .eq("id", projectId);

        if (error) throw new Error(`Failed to delete project: ${error.message}`);
        return { success: true };
    }
}
