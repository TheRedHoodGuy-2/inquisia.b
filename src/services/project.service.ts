import { supabaseAdmin } from "@/lib/supabase-admin";
import { ProjectSubmissionInput } from "@/schemas";
import { User } from "@/types";

export class ProjectService {
    static async createSubmission(
        payload: ProjectSubmissionInput,
        student: User,
        reportUrl: string,
        pdfText: string,
        plagiarismData: { score: number; similarProjectId?: string; similarityReason?: string },
        aiCategory: string,
        aiTags: string[]
    ) {
        // Look up co-authors by matric_no
        let coAuthorIds: string[] = [];
        if (payload.co_authors && payload.co_authors.length > 0) {
            const { data: coAuthorsData, error: coAuthorsError } = await supabaseAdmin
                .from("users")
                .select("id, matric_no")
                .in("matric_no", payload.co_authors)
                .eq("role", "student");

            if (coAuthorsError) {
                console.error("Error looking up co-authors:", coAuthorsError);
            } else if (coAuthorsData) {
                coAuthorIds = coAuthorsData.map((u: any) => u.id);
            }
        }

        const year = new Date().getFullYear();

        // 1. Create Project
        const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .insert({
                title: payload.title,
                abstract: payload.abstract,
                pdf_text: pdfText,
                report_url: reportUrl,
                github_url: payload.github_url || null,
                live_url: payload.live_url || null,
                presentation_url: payload.presentation_url || null,
                status: "pending",
                plagiarism_score: plagiarismData.score,
                plagiarism_flagged: plagiarismData.score > 30, // arbitrary threshold for now
                similar_project_id: plagiarismData.similarProjectId,
                similarity_reason: plagiarismData.similarityReason,
                ai_category: aiCategory,
                student_tags: Array.from(new Set([...(payload.student_tags || []), ...(aiTags || [])])),
                year,
                department_id: student.department_id,
                supervisor_id: payload.supervisor_id,
                uploaded_by: student.id,
                version: 1,
            })
            .select()
            .single();

        if (projectError || !project) {
            throw new Error(`Failed to create project: ${projectError?.message}`);
        }

        const projectId = project.id;

        try {
            // 2. Add Authors
            const authorInserts = [
                { project_id: projectId, student_id: student.id, role_description: "Team Lead" },
                ...coAuthorIds.map(id => ({ project_id: projectId, student_id: id, role_description: "Co-author" }))
            ];

            // Ensure unique authors in case student passed their own matric number
            const uniqueAuthors = Array.from(new Map(authorInserts.map(item => [item.student_id, item])).values());

            const { error: authorsError } = await supabaseAdmin
                .from("project_authors")
                .insert(uniqueAuthors);

            if (authorsError) throw authorsError;

            // 3. Add initial version to history
            const { error: versionError } = await supabaseAdmin
                .from("project_versions")
                .insert({
                    project_id: projectId,
                    version_number: 1,
                    report_url: reportUrl,
                    plagiarism_score: plagiarismData.score,
                    similar_project_id: plagiarismData.similarProjectId,
                    similarity_reason: plagiarismData.similarityReason
                });

            if (versionError) throw versionError;

            return project;
        } catch (error) {
            // 4. Cleanup on failure (Primitive Transaction Rollback)
            console.error("Submission failed, rolling back project record:", error);
            await supabaseAdmin.from("project_authors").delete().eq("project_id", projectId);
            await supabaseAdmin.from("project_versions").delete().eq("project_id", projectId);
            await supabaseAdmin.from("projects").delete().eq("id", projectId);
            throw error;
        }
    }

    static async updateProject(
        projectId: string,
        studentId: string,
        payload: Partial<ProjectSubmissionInput>,
        reportUrl?: string,
        pdfText?: string,
        plagiarismData?: { score: number; similarProjectId?: string; similarityReason?: string }
    ) {
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("uploaded_by", studentId)
            .single();

        if (fetchError || !project) {
            throw new Error("Project not found or you are not the owner.");
        }

        if (project.status !== "pending") {
            throw new Error(`Cannot edit project in ${project.status} status.`);
        }

        const updateData: any = {
            title: payload.title ?? project.title,
            abstract: payload.abstract ?? project.abstract,
            supervisor_id: payload.supervisor_id ?? project.supervisor_id,
            github_url: payload.github_url ?? project.github_url,
            live_url: payload.live_url ?? project.live_url,
            presentation_url: payload.presentation_url ?? project.presentation_url,
            student_tags: payload.student_tags ?? project.student_tags,
            updated_at: new Date().toISOString()
        };

        if (reportUrl) {
            updateData.report_url = reportUrl;
            updateData.pdf_text = pdfText;
            if (plagiarismData) {
                updateData.plagiarism_score = plagiarismData.score;
                updateData.plagiarism_flagged = plagiarismData.score > 30;
                updateData.similar_project_id = plagiarismData.similarProjectId;
                updateData.similarity_reason = plagiarismData.similarityReason;
            }
        }

        // Update Authors if provided
        if (payload.co_authors) {
            await this.updateProjectAuthors(projectId, studentId, payload.co_authors);
        }

        const { data, error } = await supabaseAdmin
            .from("projects")
            .update(updateData)
            .eq("id", projectId)
            .select()
            .single();

        return { data, error: error?.message };
    }

