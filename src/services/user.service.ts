import { supabase } from "@/lib/supabase";
import { ProfileUpdateInput } from "@/schemas";
import { User } from "@/types";

export class UserService {
    /**
     * Fetches a full profile including joined relations if they exist (departments)
     */
    static async getProfileById(userId: string): Promise<User | null> {
        const { data: user, error } = await supabase
            .from("users")
            .select(`
        *,
        departments:department_id (id, name, school)
      `)
            .eq("id", userId)
            .single();

        if (error || !user) {
            return null;
        }

        // Format the response properly depending on the role
        return user as unknown as User;
    }

    /**
     * Applies schema-validated patching rules to the user's base db attributes
     */
    static async updateProfile(userId: string, payload: ProfileUpdateInput): Promise<User> {

        // We only construct the payload with permitted updates. Zod takes care of structural validity
        const updatePayload: any = {};
        if (payload.bio !== undefined) updatePayload.bio = payload.bio;
        if (payload.display_name !== undefined) updatePayload.display_name = payload.display_name;
        if (payload.full_name !== undefined) updatePayload.full_name = payload.full_name;
        if (payload.degrees !== undefined) updatePayload.degrees = payload.degrees;
        if (payload.links !== undefined) updatePayload.links = payload.links;

        const { data: updatedUser, error } = await supabase
            .from("users")
            .update(updatePayload)
            .eq("id", userId)
            .select(`
        *,
        departments:department_id (id, name, school)
      `)
            .single();

        if (error || !updatedUser) {
            throw new Error(error?.message || "Failed to update profile");
        }

        return updatedUser as unknown as User;
    }
}
