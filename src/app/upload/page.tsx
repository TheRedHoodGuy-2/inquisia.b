import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import UploadForm from "./UploadForm";

export default async function UploadPage() {
    const user = await requireAuth();

    if (user.role !== "student") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Upload Final Year Project</h1>
                <p className="mt-2 text-sm text-gray-600">Once submitted, your project will be pending approval from your supervisor. Ensure your final PDF report matches the printed copy exactly.</p>
            </div>
            <UploadForm departmentId={user.department_id!} />
        </div>
    );
}