    static async getUserProjects(userId: string) {
        // 1. Get IDs of projects where the user is an author (co-author or lead)
        const { data: authoredData } = await supabaseAdmin
            .from("project_authors")
            .select("project_id")
            .eq("student_id", userId);

        const authoredIds = authoredData?.map((a: any) => a.project_id) || [];

        // 2. Build the query for projects
        let query = supabaseAdmin
            .from("projects")
            .select(`
                *,
                supervisor:supervisor_id (id, full_name, display_name)
            `);

        if (authoredIds.length > 0) {
            // Projects where they are either the uploader OR one of the authors
            query = query.or(`uploaded_by.eq.${userId},id.in.(${authoredIds.join(',')})`);
        } else {
            // Only projects they explicitly uploaded
            query = query.eq("uploaded_by", userId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch user projects: ${error.message}`);
        }

        return (data || []).map((p: any) => {
            const result = {
                ...p,
                download_count: p.downloads || 0,
                supervisor_name: p.supervisor?.full_name || p.supervisor?.display_name || null
            };
            delete result.supervisor;
            delete result.downloads;
            return result;
        });
    }

    static async submitRevision(
        projectId: string,
        studentId: string,
        payload: Partial<ProjectSubmissionInput>,
        reportUrl?: string,
        pdfText?: string,
        plagiarismData?: { score: number, similarProjectId?: string, similarityReason?: string }
    ) {
        // 1. Fetch current project state
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("uploaded_by", studentId)
            .single();

        if (fetchError || !project) {
            throw new Error("Project not found or you are not the owner.");
        }

        if (project.status !== "changes_requested") {
            throw new Error(`Cannot submit revision for project in ${project.status} status.`);
        }

        if (project.version >= 3) {
            throw new Error("Maximum version limit (3) reached. Please start a new submission.");
        }

        // 2. Log current state to version history BEFORE updating
        const { error: historyError } = await supabaseAdmin
            .from("project_versions")
            .insert({
                project_id: projectId,
                version_number: project.version,
                report_url: project.report_url,
                plagiarism_score: project.plagiarism_score,
                supervisor_feedback: project.supervisor_feedback
            });

        if (historyError) {
            console.error("Failed to log version history:", historyError);
        }

        // 3. Update Authors if provided
        if (payload.co_authors) {
            await this.updateProjectAuthors(projectId, studentId, payload.co_authors);
        }

        // 4. Update project
        const newVersion = project.version + 1;
        const updateData: any = {
            title: payload.title ?? project.title,
            abstract: payload.abstract ?? project.abstract,
            github_url: payload.github_url ?? project.github_url,
            live_url: payload.live_url ?? project.live_url,
            presentation_url: payload.presentation_url ?? project.presentation_url,
            student_tags: payload.student_tags ?? project.student_tags,
            status: "pending",
            version: newVersion,
            supervisor_feedback: null, // Clear old feedback
            updated_at: new Date().toISOString()
        };

        if (reportUrl) {
            updateData.report_url = reportUrl;
            updateData.pdf_text = pdfText;
            if (plagiarismData) {
                updateData.plagiarism_score = plagiarismData.score;
                updateData.plagiarism_flagged = plagiarismData.score > 30;
                updateData.similar_project_id = plagiarismData.similarProjectId;
                updateData.similarity_reason = plagiarismData.similarityReason;
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from("projects")
            .update(updateData)
            .eq("id", projectId);

        if (updateError) {
            throw new Error(`Failed to update project revision: ${updateError.message}`);
        }

        return { success: true, version: newVersion };
    }

    static async deleteSubmission(projectId: string, studentId: string) {
        // 1. Fetch project to ensure it belongs to student and is 'pending'
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("id, status")
            .eq("id", projectId)
            .eq("uploaded_by", studentId)
            .single();

        if (fetchError || !project) {
            throw new Error("Project not found or you are not the owner.");
        }

        if (project.status !== "pending") {
            throw new Error(`Cannot delete project in ${project.status} status.`);
        }

        // 2. Cascade delete manual relationships if needed (supabase auth ON DELETE CASCADE usually handles this, but explicitly clearing guarantees no orphans)
        await supabaseAdmin.from("project_authors").delete().eq("project_id", projectId);
        await supabaseAdmin.from("project_versions").delete().eq("project_id", projectId);

        const { error: deleteError } = await supabaseAdmin
            .from("projects")
            .delete()
            .eq("id", projectId);

        if (deleteError) {
            throw new Error(`Failed to delete project: ${deleteError.message}`);
        }

        return { success: true };
    }

    static async resubmitAfterRejection(
        projectId: string,
        studentId: string,
        payload: Partial<ProjectSubmissionInput>,
        reportUrl?: string,
        pdfText?: string,
        plagiarismData?: { score: number, similarProjectId?: string, similarityReason?: string }
    ) {
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("uploaded_by", studentId)
            .single();

        if (fetchError || !project) {
            throw new Error("Project not found or you are not the owner.");
        }

        if (project.status !== "rejected") {
            throw new Error(`Cannot resubmit project in ${project.status} status.`);
        }

        // 1. Log rejected state to history before fixing
        const { error: historyError } = await supabaseAdmin
            .from("project_versions")
            .insert({
                project_id: projectId,
                version_number: project.version,
                report_url: project.report_url,
                plagiarism_score: project.plagiarism_score,
                supervisor_feedback: project.supervisor_feedback
            });

        if (historyError) {
            console.error("Failed to log version history for resubmission:", historyError);
        }

        // 2. Update Authors if provided
        if (payload.co_authors) {
            await this.updateProjectAuthors(projectId, studentId, payload.co_authors);
        }

        // 3. Update project and increment version
        const newVersion = project.version + 1;
        const updateData: any = {
            title: payload.title ?? project.title,
            abstract: payload.abstract ?? project.abstract,
            github_url: payload.github_url ?? project.github_url,
            live_url: payload.live_url ?? project.live_url,
            presentation_url: payload.presentation_url ?? project.presentation_url,
            student_tags: payload.student_tags ?? project.student_tags,
            status: "pending",
            version: newVersion,
            supervisor_feedback: null,
            updated_at: new Date().toISOString()
        };

        if (reportUrl) {
            updateData.report_url = reportUrl;
            updateData.pdf_text = pdfText;
            if (plagiarismData) {
                updateData.plagiarism_score = plagiarismData.score;
                updateData.plagiarism_flagged = plagiarismData.score > 30;
                updateData.similar_project_id = plagiarismData.similarProjectId;
                updateData.similarity_reason = plagiarismData.similarityReason;
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from("projects")
            .update(updateData)
            .eq("id", projectId);

        if (updateError) {
            throw new Error(`Failed to resubmit project: ${updateError.message}`);
        }

        return { success: true, version: newVersion };
    }

    private static async updateProjectAuthors(projectId: string, leadId: string, matricNos: string[]) {
        // 1. Resolve matric numbers to IDs
        const { data: userData } = await supabaseAdmin
            .from("users")
            .select("id")
            .in("matric_no", matricNos)
            .eq("role", "student");

        const studentIds = userData ? userData.map(u => u.id).filter(id => id !== leadId) : [];

        // 2. Clear existing co-authors
        await supabaseAdmin
            .from("project_authors")
            .delete()
            .eq("project_id", projectId)
            .neq("student_id", leadId);

        // 3. Insert new co-authors
        if (studentIds.length > 0) {
            const authorInserts = studentIds.map(id => ({
                project_id: projectId,
                student_id: id,
                role_description: "Co-author"
            }));

            await supabaseAdmin
                .from("project_authors")
                .insert(authorInserts);
        }
    }

    static async getProjectVersionHistory(projectId: string) {
        const { data, error } = await supabaseAdmin
            .from("project_versions")
            .select("*")
            .eq("project_id", projectId)
            .order("version_number", { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch version history: ${error.message}`);
        }

        return data || [];
    }

