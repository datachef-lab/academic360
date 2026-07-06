import { useAuth } from "@/features/auth/hooks/use-auth";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Main-console routes under `LibraryMaster` (see `LibraryMaster.tsx`). */
export const LIBRARY_MODULE_PATH_PREFIX = "/dashboard/library";

/** Fee payment marking page only (see `FeePaymentMarkingPage`, `FeesMasterLayout`). */
export const FEE_PAYMENT_MARKING_PATH = "/dashboard/fees/marking";

/** ID card issuing tool page (see `App.tsx` tools/id-cards route). */
export const ID_CARD_TOOL_PATH = "/dashboard/tools/id-cards";

/** Landing page temp users are redirected to (their default allowed route). */
export const TEMP_USER_HOME_PATH = "/dashboard/admit-card-distributions";

const LIBRARY_ONLY_USER_EMAIL = "library@thebges.edu.in";
const FEE_MARKING_ONLY_USER_EMAIL = "anindita.doe@thebges.edu.in";

/**
 * Temp users additionally granted the ID card tool page (on top of their
 * default admit-card / physical-marking access). Subset of `TEMP_USER_EMAILS`.
 */
const ID_CARD_GUEST_EMAILS: string[] = ["scrguest1@thebges.edu.in", "scrguest2@thebges.edu.in"];

/** Temp guest also allowed into the ID card tool (see `AppSidebar`). */
export function isIdCardGuestUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ID_CARD_GUEST_EMAILS.includes(email.trim().toLowerCase());
}

/** Staff restricted to library-only UI and routes (see `useRestrictTempUsers`, `AppSidebar`). */
export function isLibraryOnlyUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === LIBRARY_ONLY_USER_EMAIL;
}

/** Staff restricted to fee payment marking (cash only on page). */
export function isFeeMarkingOnlyUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === FEE_MARKING_ONLY_USER_EMAIL;
}

export const TEMP_USER_EMAILS: string[] = [
  "sreya.sengupta@thebges.edu.in",
  "suman.pal@thebges.edu.in",
  "arpan.chakraborty@thebges.edu.in",
  // "riya.pinto@thebges.edu.in",
  // "swarnajita.saha@thebges.edu.in",
  // "suchismita.nandy@thebges.edu.in",
  // "arpita.patra@thebges.edu.in",
  "madhumita.samal@thebges.edu.in",
  "scrguest1@thebges.edu.in",
  "scrguest2@thebges.edu.in",
];

// Temporary hook: restrict certain staff emails to allowed dashboard subtrees only.
// Invoked from `ProtectedRouteWrapper` and many feature layouts so it runs on every navigation.
export const useRestrictTempUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    if (isLibraryOnlyUser(user.email)) {
      const isOnLibraryPath =
        location.pathname === LIBRARY_MODULE_PATH_PREFIX ||
        location.pathname.startsWith(`${LIBRARY_MODULE_PATH_PREFIX}/`);

      if (!isOnLibraryPath) {
        navigate(LIBRARY_MODULE_PATH_PREFIX);
      }
      return;
    }

    if (isFeeMarkingOnlyUser(user.email)) {
      const isOnFeeMarkingPath =
        location.pathname === FEE_PAYMENT_MARKING_PATH ||
        location.pathname.startsWith(`${FEE_PAYMENT_MARKING_PATH}/`);

      if (!isOnFeeMarkingPath) {
        navigate(FEE_PAYMENT_MARKING_PATH);
      }
      return;
    }

    if (!TEMP_USER_EMAILS.includes(user.email)) {
      return;
    }

    const allowedPaths = [TEMP_USER_HOME_PATH, "/dashboard/cu-reg/physical-marking"];

    const isOnAllowedPath = allowedPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + "/"),
    );

    // Selected guests may ALSO open the ID card tool, but ONLY the issue/reissue
    // page itself — not the reports/templates/shifts/sections sub-routes.
    const isOnIdCardIssuePage =
      isIdCardGuestUser(user.email) && location.pathname === ID_CARD_TOOL_PATH;

    if (!isOnAllowedPath && !isOnIdCardIssuePage) {
      navigate(TEMP_USER_HOME_PATH);
    }
  }, [user?.email, location.pathname, navigate]);
};
