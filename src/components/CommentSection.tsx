"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface CommentUser {
    id: string;
    full_name: string;
    display_name: string;
    role: string;
    avatar?: string;
    bio?: string;
    links?: any;
}

export interface CommentNode {
    id: string;
    project_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    user: CommentUser;
    replies?: CommentNode[];
    tier: "admin" | "supervisor" | "author" | "regular";
    badge?: string;
}

interface CommentSectionProps {
    projectId: string;
    currentUser: any | null; // From session
}

export default function CommentSection({ projectId, currentUser }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Used for auth redirects
    const [selectedUser, setSelectedUser] = useState<CommentUser | null>(null);

    useEffect(() => {
        fetchComments();
    }, [projectId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/comments`);
            const data = await res.json();
            if (data.success) {
                setComments(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to load comments.");
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (parentId: string | null = null) => {
        if (!currentUser) {
            window.location.href = `/login?redirect=/projects/${projectId}`;
            return;
        }

        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim(), parent_id: parentId })
            });
            const data = await res.json();
            if (data.success) {
                setNewComment("");
                setReplyContent("");
                setReplyingTo(null);
                await fetchComments(); // Refresh to get proper tiering/threading from server
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setEditingCommentId(null);
                setEditContent("");
                await fetchComments();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to edit comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                await fetchComments();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to delete comment.");
        }
    };

    const getTierStyles = (tier: string) => {
        switch (tier) {
            case "admin":
                return "bg-amber-50 border-amber-200 outline outline-2 outline-amber-500/20";
            case "supervisor":
                return "bg-purple-50/50 border-purple-200";
            case "author":
                return "bg-blue-50/50 border-blue-200";
            default:
                return "bg-white border-gray-100";
        }
    };

    const getBadgeStyles = (tier: string) => {
        switch (tier) {
            case "admin":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "supervisor":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "author":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "hidden";
        }
    };

    const isDeletedUser = (content: string) => content === "[comment deleted]";

    const renderComment = (c: CommentNode, isReply = false) => {
        const deleted = isDeletedUser(c.content);
        const isOwner = currentUser?.id === c.user_id;
        const isAdmin = currentUser?.role === "admin";

        // When user is deleted via soft delete
        const displayName = deleted ? "Deleted User" : c.user?.display_name || c.user?.full_name || "Unknown User";
        const initial = deleted ? "X" : displayName.charAt(0).toUpperCase();

        return (
            <div key={c.id} className={`${isReply ? "ml-8 md:ml-12 mt-4" : "mt-6"}`}>
                <div className={`p-4 md:p-6 rounded-2xl border transition-all ${getTierStyles(c.tier)}`}>

                    {/* Header with Hover Tooltip */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 group relative z-10">
                            {deleted ? (
                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold flex-shrink-0 cursor-default">
                                    X
                                </div>
                            ) : (
                                <a
                                    href={`/profile/${c.user?.id}`}
                                    className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold flex-shrink-0 hover:ring-2 hover:ring-offset-2 hover:ring-gray-900 transition-all focus:outline-none"
                                >
                                    {initial}
                                </a>
                            )}

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {deleted ? (
                                        <span className="text-sm font-black uppercase tracking-tight text-gray-400 cursor-default">
                                            {displayName}
                                        </span>
                                    ) : (
                                        <a
                                            href={`/profile/${c.user?.id}`}
                                            className="text-sm font-black uppercase tracking-tight hover:underline focus:outline-none text-gray-900"
                                        >
                                            {displayName}
                                        </a>
                                    )}

                                    {c.badge && !deleted && (
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getBadgeStyles(c.tier)}`}>
                                            {c.badge}
                                        </span>
                                    )}
                                    {c.tier === "admin" && (
                                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-1">
                                            📌 Official
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {c.updated_at !== c.created_at && !deleted && (
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">• Edited</span>
                                    )}
                                </div>
                            </div>

                            {/* Hover Tooltip - Positioned exactly below the header */}
                            {!deleted && c.user && (
                                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-default pointer-events-none group-hover:pointer-events-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-md">
                                            {initial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 tracking-tight">{c.user.display_name}</p>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{c.user.role}</p>
                                        </div>
                                    </div>
                                    {c.user.bio && (
                                        <p className="mt-3 text-xs text-gray-600 leading-relaxed line-clamp-3">
                                            {c.user.bio}
                                        </p>
                                    )}
                                    {c.user.links && Object.keys(c.user.links).length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {Object.entries(c.user.links).slice(0, 3).map(([key]) => (
                                                <span key={key} className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controls (Edit/Delete) */}
                        {!deleted && (isOwner || isAdmin) && (
                            <div className="flex items-center gap-2">
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            setEditingCommentId(c.id);
                                            setEditContent(c.content);
                                            setReplyingTo(null);
                                        }}
                                        className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="text-[10px] font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                                    title={isAdmin ? "Hard delete as Admin" : "Delete your comment"}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="mt-4 pl-13"> {/* Indent to match avatar */}
                        {editingCommentId === c.id ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y min-h-[100px] text-sm text-gray-700 bg-white"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(c.id)}
                                        disabled={submitting || !editContent.trim() || editContent === c.content}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${deleted ? "text-gray-400 italic" : "text-gray-700"}`}>
                                    {c.content}
                                </p>

                                {/* Action Bar — show Reply on both top-level AND reply comments */}
                                {!deleted && (
                                    <div>
                                        <button
                                            onClick={() => {
                                                if (!currentUser) {
                                                    window.location.href = `/login?redirect=/projects/${projectId}`;
                                                    return;
                                                }
                                                // Reply directly to the specific comment (allows deeper nesting)
                                                const targetId = c.id;
                                                setReplyingTo(replyingTo === targetId ? null : targetId);
                                                setReplyContent("");
                                                setEditingCommentId(null);
                                            }}
                                            className="text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                            Reply
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reply Composer box */}
                    {replyingTo === c.id && (
                        <div className="mt-4 pl-13 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm bg-white"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handlePost(c.id)}
                                        disabled={submitting || !replyContent.trim()}
                                        className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? "Posting..." : "Post Reply"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Render nested replies */}
                {c.replies && c.replies.length > 0 && (
                    <div className="border-l-2 border-gray-100/80 hover:border-gray-200 transition-colors">
                        {c.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="py-8 text-center"><span className="w-8 h-8 inline-block border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;
    if (error) return <div className="py-8 text-center text-red-500 text-sm font-bold uppercase tracking-widest">{error}</div>;

    return (
        <div className="mt-12 space-y-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                Discussion <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}</span>
            </h2>

            {/* Main top-level composer */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                {!currentUser ? (
                    <div className="text-center py-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Join the Conversation</h3>
                        <p className="text-xs text-gray-500 mb-4">Log in to share your thoughts, ask questions, or provide feedback.</p>
                        <a
                            href={`/login?redirect=/projects/${projectId}`}
                            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-500/20"
                        >
                            Log In to Comment
                        </a>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex flex-shrink-0 items-center justify-center font-bold">
                            {currentUser.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 space-y-3">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts on this research..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-y min-h-[100px] text-sm text-gray-700"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handlePost(null)}
                                    disabled={submitting || !newComment.trim()}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-shadow shadow-lg shadow-gray-900/20"
                                >
                                    {submitting ? "Posting..." : "Post Comment"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments List */}
            <div className="space-y-2">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No comments yet. Be the first!</p>
                    </div>
                ) : (
                    comments.map(c => renderComment(c, false))
                )}
            </div>

            {/* Removed standalone Profile Modal - now handled inline via hover tooltips */}
        </div>
    );
}
