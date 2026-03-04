import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { EmailService } from "@/services/email.service";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { RegisterInput, LoginInput } from "@/schemas";
import { User, UserRole } from "@/types";

export class AuthService {
    /**
     * Evaluates an email domain and assigns the proper role
     */
    static evaluateRoleFromEmail(email: string): UserRole {
        if (email.endsWith("@student.babcock.edu.ng")) {
            return "student";
        }
        if (email.endsWith("@babcock.edu.ng")) {
            return "supervisor"; // Note: not active yet since `@babcock.edu.ng` triggers is_verified checks
        }
        return "public"; // Every other user defaults to public
    }

    /**
     * Authenticates a user based on matching email + decrypted bcrypt hash comparison
     */
    static async login(payload: LoginInput): Promise<{ user: User; token: string; expiresAt: Date }> {
        const { data: userRow, error: findError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", payload.email)
            .single();

        console.log("[LOGIN] Find user result:", { found: !!userRow, error: findError?.message, email: payload.email });

        if (findError || !userRow) {
            throw new Error("Invalid credentials");
        }

        console.log("[LOGIN] User found:", { id: userRow.id, role: userRow.role, is_active: userRow.is_active, account_status: userRow.account_status });

        if (userRow.account_status === "banned") {
            throw new Error(`Your account has been banned. Contact support.`);
        }

        if (!userRow.is_active) {
            throw new Error(`Your account has been deactivated.`);
        }

        const isValid = await bcrypt.compare(payload.password, userRow.password_hash);
        console.log("[LOGIN] bcrypt result:", isValid, "hash prefix:", userRow.password_hash?.slice(0, 10));
        if (!isValid) throw new Error("Invalid credentials");

        const { token, expiresAt } = await this.createSession(userRow.id);

        return { user: userRow as unknown as User, token, expiresAt };
    }

    /**
     * Registers a new user based on specific domains logic and hashes password before db push
     */
    static async register(payload: RegisterInput): Promise<{ user: User; token: string; expiresAt: Date }> {
        const expectedRole = this.evaluateRoleFromEmail(payload.email);

        // Safety check - we expect the frontend form to enforce this, but just in case, verify mismatch
        if (expectedRole !== payload.role) {
            throw new Error(`Domain mismatch. Email domain maps to ${expectedRole} role.`);
        }

        // Checking if a user already exists before doing expensive hashes
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", payload.email)
            .single();

        if (existingUser) {
            throw new Error("Email already registered");
        }

        const passwordHash = await bcrypt.hash(payload.password, 12);

        // Preparing Base User Object fields
        const newUserData: any = {
            email: payload.email,
            password_hash: passwordHash,
            role: expectedRole,
            is_active: true,
            account_status: "active",
        };

        if (expectedRole === "supervisor") {
            const sp = payload as import("@/schemas").SupervisorRegisterInput;
            newUserData.full_name = sp.full_name;
            newUserData.staff_id = sp.staff_id;
            newUserData.degrees = sp.degrees;
            newUserData.department_id = sp.department_id;
            newUserData.is_verified = false; // Supervisors must be manually verified
        } else if (expectedRole === "student") {
            const st = payload as import("@/schemas").StudentRegisterInput;
            newUserData.full_name = st.full_name;
            newUserData.matric_no = st.matric_no;
            newUserData.level = st.level;
            newUserData.department_id = st.department_id;
            newUserData.is_verified = true; // Auto-verified
        } else {
            const pu = payload as import("@/schemas").PublicRegisterInput;
            newUserData.display_name = pu.display_name;
            newUserData.full_name = pu.full_name;
            newUserData.is_verified = true; // Auto-verified
        }

        const { data: insertedUser, error } = await supabase
            .from("users")
            .insert(newUserData)
            .select("*")
            .single();

        if (error || !insertedUser) {
            console.error(error);
            throw new Error(error?.message || "Registration failed");
        }

        // Immediately log them in
        const { token, expiresAt } = await this.createSession(insertedUser.id);
        return { user: insertedUser as unknown as User, token, expiresAt };
    }

    /**
     * Create a standard 7 day session row directly into the DB and returns the payload to apply as a cookie
     */
    private static async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
        const rawBytes = crypto.randomBytes(32).toString('hex');
        const secret = process.env.SESSION_SECRET || "";
        // Combines entropy from environment and random generation, hashed down mapping to 64 character hex string.
        const token = crypto.createHash("sha256").update(rawBytes + secret).digest("hex");

        // Cookie max-age is 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { error } = await supabaseAdmin.from("sessions").insert({
            user_id: userId,
            token,
            expires_at: expiresAt.toISOString(),
        });

        if (error) {
            console.error("Session creation error:", error.message);
            throw new Error("Failed to create user session");
        }

        return { token, expiresAt };
    }
}
