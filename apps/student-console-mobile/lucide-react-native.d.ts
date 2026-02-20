declare module "lucide-react-native" {
  import type { ComponentType } from "react";

  export interface LucideProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  }

  export const Calendar: ComponentType<LucideProps>;
  export const Clock: ComponentType<LucideProps>;
  export const Download: ComponentType<LucideProps>;
  export const FileText: ComponentType<LucideProps>;
  export const GraduationCap: ComponentType<LucideProps>;
  export const History: ComponentType<LucideProps>;
  export const Eye: ComponentType<LucideProps>;
  export const User: ComponentType<LucideProps>;
  export const LogIn: ComponentType<LucideProps>;
  export const Moon: ComponentType<LucideProps>;
  export const Sun: ComponentType<LucideProps>;
  export const ChevronDown: ComponentType<LucideProps>;
  export const ChevronRightIcon: ComponentType<LucideProps>;
  export const Check: ComponentType<LucideProps>;
  export const ArrowDownToLineIcon: ComponentType<LucideProps>;
  export const ExternalLink: ComponentType<LucideProps>;
  export const Copy: ComponentType<LucideProps>;
  export const LogOutIcon: ComponentType<LucideProps>;
  export const AlertCircle: ComponentType<LucideProps>;
  export const Info: ComponentType<LucideProps>;
  export const Loader2: ComponentType<LucideProps>;
  export const BookOpen: ComponentType<LucideProps>;
  export const Home: ComponentType<LucideProps>;
  export const Upload: ComponentType<LucideProps>;
  export const ClipboardCheck: ComponentType<LucideProps>;
  export const FileTextIcon: ComponentType<LucideProps>;
  export const HouseIcon: ComponentType<LucideProps>;
  export const IndianRupeeIcon: ComponentType<LucideProps>;
  export const LibraryIcon: ComponentType<LucideProps>;
  export const Library: ComponentType<LucideProps>;
  export const Sparkles: ComponentType<LucideProps>;
  export type LucideIcon = ComponentType<LucideProps>;
}
