import { useEffect, useState } from "react";

import { brandLogoUrl } from "@/constants/Images";
import { getBranding } from "@/services/settings";

/** College logo + name from the branding endpoint, with a known-good bundled
 * fallback so the UI never renders a broken image while the request is in
 * flight (or if it fails). */
export function useBranding() {
  const [logoUrl, setLogoUrl] = useState<string>(brandLogoUrl);
  const [collegeName, setCollegeName] = useState<string>("BESC");

  useEffect(() => {
    let cancelled = false;
    void getBranding().then((b) => {
      if (cancelled || !b) return;
      if (b.logoUrl) setLogoUrl(b.logoUrl);
      if (b.collegeName) setCollegeName(b.collegeName);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { logoUrl, collegeName };
}
