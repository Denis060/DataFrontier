"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole, type Role } from "@/lib/auth";

const ROLES: Role[] = ["reader", "author", "editor", "admin"];

/**
 * Change a user's role. Admin-only — and the profiles role trigger enforces
 * that at the database level too, so this can't be bypassed. You can't change
 * your own role (prevents locking yourself out of admin).
 */
export async function setUserRole(
  userId: string,
  role: string,
): Promise<{ error: string } | { ok: true }> {
  const me = await requireStaff();
  if (!hasRole(me.role, ["admin"])) return { error: "Only an admin can change roles." };
  if (userId === me.id) return { error: "You can't change your own role." };
  if (!ROLES.includes(role as Role)) return { error: "Unknown role." };

  const db = await createClient();
  const { error } = await db.from("profiles").update({ role: role as Role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}
