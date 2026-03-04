"use client";

import { useState } from "react";

interface LookupItem {
    id: string;
    name: string;
}

interface LookupManagementProps {
    title: string;
    initialData: LookupItem[];
    apiPath: string;
    schema?: any; // For future complex data
}

export default function LookupManagement({ title, initialData, apiPath }: LookupManagementProps) {
    const [data, setData] = useState<LookupItem[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [editingItem, setEditingItem] = useState<LookupItem | null>(null);

    const handleCreate = async () => {
        if (!newItemName) return;
        setLoading(true);
        try {
            const res = await fetch(apiPath, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newItemName })
            });
            if (res.ok) {
                setNewItemName("");
                refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiPath}/${editingItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingItem.name })
            });
            if (res.ok) {
                setEditingItem(null);
                refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This may break existing relations.")) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
            if (res.ok) refresh();
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        const res = await fetch(apiPath);
        const json = await res.json();
        if (json.success) setData(json.data);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Create Section */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Add <span className="text-blue-600">New</span></h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Expand the system scope</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder={`${title} Name`}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                        />
                        <button
                            onClick={handleCreate}
                            disabled={loading || !newItemName}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 disabled:opacity-30"
                        >
                            {loading ? "Processing..." : `Register ${title}`}
                        </button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        {editingItem?.id === item.id ? (
                                            <input
                                                className="bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm font-bold w-full"
                                                value={editingItem.name}
                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-right flex justify-end gap-3">
                                        {editingItem?.id === item.id ? (
                                            <>
                                                <button onClick={handleUpdate} className="text-green-600 font-black text-[10px] uppercase tracking-widest">Save</button>
                                                <button onClick={() => setEditingItem(null)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Exit</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditingItem(item)} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:underline">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
