import { cn } from "@/lib/utils";
import { parseSemesterClassName } from "../utils/semester-display";

type SemesterClassLabelProps = {
  name: string;
  className?: string;
  numeralClassName?: string;
  /** Show only the Roman numeral badge (no "Semester" word) */
  numeralOnly?: boolean;
};

export function SemesterClassLabel({
  name,
  className,
  numeralClassName,
  numeralOnly = false,
}: SemesterClassLabelProps) {
  const { label, numeral } = parseSemesterClassName(name);

  if (numeralOnly && numeral) {
    return (
      <span
        className={cn(
          "inline-flex min-w-[1.75rem] items-center justify-center rounded-md bg-[#ede9fe] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#6d28d9]",
          numeralClassName,
          className,
        )}
      >
        {numeral}
      </span>
    );
  }

  if (!numeral) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex min-w-[1.75rem] items-center justify-center rounded-md bg-[#ede9fe] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#6d28d9]",
          numeralClassName,
        )}
      >
        {numeral}
      </span>
    </span>
  );
}
