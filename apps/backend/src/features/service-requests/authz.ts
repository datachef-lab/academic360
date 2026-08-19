import type { User } from "@repo/db/schemas/models/user";

/** Institutional staff types permitted to administer service requests. */
export const STAFF_TYPES = ["ADMIN", "STAFF", "FACULTY"];

export function isStaff(user?: Pick<User, "type"> | null): boolean {
  return !!user && STAFF_TYPES.includes(user.type as string);
}

/**
 * Returns true if the caller may act on a ticket as the requestor:
 * the authenticated student who owns it. (Staff access is checked
 * separately via isStaff so that ownership and role are explicit.)
 */
export function ownsTicket(
  user: Pick<User, "id"> | undefined | null,
  ticket: { studentUserId: number | null },
): boolean {
  return (
    !!user &&
    ticket.studentUserId != null &&
    ticket.studentUserId === (user.id as number)
  );
}

/** Staff (any) OR the owning student. */
export function canAccessTicket(
  user: (Pick<User, "id" | "type">) | undefined | null,
  ticket: { studentUserId: number | null },
): boolean {
  return isStaff(user) || ownsTicket(user, ticket);
}
