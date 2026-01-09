import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: ReactNode;
  variant?: "blue" | "green" | "orange" | "purple" | "red" | "teal" | "pink";
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

const variantStyles = {
  blue: {
    card: "bg-gradient-to-br from-blue-500 to-blue-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-blue-500/30",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-500 to-emerald-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-emerald-500/30",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-400 to-orange-500 ",
    icon: "bg-white/20 text-white shadow-lg shadow-orange-500/30",
  },
  purple: {
    card: "bg-gradient-to-br from-violet-500 to-violet-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-violet-500/30",
  },
  red: {
    card: "bg-gradient-to-br from-rose-500 to-rose-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-rose-500/30",
  },
  teal: {
    card: "bg-gradient-to-br from-teal-500 to-teal-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-teal-500/30",
  },
  pink: {
    card: "bg-gradient-to-br from-pink-500 to-pink-600 ",
    icon: "bg-white/20 text-white shadow-lg shadow-pink-500/30",
  },
};

export const StatCard = ({ title, value, subtitle, description, icon, variant = "blue", trend }: StatCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer",
        variantStyles[variant].card,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Data on the left */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {(subtitle || description) && <p className="text-sm text-white/60">{subtitle || description}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.isPositive ? "text-white/90" : "text-white/70")}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}% from last month
            </p>
          )}
        </div>

        {/* Icon on the right */}
        <div
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-2xl backdrop-blur-sm [&>svg]:w-7 [&>svg]:h-7",
            variantStyles[variant].icon,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
