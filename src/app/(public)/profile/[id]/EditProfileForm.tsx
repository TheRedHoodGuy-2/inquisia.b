"use client";

import { useState } from "react";
import { User } from "@/types";

import { useRouter } from "next/navigation";

export default function EditProfileForm({
    profile
}: {
    profile: User
}) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [bio, setBio] = useState(profile.bio || "");
    const [displayName, setDisplayName] = useState(profile.display_name || "");
    const [fullName, setFullName] = useState(profile.full_name || "");
    const [degrees, setDegrees] = useState(profile.degrees || "");
    const [links, setLinks] = useState<{ title: string; url: string }[]>(profile.links || []);

    const addLink = () => {
        if (links.length >= 4) return;
        setLinks([...links, { title: "", url: "" }]);
    };

    const updateLink = (index: number, field: "title" | "url", value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Cleanup empty links before sending
            const cleanedLinks = links.filter(l => l.title.trim() !== "" && l.url.trim() !== "");

            const payload: any = { bio, links: cleanedLinks };
            if (profile.role === "public" || profile.role === "student" || profile.role === "admin") {
                payload.display_name = displayName;
            }
            if (profile.role === "supervisor") {
                payload.degrees = degrees;
            }
            // All roles can have a full name
            payload.full_name = fullName;

            const res = await fetch(`/api/users/${profile.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to update profile.");
            }

            setIsEditing(false);
            router.refresh(); // Refresh parent route
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="mt-4 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
                Edit Profile
            </button>
        );
    }

    return (
        <form onSubmit={handleSave} className="mt-6 border-t pt-6 space-y-6 max-w-2xl bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Profile</h3>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

            {/* Display Name - Only some roles update this usually */}
            {(profile.role === "public" || profile.role === "student" || profile.role === "admin") && (
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Display Name</label>
                    <div className="mt-2">
                        <input
                            type="text"
                            value={displayName}
                            required
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                        />
                    </div>
                </div>
            )}

            {/* Full Name */}
            <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Full Name</label>
                <div className="mt-2">
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                        placeholder="John Doe"
                    />
                </div>
            </div>

            {/* Degrees - Supervisor Only */}
            {profile.role === "supervisor" && (
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Academic Degrees</label>
                    <div className="mt-2">
                        <input
                            type="text"
                            value={degrees}
                            onChange={(e) => setDegrees(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="e.g. PhD Computer Science"
                        />
                    </div>
                </div>
            )}

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Bio</label>
                <div className="mt-2">
                    <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                        placeholder="Tell us about yourself..."
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">Max 500 characters.</p>
            </div>

            {/* Links Generator */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                        Social & Portfolio Links
                    </label>
                    {links.length < 4 && (
                        <button
                            type="button"
                            onClick={addLink}
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                            + Add Link
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {links.map((link, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="w-1/3">
                                <input
                                    type="text"
                                    placeholder="Title (e.g. GitHub)"
                                    value={link.title}
                                    onChange={(e) => updateLink(index, "title", e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                            <div className="flex-grow">
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={link.url}
                                    onChange={(e) => updateLink(index, "url", e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="mt-1.5 text-red-500 hover:text-red-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {links.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No custom links added.</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
                <button
                    type="button"
                    onClick={() => {
                        setIsEditing(false);
                        setBio(profile.bio || "");
                        setDisplayName(profile.display_name || "");
                        setFullName(profile.full_name || "");
                        setDegrees(profile.degrees || "");
                        setLinks(profile.links || []);
                        setError(null);
                    }}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </button>
            </div>

        </form>
    );
}
