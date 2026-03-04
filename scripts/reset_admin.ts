import { supabase } from "../src/lib/supabase";
import bcrypt from "bcryptjs";

async function resetAdmin() {
    const hash = await bcrypt.hash("TestPass123!", 12);
    console.log("Generated hash:", hash);

    const { data, error } = await supabase
        .from("users")
        .update({ password_hash: hash })
        .eq("email", "admin@inquisia.babcock.edu.ng")
        .select();

    if (error) {
        console.error("Error updating admin:", error);
    } else {
        console.log("Admin updated successfully:", data);
    }
}

resetAdmin();
