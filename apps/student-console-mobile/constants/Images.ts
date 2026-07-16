import heroImage from "@/assets/images/hero-image.jpeg";
import sampleQrcode from "@/assets/images/sample-qrcode.png";
import examDetailsImage from "@/assets/images/exam-illustration.png";

// Onboarding illustrations. Swap these four files (same names) with your own
// picks — colourful flat education illustrations — and the screen updates.
import onbWelcome from "@/assets/illustrations/welcome.png";
import onbSchedule from "@/assets/illustrations/schedule.png";
import onbExams from "@/assets/illustrations/exams.png";
import onbDashboard from "@/assets/illustrations/dashboard.png";
import onbFees from "@/assets/illustrations/fees.png";

export { heroImage, sampleQrcode, examDetailsImage };

// Remote college logo (served by the backend settings file endpoint).
export const brandLogoUrl = "https://api.academic360.app/api/v1/settings/file/4";

// Slide key -> illustration image.
export const onboardingImages: Record<string, number> = {
  "onboarding-campus": onbWelcome,
  "onboarding-schedule": onbSchedule,
  "onboarding-exams": onbExams,
  "onboarding-fees": onbFees,
  "onboarding-login": onbDashboard,
};
