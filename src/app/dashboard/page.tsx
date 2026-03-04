import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProfilePreviewModal } from "@/components/ProfilePreviewModal";
import { ProjectService } from "@/services/project.service";
import StudentDashboard from "./StudentDashboard";
import SupervisorDashboard from "./SupervisorDashboard";

export default async function DashboardPage() {
    const user = await requireAuth();

    // Public users don't have a dashboard, they get redirected to their profile
    if (user.role === "public") {
        redirect(`/profile/${user.id}`);
    }

    let projects: any[] = [];
    if (user.role === "student") {
        projects = await ProjectService.getUserProjects(user.id);
    } else if (user.role === "supervisor") {
        projects = await ProjectService.getSupervisorProjects(user.id);
    }

    return (
        <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
                        Welcome back, {user.display_name || user.full_name || "User"}
                    </h1>
                    <div className="mt-4 text-gray-500 space-y-2">
                        <p>Role: <span className="font-semibold capitalize text-gray-900">{user.role}</span></p>
                        <p>Account status: <span className={`font-semibold capitalize ${user.account_status === 'active' ? 'text-green-600' :
                            user.account_status === 'warned' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>{user.account_status}</span></p>

                        {user.account_status === 'warned' && (
                            <div className="mt-4 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Your account has received a warning: {user.status_reason || "Violation of terms."}
                                </p>
                            </div>
                        )}

                        {user.account_status === 'restricted' && (
                            <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
                                <p className="text-sm text-red-800">
                                    🚫 Your account is restricted: {user.status_reason || "Contact admin for details."}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10">
                        {user.role === "student" && <StudentDashboard projects={projects} />}

                        {user.role === "supervisor" && (
                            <SupervisorDashboard initialProjects={projects} />
                        )}
                    </div>

                    {/* Temporary testing area for Phase 3 Profile Preview Modal */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Phase 3 Testing</h3>
                        <p className="text-sm text-gray-500 mb-4">Click below to test the reusable profile preview modal.</p>
                        <ProfilePreviewModal
                            userId={user.id}
                            triggerName="Preview My Profile"
                            triggerClassName="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
