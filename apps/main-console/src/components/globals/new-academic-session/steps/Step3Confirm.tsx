import * as React from "react";
import type { NewAcademicSessionDraft } from "../types";
import { CheckCircle2 } from "lucide-react";

type Props = {
  draft: NewAcademicSessionDraft;
};

export function Step3Confirm({ draft }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Confirm session & promotion draft</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the draft below. This flow covers activating a new academic year or session and
          reviewing semester promotion. When you confirm, this wizard closes and the draft is
          cleared from this device.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-3 text-muted-foreground">Academic year</td>
              <td className="px-4 py-3 font-medium">{draft.academicYearLabel ?? "—"}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-muted-foreground">Year id</td>
              <td className="px-4 py-3 font-mono text-xs">{draft.academicYearId ?? "—"}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-muted-foreground">Promotion review</td>
              <td className="px-4 py-3">
                {draft.promotionDraft && Object.keys(draft.promotionDraft).length > 0
                  ? "Filters / range saved in draft"
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Confirming will clear the saved draft and close this dialog. Until then, all steps remain
          recoverable from the sidebar action.
        </p>
      </div>
    </div>
  );
}
