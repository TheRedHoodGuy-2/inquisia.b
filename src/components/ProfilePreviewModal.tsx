"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@/types";

interface ProfilePreviewModalProps {
    userId: string;
    triggerName: string;
    triggerClassName?: string;
}

export function ProfilePreviewModal({ userId, triggerName, triggerClassName }: ProfilePreviewModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !profile && !isLoading) {
            setIsLoading(true);
            fetch(`/api/users/${userId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setProfile(data.data);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, userId, profile, isLoading]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        const handleClickOutside = (e: MouseEvent) => {
            // Close if click is outside the modal content area
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Use setTimeout to avoid capturing the trigger click itself
            setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <button
                onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
                className={triggerClassName || "text-blue-600 hover:text-blue-800 font-medium"}
            >
                {triggerName}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4 transition-opacity">
                    <div
                        ref={modalRef}
                        className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden transform transition-all"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-headline"
                    >
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    {isLoading ? (
                                        <div className="flex justify-center p-4">
                                            <span className="text-gray-500 text-sm">Loading profile...</span>
                                        </div>
                                    ) : profile ? (
                                        <>
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                                {profile.display_name || profile.full_name || "User"}
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                                    {profile.bio || <span className="italic">No bio provided.</span>}
                                                </p>
                                            </div>

                                            {profile.links && profile.links.length > 0 && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Links</h4>
                                                    <ul className="space-y-1">
                                                        {profile.links.map((link, idx) => (
                                                            <li key={idx} className="text-sm">
                                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                                    {link.title}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-red-500">Failed to load profile.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
