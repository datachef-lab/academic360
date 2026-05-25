import { Info } from "lucide-react";

type DomainCalloutProps = {
  title: string;
  children: React.ReactNode;
};

export function DomainCallout({ title, children }: DomainCalloutProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#e0e7ff] bg-[#f5f3ff] px-4 py-3 text-sm text-[#4338ca]">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold text-[#3730a3]">{title}</p>
        <div className="mt-1 text-xs leading-relaxed text-[#4f46e5]">{children}</div>
      </div>
    </div>
  );
}