    static async getPublicProjects(filters: {
        department_id?: string;
        ai_category?: string;
        query?: string;
        year?: string;
        sort?: string;
        page?: number;
        limit?: number;
    }) {
        const { department_id, ai_category, query, year, sort, page = 1, limit = 10 } = filters;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let supabaseQuery = supabaseAdmin
            .from("projects")
            .select(`
                *,
                department:departments(name),
                authors:project_authors(
                    role_description,
                    student:users!student_id(id, full_name, display_name, matric_no)
                )
            `, { count: 'exact' })
            .eq("status", "approved");

        if (department_id) supabaseQuery = supabaseQuery.eq("department_id", department_id);
        if (ai_category) supabaseQuery = supabaseQuery.eq("ai_category", ai_category);
        if (year) supabaseQuery = supabaseQuery.eq("year", parseInt(year, 10));

        // 1. Primary Keyword Search (ILIKE)
        if (query) {
            supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,abstract.ilike.%${query}%`);
        }

        if (sort === 'oldest') {
            supabaseQuery = supabaseQuery.order("created_at", { ascending: true });
        } else if (sort === 'a-z') {
            supabaseQuery = supabaseQuery.order("title", { ascending: true });
        } else if (sort === 'z-a') {
            supabaseQuery = supabaseQuery.order("title", { ascending: false });
        } else {
            supabaseQuery = supabaseQuery.order("updated_at", { ascending: false });
        }

        let { data, count, error } = await supabaseQuery.range(from, to);

        // 2. Semantic Search Fallback (If keywords fail or we want more "intelligent" results)
        // If query exists and we found nothing, OR if we want to augment results
        if (query && (!data || data.length === 0)) {
            try {
                const { AIService } = require("./ai.service");
                const queryEmbedding = await AIService.generateEmbedding(query);

                const { data: semanticResults, error: semanticError } = await supabaseAdmin.rpc("match_projects", {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.5,
                    match_count: limit
                });

                if (!semanticError && semanticResults && semanticResults.length > 0) {
                    console.log(`[SEMANTIC SEARCH] Keywords failed for "${query}", found ${semanticResults.length} similar projects.`);

                    // Fetch full data for these IDs
                    const ids = semanticResults.map((r: any) => r.id);
                    const { data: fullData } = await supabaseAdmin
                        .from("projects")
                        .select(`
                            *,
                            department:departments(name),
                            authors:project_authors(
                                role_description,
                                student:users!student_id(id, full_name, display_name, matric_no)
                            )
                        `)
                        .in("id", ids);

                    if (fullData) {
                        data = fullData;
                        count = fullData.length;
                    }
                }
            } catch (e) {
                console.error("[SEMANTIC SEARCH ENGINE] Failed:", e);
            }
        }

        if (error) throw new Error(`Search failed: ${error.message}`);

        const items = (data || []).map((p: any) => {
            const result = {
                ...p,
                download_count: p.downloads || 0,
                authors: p.authors?.map((a: any) => ({
                    role_description: a.role_description,
                    id: a.student?.id,
                    full_name: a.student?.full_name,
                    display_name: a.student?.display_name,
                    matric_no: a.student?.matric_no
                })) || []
            };
            delete result.downloads;
            return result;
        });

        return {
            items,
            total: count || 0,
            page,
            total_pages: Math.ceil((count || 0) / limit)
        };
    }

    static async getPublicProjectDetail(id: string) {
        const { data, error } = await supabaseAdmin
            .from("projects")
            .select(`
                *,
                department:departments(name),
                supervisor:users!supervisor_id(full_name, email),
                authors:project_authors(
                    role_description,
                    student:users!student_id(id, full_name, display_name, matric_no, email)
                )
            `)
            .eq("id", id)
            .single();

        if (error || !data) throw new Error("Project not found or not public.");

        const result = {
            ...data,
            download_count: data.downloads || 0,
            supervisor_name: data.supervisor?.full_name || null,
            authors: data.authors?.map((a: any) => ({
                role_description: a.role_description,
                ...a.student
            })) || []
        };
        delete result.supervisor;
        delete result.downloads;
        return result;
    }

    static async getGlobalStats() {
        try {
            const [projectsRes, studentsRes, supervisorsRes, downloadsRes] = await Promise.all([
                supabaseAdmin.from("projects").select("*", { count: 'exact', head: true }).eq("status", "approved"),
                supabaseAdmin.from("users").select("*", { count: 'exact', head: true }).eq("role", "student"),
                supabaseAdmin.from("users").select("*", { count: 'exact', head: true }).eq("role", "supervisor"),
                supabaseAdmin.from("projects").select("downloads").eq("status", "approved")
            ]);

            console.log(`[ProjectService.getGlobalStats] counts -> projects: ${projectsRes.count}, students: ${studentsRes.count}, supervisors: ${supervisorsRes.count}`);
            if (projectsRes.error) console.error("projectsRes error:", projectsRes.error);
            if (studentsRes.error) console.error("studentsRes error:", studentsRes.error);
            if (supervisorsRes.error) console.error("supervisorsRes error:", supervisorsRes.error);

            const totalDownloads = (downloadsRes.data || []).reduce(
                (sum: number, p: any) => sum + (p.downloads || 0), 0
            );

            return {
                total_projects: projectsRes.count || 0,
                total_students: studentsRes.count || 0,
                total_supervisors: supervisorsRes.count || 0,
                total_downloads: totalDownloads,
            };
        } catch (error: any) {
            console.error("Global stats error:", error);
            throw new Error(`Failed to fetch stats: ${error.message}`);
        }
    }

    static async getSupervisorProjects(supervisorId: string) {
        const { data, error } = await supabaseAdmin
            .from("projects")
            .select(`
                *,
                authors:project_authors(
                    id,
                    role_description,
                    student:users!student_id(id, full_name, display_name, matric_no)
                ),
                versions:project_versions!project_id(*)
            `)
            .eq("supervisor_id", supervisorId)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch supervisor projects: ${error.message}`);
        }

