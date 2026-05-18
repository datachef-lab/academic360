"use client";

import {
  type CpCertificateFieldDisplay,
  normalizeCpFieldForDisplay,
  resolveDescriptionFontSize,
  resolveFieldFontSize,
} from "@/lib/career-progression-form-utils";
import {
  certificateFieldDescriptionDisplayHtml,
  isCertificateFieldDescriptionEmpty,
} from "@/lib/certificate-field-html";

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
  const descriptionHtml = certificateFieldDescriptionDisplayHtml(normalized.description);
  const showDescription = !isCertificateFieldDescriptionEmpty(normalized.description);
  const isRequired = required ?? Boolean(normalized.isRequired);

  return (
    <div className={className}>
      <p className="font-semibold leading-snug text-slate-800" style={{ fontSize: fieldPx }}>
        {normalized.name}
        {showRequired && isRequired ? <span className="ml-1 text-red-600">*</span> : null}
      </p>
      {showDescription ? (
        <div
          className="certificate-field-description-display mt-1.5 leading-relaxed text-slate-500 [&_a]:text-blue-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-1 [&_ul]:list-disc [&_ul]:pl-5"
          style={{ fontSize: descPx }}
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}
    </div>
  );
}
