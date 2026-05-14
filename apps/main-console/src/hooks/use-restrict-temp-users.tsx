import { useAuth } from "@/features/auth/hooks/use-auth";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Main-console routes under `LibraryMaster` (see `LibraryMaster.tsx`). */
export const LIBRARY_MODULE_PATH_PREFIX = "/dashboard/library";

const LIBRARY_ONLY_USER_EMAIL = "library@thebges.edu.in";

/** Staff restricted to library-only UI and routes (see `useRestrictTempUsers`, `AppSidebar`). */
export function isLibraryOnlyUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === LIBRARY_ONLY_USER_EMAIL;
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

    if (!TEMP_USER_EMAILS.includes(user.email)) {
      return;
    }

    const allowedPaths = [
      "/dashboard/admit-card-distributions",
      "/dashboard/cu-reg/physical-marking",
    ];

    const isOnAllowedPath = allowedPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + "/"),
    );

    if (!isOnAllowedPath) {
      navigate("/dashboard/admit-card-distributions");
    }
  }, [user?.email, location.pathname, navigate]);
};