        return (data || []).map((p: any) => {
            const result = {
                ...p,
                download_count: p.downloads || 0,
                authors: p.authors?.map((a: any) => ({
                    role_description: a.role_description,
                    ...a.student
                })) || []
            };
            delete result.downloads;
            return result;
        });
    }

    static async updateProjectStatus(
        projectId: string,
        supervisorId: string,
        status: "approved" | "changes_requested" | "rejected",
        feedback: string
    ) {
        // 1. Verify ownership/assignment
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("id, status, version")
            .eq("id", projectId)
            .eq("supervisor_id", supervisorId)
            .single();

        if (fetchError || !project) {
            throw new Error("Project not found or not assigned to this supervisor.");
        }

        // 2. Update projects table
        const { error: updateError } = await supabaseAdmin
            .from("projects")
            .update({
                status,
                supervisor_feedback: feedback,
                updated_at: new Date().toISOString()
            })
            .eq("id", projectId);

        if (updateError) {
            throw new Error(`Failed to update project status: ${updateError.message}`);
        }

        // 3. Update the latest version in history to include this feedback
        const { error: versionError } = await supabaseAdmin
            .from("project_versions")
            .update({
                supervisor_feedback: feedback
            })
            .eq("project_id", projectId)
            .eq("version_number", project.version);

        if (versionError) {
            console.error("Failed to update project_versions feedback:", versionError);
        }

        // 4. Trigger AI Embedding generation if approved (for semantic search)
        if (status === 'approved') {
            try {
                const { data: fullProject } = await supabaseAdmin
                    .from("projects")
                    .select("title, abstract")
                    .eq("id", projectId)
                    .single();

                if (fullProject) {
                    const { AIService } = require("./ai.service");
                    // Fire and forget embedding generation to avoid blocking the response
                    AIService.generateProjectEmbeddings(projectId, fullProject.title, fullProject.abstract)
                        .catch((e: any) => console.error("[SEMANTIC SEARCH ENGINE] Background embedding failed:", e));
                }
            } catch (e) {
                console.error("[SEMANTIC SEARCH ENGINE] Failed to trigger background embedding:", e);
            }
        }

        return { success: true };
    }

    static async getRelatedProjects(projectId: string, aiCategory: string, limit: number = 3) {
        const { data, error } = await supabaseAdmin
            .from("projects")
            .select(`
                *,
                department:departments(name),
                authors:project_authors(
                    role_description,
                    student:users!student_id(id, full_name, display_name, matric_no)
                )
            `)
            .eq("status", "approved")
            .eq("ai_category", aiCategory)
            .neq("id", projectId)
            .limit(limit);

        return (data || []).map((p: any) => {
            const result = {
                ...p,
                download_count: p.downloads || 0,
                authors: p.authors?.map((a: any) => ({
                    role_description: a.role_description,
                    ...a.student
                })) || []
            };
            delete result.downloads;
            return result;
        });
    }
}
