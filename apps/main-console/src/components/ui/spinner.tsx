import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }[size];

  return (
    <div
      className={cn("inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent", sizeClass, className)}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
} 