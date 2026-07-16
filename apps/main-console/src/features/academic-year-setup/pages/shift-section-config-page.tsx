import { Card, CardContent } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";

export default function ShiftSectionConfigPage() {
  const currentYear = useAppSelector(selectCurrentAcademicYear);
  const m = String(currentYear?.year ?? "").match(/\d{4}/);
  const label = m ? `${m[0]}-${String(Number(m[0]) + 1).slice(-2)}` : "";

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">
            Shift - Section Config{label ? ` (${label})` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
