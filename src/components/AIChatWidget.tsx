"use client";

import { useState, useRef, useEffect } from "react";
import { ElaraLogo } from "@/components/Logos";

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

interface AIChatWidgetProps {
    endpoint: string;
    placeholder?: string;
    title?: string;
    initialMessage?: string;
    context?: any;
    mode: "embedded" | "floating";
}

export default function AIChatWidget({
    endpoint,
    placeholder = "Ask me anything...",
    title = "Elara",
    initialMessage = "Hello! I'm Elara. I'm here to help you explore this research and navigate Inquisia. What would you like to know?",
    mode = "embedded"
}: AIChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(mode === "embedded");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        // Check auth before sending
        try {
            const sessionRes = await fetch('/api/auth/session');
            const sessionData = await sessionRes.json();

            if (!sessionData.success || !sessionData.user) {
                window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                return;
            }
        } catch (err) {
            console.error("Session check failed before chat:", err);
        }

        const userMsg: Message = { role: "user", parts: [{ text: input }] };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    history: messages.slice(-10) // Only send last 10 exchanges as per spec
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...newMessages, { role: "model", parts: [{ text: data.reply }] }]);
            } else {
                setMessages([...newMessages, { role: "model", parts: [{ text: "Error: " + data.error }] }]);
            }
        } catch (error) {
            setMessages([...newMessages, { role: "model", parts: [{ text: "Sorry, Elara is having trouble connecting right now." }] }]);
        } finally {
            setLoading(false);
        }
    };

    const ChatContent = (
        <div className={`flex flex-col bg-white border border-gray-100 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 ${mode === 'floating' ? 'w-80 h-[450px] fixed bottom-6 right-6 z-50' : 'w-full h-[500px]'}`}>
            {/* Header */}
            <div className="bg-gray-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden">
                        <ElaraLogo variant="blue" className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{title}</p>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Context Aware</p>
                    </div>
                </div>
                {mode === "floating" && (
                    <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                <div className="flex gap-3 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center p-1">
                        <ElaraLogo variant="blue" className="w-full h-full" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-xs font-medium text-gray-700 leading-relaxed">
                        {initialMessage}
                    </div>
                </div>

                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-gray-900' : 'bg-blue-600 p-1'}`}>
                            {m.role === 'model' && <ElaraLogo variant="blue" className="w-full h-full" />}
                        </div>
                        <div className={`p-3 rounded-2xl shadow-sm text-xs font-medium leading-relaxed ${m.role === 'user'
                            ? 'bg-gray-900 text-white rounded-tr-none'
                            : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                            }`}>
                            {m.parts[0].text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 animate-pulse flex items-center justify-center p-1">
                            <ElaraLogo variant="blue" className="w-full h-full" />
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </form>
        </div>
    );

    if (mode === "floating") {
        return (
            <>
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-2 border-blue-500/20"
                    >
                        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
                        <ElaraLogo variant="light" className="w-6 h-6 relative" />
                    </button>
                )}
                {isOpen && ChatContent}
            </>
        );
    }

    return ChatContent;
}
