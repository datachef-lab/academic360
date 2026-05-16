"use client";

import {
  type CpCertificateFieldDisplay,
  normalizeCpFieldForDisplay,
  resolveDescriptionFontSize,
  resolveFieldFontSize,
} from "@/lib/career-progression-form-utils";

type CertificateFieldLabelProps = {
  field: CpCertificateFieldDisplay & { name: string };
  className?: string;
  showRequired?: boolean;
  required?: boolean;
};

export function CertificateFieldLabel({
  field,
  className,
  showRequired = true,
  required,
}: CertificateFieldLabelProps) {
  const normalized = normalizeCpFieldForDisplay(field);
  const fieldPx = resolveFieldFontSize(normalized.fieldFontSize);
  const descPx = resolveDescriptionFontSize(normalized.descriptionFontSize);
  const description =
    typeof normalized.description === "string" ? normalized.description.trim() : "";
  const isRequired = required ?? Boolean(normalized.isRequired);

  return (
    <div className={className}>
      <p className="font-semibold leading-snug text-slate-800" style={{ fontSize: fieldPx }}>
        {normalized.name}
        {showRequired && isRequired ? <span className="ml-1 text-red-600">*</span> : null}
      </p>
      {description ? (
        <p className="mt-1.5 leading-relaxed text-slate-500" style={{ fontSize: descPx }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
