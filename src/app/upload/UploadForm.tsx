"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UploadForm({ departmentId }: { departmentId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Modes:
    const editId = searchParams.get("edit");
    const revisionId = searchParams.get("revision");
    const resubmitId = searchParams.get("resubmit");
    const isEditMode = !!editId || !!revisionId || !!resubmitId;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);
    const [supervisors, setSupervisors] = useState<any[]>([]);

    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [supervisorId, setSupervisorId] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [liveUrl, setLiveUrl] = useState("");
    const [presentationUrl, setPresentationUrl] = useState("");
    const [coAuthors, setCoAuthors] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [existingProject, setExistingProject] = useState<any | null>(null);

    // Fetch Supervisors and Existing Data
    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const res = await fetch(`/api/supervisors`);
                const data = await res.json();
                if (data.success) setSupervisors(data.data);

                if (isEditMode) {
                    const targetId = editId || revisionId || resubmitId;
                    const pRes = await fetch(`/api/projects`);
                    const pData = await pRes.json();
                    if (pData.success) {
                        const project = pData.data.find((p: any) => p.id === targetId);
                        if (project) {
                            setExistingProject(project);
                            setTitle(project.title);
                            setAbstract(project.abstract);
                            setSupervisorId(project.supervisor_id);
                            setGithubUrl(project.github_url || "");
                            setLiveUrl(project.live_url || "");
                            setPresentationUrl(project.presentation_url || "");
                            // Note: Co-authors logic might need more work if we want to edit them
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setIsFetching(false);
            }
        };
        fetchBaseData();
    }, [editId, revisionId, resubmitId, isEditMode]);

    const addCoAuthor = () => setCoAuthors([...coAuthors, ""]);
    const updateCoAuthor = (index: number, value: string) => {
        const newCoAuthors = [...coAuthors];
        newCoAuthors[index] = value;
        setCoAuthors(newCoAuthors);
    };
    const removeCoAuthor = (index: number) => {
        setCoAuthors(coAuthors.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isEditMode && !file) {
            setError("Please attach a PDF report.");
            return;
        }

        if (file && file.type !== "application/pdf") {
            setError("Only PDF files are allowed.");
            return;
        }

        setIsLoading(true);

        try {
            const emptyFilteredCoAuthors = coAuthors.filter(c => c.trim() !== "");
            const metadata = {
                title,
                abstract,
                supervisor_id: supervisorId,
                github_url: githubUrl || undefined,
                live_url: liveUrl || undefined,
                presentation_url: presentationUrl || undefined,
                co_authors: emptyFilteredCoAuthors.length > 0 ? emptyFilteredCoAuthors : undefined,
            };

            const formData = new FormData();
            if (file) formData.append("file", file);
            formData.append("metadata", JSON.stringify(metadata));

            let url = "/api/projects";
            let method = "POST";

            if (editId) {
                url = `/api/projects/${editId}`;
                method = "PATCH";
            } else if (revisionId) {
                url = `/api/projects/${revisionId}/revision`;
                method = "POST";
            } else if (resubmitId) {
                url = `/api/projects/${resubmitId}/resubmit`;
                method = "POST";
            }

            const res = await fetch(url, { method, body: formData });
            const json = await res.json();

            if (!res.ok) {
                let errorMsg = json.error || "Submission failed";
                if (json.details) {
                    // Extract detailed Zod validation messages into a readable format
                    const issues = Object.values(json.details).flat().filter(Boolean);
                    if (issues.length > 0) {
                        errorMsg = `Validation failed: ${issues.join(", ")}`;
                    }
                }
                throw new Error(errorMsg);
            }

            router.push("/dashboard");
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-gray-100 rounded"></div>
            </div>
        );
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 shadow sm:rounded-xl max-w-3xl mx-auto">
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm font-medium">{error}</div>}

            <div className="space-y-6">

                {/* File Upload */}
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors">
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                            <span className="relative rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                                Upload Final Report
                            </span>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500">PDF up to 10MB</p>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} />
                    {file && <p className="mt-2 text-sm text-green-600 font-medium">Selected: {file.name}</p>}
                </div>

                {/* Core Details */}
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Project Title *</label>
                    <div className="mt-2">
                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Enter full project title" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Abstract *</label>
                    <div className="mt-2">
                        <textarea required rows={5} value={abstract} onChange={e => setAbstract(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="Copy and paste the abstract from your project report..." />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Assign Supervisor *</label>
                    <div className="mt-2">
                        <select required value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white">
                            <option value="" disabled>Select your verified supervisor</option>
                            {supervisors.map(sup => (
                                <option key={sup.id} value={sup.id}>
                                    {sup.full_name || sup.display_name} {sup.degrees ? `(${sup.degrees})` : ''}
                                    {sup.departments?.name ? ` — ${sup.departments.name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Select any verified supervisor from any department.</p>
                </div>

                {/* External Links */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">External Resources (Optional)</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Live Demo URL</label>
                            <input type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">GitHub Repository URL</label>
                            <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="https://github.com/..." />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Presentation Deck URL</label>
                            <input type="url" value={presentationUrl} onChange={e => setPresentationUrl(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3" placeholder="https://..." />
                        </div>
                    </div>
                </div>

                {/* Co-Authors */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium leading-6 text-gray-900">Co-Authors (Team Members)</label>
                        <button type="button" onClick={addCoAuthor} className="text-sm font-medium text-blue-600 hover:text-blue-500">+ Add Teammate</button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Enter the matriculation numbers of your team members so they get credit. They must be registered students.</p>

                    <div className="space-y-3">
                        {coAuthors.map((author, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Matric No (e.g. 19/1234)"
                                    value={author}
                                    onChange={e => updateCoAuthor(index, e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                                <button type="button" onClick={() => removeCoAuthor(index)} className="text-red-500 hover:text-red-700">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
                <button type="submit" disabled={isLoading} className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">
                    {isLoading ? "Submitting, calculating, please wait..." : "Submit Project"}
                </button>
            </div>
        </form>
    );
}
