import { useAuth } from "@/features/auth/providers/auth-provider";
import { isIdCardGuestUser } from "@/hooks/use-restrict-temp-users";

import IdCardDashboardPage from "./id-card-dashboard-page";
import IdCardIssuePage from "./id-card-issue-page";

/**
 * Index of the ID-card tool (`/dashboard/tools/id-cards`).
 *
 * ID-card guest accounts (scrguest1/2) are locked to this exact path by the
 * restricted-users hook and may only ever use the issue/reissue page — so for
 * them the index renders the Issue page, exactly as before. Every other
 * (staff/admin) user sees the realtime Dashboard here. This keeps the URL and
 * the `use-restrict-temp-users` gating byte-for-byte unchanged while making the
 * dashboard the default landing for staff.
 */
export default function IdCardHomeGate() {
  const { user } = useAuth();
  if (isIdCardGuestUser(user?.email)) return <IdCardIssuePage />;
  return <IdCardDashboardPage />;
}
