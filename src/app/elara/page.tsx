import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ElaraClient from "./ElaraClient";

export default async function ElaraPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/login?redirect=/elara");
    }

    return <ElaraClient />;
}
