import { useAuth } from "@/features/auth/hooks/use-auth";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

// This is hooks is created temporary to restrict users (and navigate them to ) from accessing the admin console certain pages
export const useRestrictTempUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email || !TEMP_USER_EMAILS.includes(user.email)) {
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
