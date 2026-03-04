import { supabaseAdmin } from "@/lib/supabase-admin";

export class BookmarkService {
    /**
     * Get all bookmarked projects for a user
     */
    static async getBookmarks(userId: string) {
        const { data, error } = await supabaseAdmin
            .from("bookmarks")
            .select(`
                id,
                project_id,
                created_at,
                project:projects (
                    id,
                    title,
                    abstract,
                    year,
                    ai_category,
                    department_id,
                    department:departments(name),
                    supervisor_id,
                    uploaded_by,
                    status,
                    downloads,
                    authors:project_authors(
                        id,
                        role_description,
                        student:student_id(id, full_name, display_name, matric_no)
                    )
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching bookmarks:", error);
            throw new Error(error.message);
        }

        return (data || []).map((b: any) => {
            const p = b.project;
            if (!p) return null; // Handle cases where project might have been deleted

            const result = {
                ...p,
                department_name: p.department?.name || null,
                download_count: p.downloads || 0,
                authors: p.authors?.map((a: any) => ({
                    role_description: a.role_description,
                    ...a.student
                })) || []
            };

            delete result.department;
            delete result.downloads;
            return result;
        }).filter(Boolean);
    }

    /**
     * Add a project to user's bookmarks
     */
    static async addBookmark(userId: string, projectId: string) {
        // Check if already bookmarked to avoid unique constraint violation if we have one
        const { data: existing } = await supabaseAdmin
            .from("bookmarks")
            .select("id")
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .maybeSingle();

        if (existing) return existing;

        const { data, error } = await supabaseAdmin
            .from("bookmarks")
            .insert({ user_id: userId, project_id: projectId })
            .select()
            .single();

        if (error) {
            console.error("Error adding bookmark:", error);
            throw new Error(error.message);
        }
        return data;
    }

    /**
     * Remove a project from user's bookmarks
     */
    static async removeBookmark(userId: string, projectId: string) {
        const { error } = await supabaseAdmin
            .from("bookmarks")
            .delete()
            .eq("user_id", userId)
            .eq("project_id", projectId);

        if (error) {
            console.error("Error removing bookmark:", error);
            throw new Error(error.message);
        }
        return true;
    }

    /**
     * Check if a project is bookmarked by a user
     */
    static async isBookmarked(userId: string, projectId: string) {
        const { data, error } = await supabaseAdmin
            .from("bookmarks")
            .select("id")
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .maybeSingle();

        if (error) {
            console.error("Error checking bookmark status:", error);
            return false;
        }
        return !!data;
    }
}
