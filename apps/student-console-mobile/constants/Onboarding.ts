export type OnboardingSlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  illustration: string; // key mapped to an illustration image in the screen
  accent?: string; // per-slide accent (non-purple)
  accentTo?: string; // gradient end for the CTA
  cta?: string;
};

// Four slides; the last one starts the sign-in. Colours vary; no purple.
export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Welcome to BESC",
    subtitle: "Your academic companion",
    description: "Classes, exams, fees, library and more, all in one simple app.",
    illustration: "onboarding-campus",
    accent: "#f43f5e",
    accentTo: "#fb7185",
    cta: "Next",
  },
  {
    id: 2,
    title: "Classes & Exams",
    subtitle: "Stay on track",
    description:
      "Attend classes, track your attendance, fill exam forms and view your results and marksheets.",
    illustration: "onboarding-exams",
    accent: "#2563eb",
    accentTo: "#3b82f6",
    cta: "Next",
  },
  {
    id: 3,
    title: "Fees & Payments",
    subtitle: "Pay in seconds",
    description: "Pay your fees, check dues and download receipts, right from your phone.",
    illustration: "onboarding-fees",
    accent: "#16a34a",
    accentTo: "#22c55e",
    cta: "Next",
  },
  {
    id: 4,
    title: "Ready to begin",
    subtitle: "Let’s get started",
    description: "Sign in with your college credentials to open your personal dashboard.",
    illustration: "onboarding-login",
    accent: "#7c3aed",
    accentTo: "#8b5cf6",
    cta: "Get Started",
  },
];
