"use client";

import { useState } from "react";
import { User, AccountStatus } from "@/types";

interface AdminUserTableProps {
    initialUsers: any[];
}

export default function AdminUserTable({ initialUsers }: AdminUserTableProps) {
    const [users, setUsers] = useState(initialUsers);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [modUser, setModUser] = useState<any | null>(null);
    const [modStatus, setModStatus] = useState<AccountStatus>("active");
    const [modReason, setModReason] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("query", search);
        if (roleFilter) params.set("role", roleFilter);

        try {
            const res = await fetch(`/api/admin/users?${params.toString()}`);
            const data = await res.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!modUser) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${modUser.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: modStatus, reason: modReason })
            });
            const data = await res.json();
            if (data.success) {
                setModUser(null);
                setModReason("");
                fetchUsers();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Update status failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-2">
                    <select
                        className="bg-white border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest px-4 shadow-sm"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            // We trigger fetch manually for simplicity in this turn
                        }}
                    >
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="supervisor">Supervisors</option>
                        <option value="public">Public</option>
                    </select>
                    <button
                        onClick={fetchUsers}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-gray-900 text-sm">{user.full_name || user.display_name || "Unknown"}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{user.department?.name || "N/A"}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${user.account_status === "active" ? "bg-green-50 text-green-600 border-green-100" :
                                            user.account_status === "warned" ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                                                "bg-red-50 text-red-600 border-red-100"
                                        }`}>
                                        {user.account_status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => {
                                            setModUser(user);
                                            setModStatus(user.account_status);
                                        }}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Moderate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Moderation Modal */}
            {modUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Moderate <span className="text-blue-600">{modUser.full_name}</span></h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Adjust account standing and legal status</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Status</label>
                                <select
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-blue-500"
                                    value={modStatus}
                                    onChange={(e) => setModStatus(e.target.value as AccountStatus)}
                                >
                                    <option value="active">Active (Normal)</option>
                                    <option value="warned">Warned (Flags visible to user)</option>
                                    <option value="restricted">Restricted (Cannot upload or comment)</option>
                                    <option value="banned">Banned (Login disabled)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Action</label>
                                <textarea
                                    placeholder="Briefly describe the violation or reason for status change..."
                                    className="w-full h-32 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-blue-500 resize-none p-4"
                                    value={modReason}
                                    onChange={(e) => setModReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setModUser(null)}
                                className="flex-1 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={loading || !modReason}
                                className="flex-1 bg-gray-900 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl disabled:opacity-30"
                            >
                                {loading ? "Saving..." : "Apply Status"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
