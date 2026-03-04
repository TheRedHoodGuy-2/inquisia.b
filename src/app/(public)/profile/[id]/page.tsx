import { getSession } from "@/lib/session";
import { UserService } from "@/services/user.service";
import { notFound } from "next/navigation";
import EditProfileForm from "./EditProfileForm";
import Link from "next/link";
import { User } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ id: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
    const { id } = await params;

    // 1. Fetch the requested profile server-side directly
    const profile = await UserService.getProfileById(id);

    if (!profile) {
        notFound();
    }

    // 2. Fetch the active user session (if any) to see if we render the edit state
    const session = await getSession();
    const isOwner = session?.user.id === profile.id || session?.user.role === "admin";

    const departmentName = (profile as any).departments?.name;

    // 3. Fetch associated approved projects for the profile
    let projects: any[] = [];
    if (profile.role === "student") {
        const { data: authored } = await supabaseAdmin
            .from("project_authors")
            .select("project_id")
            .eq("student_id", profile.id);

        const projectIds = authored?.map((a: any) => a.project_id) || [];
        if (projectIds.length > 0) {
            const { data } = await supabaseAdmin
                .from("projects")
                .select(`
                    *,
                    department:departments(id, name),
                    supervisor:users!projects_supervisor_id_fkey(id, full_name, display_name),
                    authors:project_authors(
                        role_description,
                        student:users!project_authors_student_id_fkey(id, full_name, display_name)
                    )
                `)
                .in("id", projectIds)
                .eq("status", "approved")
                .order("created_at", { ascending: false });
            projects = data || [];
        }
    } else if (profile.role === "supervisor") {
        const { data } = await supabaseAdmin
            .from("projects")
            .select(`
                *,
                department:departments(id, name),
                supervisor:users!projects_supervisor_id_fkey(id, full_name, display_name),
                authors:project_authors(
                    role_description,
                    student:users!project_authors_student_id_fkey(id, full_name, display_name)
                )
            `)
            .eq("supervisor_id", profile.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false });
        projects = data || [];
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">

            {/* Header Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl leading-6 font-bold text-gray-900">
                            {profile.display_name || profile.full_name || "Anonymous User"}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 capitalize">
                            {profile.role}
                            {departmentName ? ` — ${departmentName}` : ''}
                            {!profile.is_active && " (Deactivated)"}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${profile.account_status === "active" ? "bg-green-50 text-green-700 ring-green-600/20" :
                            profile.account_status === "warned" ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20" :
                                "bg-red-50 text-red-700 ring-red-600/10"
                            }`}>
                            {profile.account_status}
                        </span>
                    </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">

                        {/* Student Specific Details */}
                        {profile.role === "student" && (
                            <>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.full_name}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Level</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.level}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Matric No</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.matric_no}</dd>
                                </div>
                            </>
                        )}

                        {/* Supervisor Specific Details */}
                        {profile.role === "supervisor" && (
                            <>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.full_name}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Degrees</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.degrees}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {profile.is_verified ? "Verified Staff" : "Pending Verification"}
                                    </dd>
                                </div>
                            </>
                        )}

                        {/* Admin/Public Fallback Details */}
                        {(profile.role === "admin" || profile.role === "public") && profile.full_name && (
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.full_name}</dd>
                            </div>
                        )}

                        {/* Bio section */}
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">About</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                                {profile.bio || <span className="text-gray-400 italic">No bio provided.</span>}
                            </dd>
                        </div>

                        {/* Links section */}
                        {(profile.links && profile.links.length > 0) && (
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Links</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                        {profile.links.map((link, idx) => (
                                            <li key={idx} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="ml-2 flex-1 w-0 truncate">
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500">
                                                            {link.title}
                                                        </a>
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                        )}

                    </dl>
                </div>
            </div>

            {/* Embedded Client-Side Admin/Owner Editing Area */}
            {isOwner && (
                <EditProfileForm profile={profile} />
            )}

            {/* Associated Projects Section */}
            {projects.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
                        {profile.role === "student" ? "Authored Projects" : "Supervised Projects"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map(p => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
