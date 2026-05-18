import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

const TOOLBAR_MODULES = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

type CertificateFieldHtmlEditorProps = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  fontSizePx?: number;
  className?: string;
};

export function CertificateFieldHtmlEditor({
  id,
  value,
  onChange,
  placeholder = "Helper text shown below the field name on the student career progression form",
  fontSizePx = 14,
  className,
}: CertificateFieldHtmlEditorProps) {
  const modules = useMemo(() => TOOLBAR_MODULES, []);

  return (
    <div
      id={id}
      className={cn("certificate-field-html-editor rounded-md border bg-white", className)}
      style={{ ["--cf-desc-font-size" as string]: `${fontSizePx}px` }}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
      />
    </div>
  );
}
