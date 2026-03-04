"use client";

import { useState } from "react";
import { User, AccountStatus } from "@/types";

export function OTPModal({ user }: { user: any | null }) {
    // Only show for logged in, unverified students or public users
    const isUnverified = user && !user.is_verified && user.role !== "supervisor";

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMsg, setResendMsg] = useState("");

    if (!isUnverified) return null;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });
            const data = await res.json();

            if (data.success) {
                // Instantly refresh the page to clear the modal
                window.location.reload();
            } else {
                setError(data.error || "Invalid code.");
            }
        } catch (err) {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError("");
        setResendMsg("");

        try {
            const res = await fetch("/api/auth/resend-otp", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                setResendMsg(data.message || "Code resent!");
            } else {
                setError(data.error || "Failed to resend code.");
            }
        } catch (err) {
            setError("Failed to resend.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-12 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>

                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Check your email</h2>
                <p className="text-sm font-bold text-gray-500 mb-8 max-w-sm">
                    We sent a 6-digit verification code to <span className="text-gray-900">{user.email}</span>. Enter it below to activate your account.
                </p>

                <form onSubmit={handleVerify} className="w-full space-y-6">
                    <div>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            className="w-full text-center text-4xl font-black tracking-widest bg-gray-50 border-gray-100 rounded-2xl py-6 focus:ring-blue-500"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                    </div>

                    {error && <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{error}</p>}
                    {resendMsg && <p className="text-xs font-bold text-green-600 uppercase tracking-widest">{resendMsg}</p>}

                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-blue-600 text-white px-8 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                    >
                        {loading ? "Verifying..." : "Verify Identity"}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-4 w-full">
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                    >
                        {resendLoading ? "Sending..." : "Didn't receive a code? Resend"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                    >
                        Logout & Try Another Account
                    </button>
                </div>
            </div>
        </div>
    );
}
