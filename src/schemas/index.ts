import { z } from "zod";

// Base registration scheme for fields requested by all users
const baseRegisterSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const studentRegisterSchema = baseRegisterSchema.extend({
    role: z.literal("student"),
    matric_no: z.string().min(1, "Matriculation number is required"),
    department_id: z.string().uuid("Invalid department selected"),
    level: z.string().min(1, "Level is required"),
    full_name: z.string().min(1, "Full name is required"),
});

export const supervisorRegisterSchema = baseRegisterSchema.extend({
    role: z.literal("supervisor"),
    staff_id: z.string().min(1, "Staff ID is required"),
    degrees: z.string().min(1, "Degrees are required"),
    department_id: z.string().uuid("Invalid department selected"),
    full_name: z.string().min(1, "Full name is required"),
});

export const publicRegisterSchema = baseRegisterSchema.extend({
    role: z.literal("public"),
    display_name: z.string().min(1, "Display name is required"),
    full_name: z.string().optional(),
});

// A definitive register schema that validates the conditionally required fields
export const registerSchema = z.discriminatedUnion("role", [
    studentRegisterSchema,
    supervisorRegisterSchema,
    publicRegisterSchema,
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type SupervisorRegisterInput = z.infer<typeof supervisorRegisterSchema>;
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
    display_name: z.string().min(1, "Display name cannot be empty").optional(),
    full_name: z.string().min(1, "Full name cannot be empty").optional(),
    degrees: z.string().min(1, "Degrees cannot be empty").optional().nullable(),
    links: z.array(
        z.object({
            title: z.string().min(1, "Link title is required"),
            url: z.string().url("Must be a valid URL")
        })
    ).max(4, "Cannot exceed maximum allowed links").optional()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const projectSubmissionSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(255, "Title cannot exceed 255 characters"),
    abstract: z.string().min(50, "Abstract must be at least 50 characters"),
    supervisor_id: z.string().uuid("Invalid supervisor selected"),
    github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    live_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    presentation_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    co_authors: z.array(z.string().min(1, "Matric number cannot be empty")).optional(),
    student_tags: z.array(z.string()).optional()
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;
