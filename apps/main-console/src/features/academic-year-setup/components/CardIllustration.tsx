import {
  BookOpen,
  GraduationCap,
  SlidersHorizontal,
  Workflow,
  Home,
  Library,
  Users,
  LifeBuoy,
  FileText,
  Trophy,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Themed, license-safe SVG illustrations for the academic-setup cards.
 * Each card maps to a `name` -> gradient + icon. Pass `image` to override the
 * SVG with a real picture later (e.g. an anime/ghibli-style PNG) with no other
 * code change.
 */
export type IllustrationName =
  | "course-design"
  | "admissions"
  | "subject-selection"
  | "promotion-logic"
  | "admission-home"
  | "admission-master"
  | "staff-management"
  | "help-desk"
  | "application-forms"
  | "merit-listing"
  | "admit-students";

const THEMES: Record<IllustrationName, { gradient: string; Icon: LucideIcon }> = {
  "course-design": { gradient: "from-blue-500 to-indigo-600", Icon: BookOpen },
  admissions: { gradient: "from-emerald-500 to-teal-600", Icon: GraduationCap },
  "subject-selection": { gradient: "from-pink-500 to-fuchsia-600", Icon: SlidersHorizontal },
  "promotion-logic": { gradient: "from-violet-500 to-purple-600", Icon: Workflow },
  "admission-home": { gradient: "from-emerald-500 to-green-600", Icon: Home },
  "admission-master": { gradient: "from-indigo-500 to-blue-600", Icon: Library },
  "staff-management": { gradient: "from-amber-500 to-orange-600", Icon: Users },
  "help-desk": { gradient: "from-sky-500 to-cyan-600", Icon: LifeBuoy },
  "application-forms": { gradient: "from-blue-500 to-cyan-600", Icon: FileText },
  "merit-listing": { gradient: "from-orange-500 to-rose-600", Icon: Trophy },
  "admit-students": { gradient: "from-rose-500 to-pink-600", Icon: ArrowRightLeft },
};

type Props = {
  name: IllustrationName;
  /** When set, a real image is shown instead of the themed SVG. */
  image?: string | null;
  alt?: string;
  className?: string;
};

export default function CardIllustration({ name, image, alt, className }: Props) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt ?? name}
        className={cn(
          "h-full w-full object-cover opacity-95 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100",
          className,
        )}
      />
    );
  }

  const theme = THEMES[name];
  const Icon = theme.Icon;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        theme.gradient,
        className,
      )}
      role="img"
      aria-label={alt ?? name}
    >
      {/* decorative shapes */}
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-black/10" />
      <div className="pointer-events-none absolute right-6 bottom-3 h-10 w-10 rotate-12 rounded-lg bg-white/10" />
      <Icon
        className="relative h-12 w-12 text-white/95 drop-shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
        strokeWidth={1.5}
      />
    </div>
  );
}
