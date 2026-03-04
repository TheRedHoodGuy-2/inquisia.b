export type AccountStatus = 'active' | 'warned' | 'restricted' | 'banned';
export type UserRole = 'student' | 'supervisor' | 'admin' | 'public';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    full_name: string | null;
    display_name: string | null;
    bio: string | null;
    links: { title: string; url: string }[];
    matric_no: string | null;
    staff_id: string | null;
    degrees: string | null;
    level: string | null;
    department_id: string | null;
    is_verified: boolean;
    is_active: boolean;
    account_status: AccountStatus;
    status_reason: string | null;
    status_set_by: string | null;
    status_set_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SessionData {
    user: User;
}

// Ensure the return type of API handlers are uniformly structured
export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string };
