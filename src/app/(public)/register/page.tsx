"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { registerSchema } from "@/schemas";

// We need an enum representation to drive what the UI shows.
type VisibleRole = "student" | "supervisor" | "public";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [detectedRole, setDetectedRole] = useState<VisibleRole>("public");
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        // Basic domain checking to adjust UI fields.
        if (email.endsWith("@student.babcock.edu.ng")) {
            setDetectedRole("student");
        } else if (email.endsWith("@babcock.edu.ng")) {
            setDetectedRole("supervisor");
        } else {
            setDetectedRole("public");
        }
    }, [email]);

    // We fetch departments for Students and Supervisors
    useEffect(() => {
        if (detectedRole !== "public") {
            fetch("/api/departments")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setDepartments(data.data);
                    }
                })
                .catch(console.error);
        }
    }, [detectedRole]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const formObj = Object.fromEntries(formData.entries());

        // Inject the calculated role dynamically so the backend Schema gets exactly what it expects
        formObj.role = detectedRole;

        try {
            // Clean up empty optional fields
            Object.keys(formObj).forEach(key => {
                if (formObj[key] === "") delete formObj[key];
            });

            // Validate local
            registerSchema.parse(formObj);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formObj),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Registration failed");
            }

            // Hard navigation to trigger Layout UI updates
            window.location.href = "/dashboard";
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else {
                setError(err.message || "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 py-12">
            <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-8 shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Registering with a <span className="font-semibold">@student.babcock.edu.ng</span> or <span className="font-semibold">@babcock.edu.ng</span> email unlocks additional features.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* Conditionally rendered fields based on Role inference */}
                        <div className="pt-4 border-t border-gray-200 mt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4 tracking-wider uppercase">
                                {detectedRole === "student" && "Student Details"}
                                {detectedRole === "supervisor" && "Staff Details"}
                                {detectedRole === "public" && "Public Profile Details"}
                            </h3>

                            <div className="space-y-4">
                                {/* Every role supports at least an optional/required Full Name */}
                                {(detectedRole === "student" || detectedRole === "supervisor") ? (
                                    <div>
                                        <label htmlFor="full_name" className="block text-sm font-medium leading-6 text-gray-900">
                                            Full Name
                                        </label>
                                        <input
                                            id="full_name"
                                            name="full_name"
                                            type="text"
                                            required
                                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label htmlFor="display_name" className="block text-sm font-medium leading-6 text-gray-900">
                                                Display Name
                                            </label>
                                            <input
                                                id="display_name"
                                                name="display_name"
                                                type="text"
                                                required
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="full_name" className="block text-sm font-medium leading-6 text-gray-900">
                                                Full Name (Optional)
                                            </label>
                                            <input
                                                id="full_name"
                                                name="full_name"
                                                type="text"
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Student specific fields */}
                                {detectedRole === "student" && (
                                    <>
                                        <div>
                                            <label htmlFor="matric_no" className="block text-sm font-medium leading-6 text-gray-900">
                                                Matriculation Number
                                            </label>
                                            <input
                                                id="matric_no"
                                                name="matric_no"
                                                type="text"
                                                required
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="level" className="block text-sm font-medium leading-6 text-gray-900">
                                                Level (e.g., 400)
                                            </label>
                                            <input
                                                id="level"
                                                name="level"
                                                type="text"
                                                required
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Supervisor specific fields */}
                                {detectedRole === "supervisor" && (
                                    <>
                                        <div>
                                            <label htmlFor="staff_id" className="block text-sm font-medium leading-6 text-gray-900">
                                                Staff ID
                                            </label>
                                            <input
                                                id="staff_id"
                                                name="staff_id"
                                                type="text"
                                                required
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="degrees" className="block text-sm font-medium leading-6 text-gray-900">
                                                Academic Degrees (e.g., PhD Computer Science)
                                            </label>
                                            <input
                                                id="degrees"
                                                name="degrees"
                                                type="text"
                                                required
                                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Shared fields for Student & Supervisor */}
                                {(detectedRole === "student" || detectedRole === "supervisor") && (
                                    <div>
                                        <label htmlFor="department_id" className="block text-sm font-medium leading-6 text-gray-900">
                                            Department
                                        </label>
                                        <select
                                            id="department_id"
                                            name="department_id"
                                            required
                                            className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white"
                                        >
                                            <option value="">Select a department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {isLoading ? "Creating account..." : "Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
