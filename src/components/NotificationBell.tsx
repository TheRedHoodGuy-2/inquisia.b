"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationBellProps {
    userId?: string; // If not provided, the component self-fetches via /api/notifications
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                    setUnreadCount(data.unreadCount);
                    setFetchError(false);
                } else {
                    setFetchError(true);
                }
            } else {
                setFetchError(true);
            }
        } catch (err) {
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount, then poll every 60s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await fetch("/api/notifications/read", { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) { }
    };

    const handleClickNotification = async (notif: Notification) => {
        // Mark as read
        if (!notif.is_read) {
            try {
                await fetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" });
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch (err) { }
        }
        // Navigate
        if (notif.link) {
            window.location.href = notif.link;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen((o) => !o)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-gray-900">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
                {fetchError && unreadCount === 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" title="Notifications unavailable — migration may not be applied" />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Notifications</p>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-2xl mb-2">🔔</p>
                                <p className="text-xs font-semibold text-gray-400">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleClickNotification(notif)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex gap-3 items-start ${!notif.is_read ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}
                                >
                                    {/* Unread indicator */}
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!notif.is_read ? "bg-blue-600" : "bg-transparent"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{notif.title}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                        <p className="text-[10px] font-semibold text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
