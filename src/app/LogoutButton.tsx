"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });
            if (res.ok) {
                // Hard refresh is best to clear layout cache immediately
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Failed to logout", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
            {isLoading ? "Logging out..." : "Log out"}
        </button>
    );
}
