"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ElaraLogo } from "@/components/Logos";

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

const SUGGESTIONS = [
    "Find projects related to machine learning",
    "What are the most researched topics?",
    "Show me final year projects from 2024",
    "Compare projects on cybersecurity",
    "What research gaps exist in the Computer Science department?",
];

function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";
    const text = msg.parts[0].text;

    return (
        <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 overflow-hidden p-1.5">
                    <ElaraLogo variant="blue" className="w-full h-full" />
                </div>
            )}
            <div className={`max-w-[75%] ${isUser
                ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-3xl rounded-tr-sm px-5 py-3 shadow-lg shadow-violet-500/20"
                : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm"
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export default function ElaraClient() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (messageText?: string) => {
        const text = (messageText ?? input).trim();
        if (!text || loading) return;

        const userMsg: Message = { role: "user", parts: [{ text }] };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/elara", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    // Send last 10 messages as history context (excluding the one just sent)
                    history: updatedMessages.slice(-11, -1),
                }),
            });

            const data = await res.json();

            if (!data.success) {
                if (res.status === 401) {
                    router.push(`/login?redirect=/elara`);
                    return;
                }
                setMessages([...updatedMessages, { role: "model", parts: [{ text: `⚠️ ${data.error}` }] }]);
            } else {
                setMessages([...updatedMessages, { role: "model", parts: [{ text: data.reply }] }]);
            }
        } catch {
            setMessages([...updatedMessages, { role: "model", parts: [{ text: "I'm having trouble connecting right now. Please try again." }] }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
            {/* Session Warning Banner */}
            {!dismissed && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200/60 text-amber-800">
                    <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-semibold flex-1">
                        <strong>Session only.</strong> This conversation is not saved and will be lost when you leave or refresh the page.
                    </p>
                    <button onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Main Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {isEmpty ? (
                    /* Landing State */
                    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-12">
                        <div className="text-center space-y-4">
                            <div className="relative mx-auto w-16 h-16">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl rotate-3 opacity-40 blur-sm" />
                                <div className="relative w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30 overflow-hidden p-3">
                                    <ElaraLogo variant="blue" className="w-full h-full" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Meet Elara</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                                    Your intelligent research guide for the Inquisia repository. I know every approved project — just ask.
                                </p>
                            </div>
                        </div>

                        {/* Suggestion Chips */}
                        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleSend(s)}
                                    className="text-xs font-semibold px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-sm transition-all duration-200"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Conversation */
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse overflow-hidden p-1.5">
                                    <ElaraLogo variant="blue" className="w-full h-full" />
                                </div>
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm">
                                    <div className="flex gap-1.5 items-center h-5">
                                        {[0, 150, 300].map((delay) => (
                                            <span key={delay} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Elara anything about the Inquisia repository..."
                                className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none leading-relaxed"
                                style={{ maxHeight: "160px" }}
                                onInput={(e) => {
                                    const t = e.target as HTMLTextAreaElement;
                                    t.style.height = "auto";
                                    t.style.height = Math.min(t.scrollHeight, 160) + "px";
                                }}
                            />
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                        Elara · Powered by Gemini · Session only — conversations are not saved
                    </p>
                </div>
            </div>
        </div>
    );
}
