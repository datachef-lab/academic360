import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Document Issuance landing screen.
 *
 * The student search / issuance flow is still mock-data backed, so the home
 * screen shows an "under construction" notice instead. The working screens in
 * this module are reachable from the right-hand nav (Certificate Type,
 * Certificate Fields, Declaration Masters, Career Progression).
 */
const DocumentIssuanceHomePage = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Construction className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Document Issuance is under construction
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              This module is being built. In the meantime you can manage its masters from the panel
              on the right — Certificate Type, Certificate Fields and Declaration Masters are live.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentIssuanceHomePage;
