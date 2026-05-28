import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  noPadding?: boolean;
};

export function DataPanel({
  title,
  description,
  children,
  headerRight,
  className,
  noPadding,
}: DataPanelProps) {
  return (
    <Card className={cn("overflow-hidden border border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {headerRight}
      </CardHeader>
      <CardContent className={cn(noPadding && "p-0", !noPadding && "p-4")}>{children}</CardContent>
    </Card>
  );
}
