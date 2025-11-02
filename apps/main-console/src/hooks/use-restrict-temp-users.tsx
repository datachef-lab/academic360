import { useAuth } from "@/features/auth/hooks/use-auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const TEMP_USER_EMAILS: string[] = [
  "sreya.sengupta@thebges.edu.in",
  "suman.pal@thebges.edu.in",
  "arpan.chakraborty@thebges.edu.in",
];

// This is hooks is created temporary to restrict users (and navigate them to ) from accessing the admin console certain pages
export const useRestrictTempUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email && TEMP_USER_EMAILS.includes(user.email!)) {
      navigate("/dashboard/cu-reg/physical-marking");
    }
  }, [user?.email, navigate]);
};
