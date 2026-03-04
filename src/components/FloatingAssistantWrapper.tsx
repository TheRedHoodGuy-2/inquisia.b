"use client";

import { usePathname } from "next/navigation";
import AIChatWidget from "@/components/AIChatWidget";

/**
 * Renders the floating global AI assistant, but suppresses it
 * on pages that already have a dedicated AI chat (project pages, Elara).
 */
export default function FloatingAssistantWrapper({ user }: { user: any }) {
    const pathname = usePathname();

    if (!user) return null;

    // Hide on project detail pages (they have project-specific contextual chat)
    // Hide on /elara (that IS the AI chat page)
    // Hide on auth pages
    const isProjectPage = /^\/projects\/[^/]+$/.test(pathname);
    const isElaraPage = pathname === "/elara";
    const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

    if (isProjectPage || isElaraPage || isAuthPage) return null;

    return (
        <AIChatWidget
            endpoint="/api/ai/assistant"
            mode="floating"
            title="Elara"
            initialMessage="Hi! I'm Elara, your Inquisia research guide. Need help navigating the repository or finding research? Just ask!"
        />
    );
}
