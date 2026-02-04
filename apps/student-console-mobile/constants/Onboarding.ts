export type OnboardingSlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  illustration: string; // image / lottie / svg
  cta?: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Welcome to \n BESC Console",
    subtitle: "Your academic companion",
    description:
      "Access everything related to your college life — classes, exams, fees, library, and services — all in one place.",
    illustration: "onboarding-campus",
    cta: "Next",
  },
  {
    id: 2,
    title: "Stay on Track Every Day",
    subtitle: "Classes • Attendance • Timetable",
    description: "View today’s classes, mark attendance, track your timetable, and never miss an academic activity.",
    illustration: "onboarding-schedule",
    cta: "Next",
  },
  {
    id: 3,
    title: "Exams, Results & Documents",
    subtitle: "Everything exam-related",
    description: "Fill exam forms, download admit cards, check results, and access your marksheets securely.",
    illustration: "onboarding-exams",
    cta: "Next",
  },
  {
    id: 4,
    title: "Services & Support Made Easy",
    subtitle: "Requests • Library • Certificates",
    description:
      "Apply for certificates, track service requests, manage library dues, and get college support anytime.",
    illustration: "onboarding-services",
    cta: "Get Started",
  },
];
