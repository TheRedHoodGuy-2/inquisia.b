"use client";

import { useState } from "react";

interface SupervisorQueueTableProps {
    initialSupervisors: any[];
}

export default function SupervisorQueueTable({ initialSupervisors }: SupervisorQueueTableProps) {
    const [supervisors, setSupervisors] = useState(initialSupervisors);
    const [loading, setLoading] = useState(false);

    const handleVerify = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/verify`, { method: "PATCH" });
            const data = await res.json();
            if (data.success) {
                setSupervisors(prev => prev.filter(s => s.id !== userId));
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Verification failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (supervisors.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Queue Empty</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">All supervisors have been processed and verified</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisor</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Credentials</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {supervisors.map((supp) => (
                        <tr key={supp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <div className="flex flex-col">
                                    <span className="font-black text-gray-900 text-sm">{supp.full_name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{supp.email}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{supp.degrees || "No degrees listed"}</span>
                            </td>
                            <td className="px-8 py-5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{supp.department?.name || "N/A"}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <button
                                    onClick={() => handleVerify(supp.id)}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    Verify Staff
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
