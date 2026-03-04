import { supabaseAdmin } from "@/lib/supabase-admin";
import { User } from "@/types";

export interface CommentNode {
    id: string;
    project_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        full_name: string;
        display_name: string;
        avatar?: string;
        role: string;
        bio?: string;
        links?: any;
    };
    replies?: CommentNode[];
    // Computed fields
    tier: "admin" | "supervisor" | "author" | "regular";
    badge?: string;
}

export class CommentService {
    /**
     * Get all threaded and tiered comments for a project
     */
    static async getProjectComments(projectId: string): Promise<CommentNode[]> {
        // 1. Fetch project to know who is author/supervisor
        const { data: project } = await supabaseAdmin
            .from("projects")
            .select(`
                supervisor_id,
                authors:project_authors(student_id)
            `)
            .eq("id", projectId)
            .single();

        if (!project) return [];
        const authorIds = project.authors?.map((a: any) => a.student_id) || [];
        const supervisorId = project.supervisor_id;

        // 2. Fetch all raw comments
        const { data: comments, error } = await supabaseAdmin
            .from("comments")
            .select(`
                *,
                user:users!user_id(id, full_name, display_name, role, bio, links)
            `)
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

        if (error || !comments) return [];

        // 3. Compute tiers and badges
        const processedComments: CommentNode[] = comments.map(c => {
            const user = Array.isArray(c.user) ? c.user[0] : c.user;
            let tier: CommentNode["tier"] = "regular";
            let badge: string | undefined = undefined;

            if (user.role === "admin") {
                tier = "admin";
                badge = "Admin";
            } else if (user.id === supervisorId) {
                tier = "supervisor";
                badge = "Supervisor";
            } else if (authorIds.includes(user.id)) {
                tier = "author";
                badge = "Author"; // Can be dynamic if we check role_description later
            }

            return {
                ...c,
                user,
                tier,
                badge
            };
        });

        // 4. Threading (One level only)
        const topLevel: CommentNode[] = [];
        const replies: { [key: string]: CommentNode[] } = {};

        processedComments.forEach(c => {
            if (c.parent_id) {
                if (!replies[c.parent_id]) replies[c.parent_id] = [];
                replies[c.parent_id].push(c);
            } else {
                topLevel.push(c);
            }
        });

        topLevel.forEach(c => {
            // Replies inherit chronological order (oldest first) so they read naturally top-to-bottom
            c.replies = (replies[c.id] || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });

        // 5. Tiered Sorting for Top Level
        topLevel.sort((a, b) => {
            const tierWeight = { admin: 4, supervisor: 3, author: 2, regular: 1 };
            if (tierWeight[a.tier] !== tierWeight[b.tier]) {
                return tierWeight[b.tier] - tierWeight[a.tier]; // Higher tier first
            }
            // Within same tier, most recent first (descending)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return topLevel;
    }

    /**
     * Post a new comment
     */
    static async postComment(projectId: string, userId: string, content: string, parentId?: string) {
        const { data: newComment, error } = await supabaseAdmin
            .from("comments")
            .insert({
                project_id: projectId,
                user_id: userId,
                content,
                parent_id: parentId || null
            })
            .select()
            .single();

        if (error || !newComment) throw new Error(error?.message || "Failed to post comment");

        // Fetch user completely so we can return a formatted node
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("id, full_name, display_name, role, bio, links")
            .eq("id", userId)
            .single();

        // Fetch project to know authorship
        const { data: project } = await supabaseAdmin
            .from("projects")
            .select("supervisor_id, authors:project_authors(student_id)")
            .eq("id", projectId)
            .single();

        let tier: CommentNode["tier"] = "regular";
        let badge: string | undefined = undefined;

        if (user) {
            const authorIds = project?.authors?.map((a: any) => a.student_id) || [];
            if (user.role === "admin") {
                tier = "admin";
                badge = "Admin";
            } else if (project && user.id === project.supervisor_id) {
                tier = "supervisor";
                badge = "Supervisor";
            } else if (authorIds.includes(user.id)) {
                tier = "author";
                badge = "Author";
            }
        }

        return {
            ...newComment,
            user: user || { id: userId, full_name: "Unknown", display_name: "Unknown", role: "public" },
            tier,
            badge,
            replies: []
        };
    }

    /**
     * Edit own comment
     */
    static async editComment(commentId: string, userId: string, newContent: string) {
        // Ensure ownership
        const { data: existing } = await supabaseAdmin.from("comments").select("user_id").eq("id", commentId).single();
        if (!existing || existing.user_id !== userId) throw new Error("Unauthorized");

        const { data, error } = await supabaseAdmin
            .from("comments")
            .update({
                content: newContent,
                updated_at: new Date().toISOString()
            })
            .eq("id", commentId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Soft delete (User deletes own comment)
     */
    static async softDeleteComment(commentId: string, userId: string) {
        const { data: existing } = await supabaseAdmin.from("comments").select("user_id").eq("id", commentId).single();
        if (!existing || existing.user_id !== userId) throw new Error("Unauthorized");

        const { error } = await supabaseAdmin
            .from("comments")
            .update({
                content: "[comment deleted]",
                updated_at: new Date().toISOString()
            })
            .eq("id", commentId);

        if (error) throw new Error(error.message);
        return true;
    }

    /**
     * Hard delete (Admin entirely removes comment)
     */
    static async hardDeleteComment(commentId: string) {
        const { error } = await supabaseAdmin
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) throw new Error(error.message);
        return true;
    }
}
