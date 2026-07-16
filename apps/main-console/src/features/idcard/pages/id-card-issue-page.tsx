import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Eye, History as HistoryIcon, Printer, ScanLine, Trash2, User } from "lucide-react";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { fetchStudentByUid } from "@/services/student";
import axiosInstance from "@/utils/api";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";
import { AcademicYearSelector } from "@/components/academic-year";
import { cn } from "@/lib/utils";

import {
  createIssue,
  deleteIssue,
  fetchIssueFrontBlob,
  fetchIssuePhotoBlob,
  fetchTemplateBacksideBlob,
  fetchTemplateImageBlob,
  getStudentIdCardValidity,
  getTemplate,
  listIssues,
  listTemplates,
} from "../api/idcard-api";
import WebcamCaptureDialog from "../components/webcam-capture-dialog";
import { IdCardPageHeader } from "../components/page-header";
import { IdCardFieldKey, IdCardIssue, IdCardIssueStatus, IdCardTemplate } from "../types";

type StudentInfo = {
  id: number;
  uid: string;
  name: string | null;
  course: string | null;
  mobile: string | null;
  bloodGroup: string | null;
  rfidNumber: string | null;
  sportsQuota: string | null;
  quotaType: string | null;
  /** Full quota label for the details panel: "Name (Short Name)". */
  quotaTypeLabel: string | null;
  section: string | null;
  classRollNumber: string | null;
  emergencyPhone: string | null;
  /** Relation of the emergency contact (e.g. Father), shown after the number. */
  emergencyRelation: string | null;
  shift: string | null;
};

const TEXT_FIELDS: IdCardFieldKey[] = [
  "NAME",
  "COURSE",
  "UID",
  "MOBILE",
  "BLOOD_GROUP",
  "SPORTS_QUOTA",
  "SHIFT",
  "VALID_TILL_DATE",
];

// Per-field font size at the canonical 638x1004 canvas. Each entry is the
// pixel size we draw the bold text at.
const FIELD_FONT_PX: Record<IdCardFieldKey, number> = {
  NAME: 28,
  COURSE: 26,
  UID: 30,
  MOBILE: 24,
  BLOOD_GROUP: 26,
  SPORTS_QUOTA: 26,
  SHIFT: 24,
  VALID_TILL_DATE: 20,
  QRCODE: 0,
  PHOTO: 0,
};

// Gap (px, at the 638x1004 canvas) between the end of the COURSE text and the
// SHIFT text, which is rendered inline right after the course name.
const SHIFT_GAP_PX = 6;

const STATUS_REMARKS: Record<IdCardIssueStatus, string> = {
  ISSUED: "First card issued",
  RENEWED: "Renewed the card.",
  REISSUED: "Reissued due to lost/update card",
};

function valueForField(key: IdCardFieldKey, student: StudentInfo, validTill: string): string {
  switch (key) {
    case "NAME":
      return student.name ?? "";
    case "COURSE":
      return student.course ?? "";
    case "UID":
      return student.uid ?? "";
    case "MOBILE":
      // Card "MOBILE" field shows the emergency contact number, not the student's own.
      return student.emergencyPhone ?? student.mobile ?? "";
    case "BLOOD_GROUP":
      return student.bloodGroup ?? "";
    case "SPORTS_QUOTA":
      return student.sportsQuota ?? student.quotaType ?? "";
    case "SHIFT":
      return student.shift ?? "";
    case "VALID_TILL_DATE":
      return validTill ? `Valid Till: ${validTill}` : "";
    default:
      return "";
  }
}

// First value that is a non-empty (trimmed) string, else null. Used so an empty
// short name "" falls through to the full name (?? would keep the empty string).
function pickText(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return null;
}

function extractStudentInfo(raw: any): StudentInfo {
  return {
    id: raw?.id ?? 0,
    uid: raw?.uid ?? "",
    name: raw?.user?.name ?? raw?.name ?? null,
    // Prefer the program-course short name; fall back to the full name when the
    // short name is not provided (null or empty).
    course: pickText(
      raw?.programCourse?.shortName,
      raw?.programCourse?.course?.shortName,
      raw?.programCourse?.name,
      raw?.programCourse?.course?.name,
    ),
    mobile:
      raw?.user?.phone ?? raw?.person?.phone ?? raw?.admissionGeneralInfo?.mobileNumber ?? null,
    bloodGroup:
      raw?.bloodGroup ?? raw?.health?.bloodGroup?.type ?? raw?.health?.bloodGroup?.name ?? null,
    rfidNumber: raw?.rfidNumber ?? null,
    sportsQuota: raw?.sportsInfo?.[0]?.sportsCategory?.name ?? null,
    // Backend only returns quotaType when the quota type is flagged to print on
    // the ID card (already resolved to short/full name); null means don't show.
    quotaType: raw?.quotaType ?? null,
    // Full label "Name (Short Name)" for the details panel (not gated).
    quotaTypeLabel: raw?.quotaTypeLabel ?? null,
    section: raw?.section?.name ?? null,
    classRollNumber: raw?.classRollNumber ?? raw?.rollNumber ?? null,
    shift:
      raw?.currentPromotion?.shift?.name ?? raw?.promotion?.shift?.name ?? raw?.shift?.name ?? null,
    // Filled in after lookup from the emergency-contact endpoint.
    emergencyPhone: null,
    emergencyRelation: null,
  };
}

// ISO (yyyy-mm-dd) <-> display (dd-mm-yyyy) helpers. The card draws / the UI
// shows dd-mm-yyyy; the issue.validTill date column is persisted as ISO.
const isoToDisplay = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
};
const displayToIso = (ddmmyyyy: string): string | null => {
  const [d, m, y] = ddmmyyyy.split("-");
  return d && m && y ? `${y}-${m}-${d}` : null;
};

export default function IdCardIssuePage() {
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);
  const academicYearId = currentAcademicYear?.id;

  const [uidQuery, setUidQuery] = useState("");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [rfid, setRfid] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [issueStatus, setIssueStatus] = useState<IdCardIssueStatus>("ISSUED");
  const [remarks, setRemarks] = useState<string>(STATUS_REMARKS.ISSUED);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [composedPreview, setComposedPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showZoomedCard, setShowZoomedCard] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  // Validity: "PROGRAM" = auto (Sem-1 dateOfJoining + programCourse.duration),
  // "MANUAL" = operator-picked date. Both held/displayed as dd-mm-yyyy.
  const [validityMode, setValidityMode] = useState<"PROGRAM" | "MANUAL">("PROGRAM");
  const [manualValidTill, setManualValidTill] = useState<string>(""); // ISO yyyy-mm-dd from <input type=date>
  const [programValidTill, setProgramValidTill] = useState<string | null>(null); // dd-mm-yyyy
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedPhotoIssueIdRef = useRef<number | null>(null);
  const hasLocalPhotoOverrideRef = useRef(false);
  const latestLookupRequestRef = useRef(0);
  const prevTemplateAcademicYearIdRef = useRef<number | null | undefined>(undefined);
  const previewLoadInFlightRef = useRef(false);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);

  const applyComposedPreview = (blob: Blob) => {
    setComposedBlob(blob);
    setComposedPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  };

  // Auto "Program course" validity (dd-mm-yyyy) for the loaded student. This
  // also carries the student's registration academic year (the academic year
  // of the Sem-1 promotion's session) which drives template selection below.
  const validityQuery = useQuery({
    queryKey: ["idcard", "validity", student?.id],
    queryFn: () => (student ? getStudentIdCardValidity(student.id) : Promise.resolve(null)),
    enabled: !!student,
  });

  // Templates are filtered by the student's REGISTRATION academic year (the
  // academic year linked to the Sem-1 promotion's session), not the globally
  // selected academic year. Fall back to the selected year when the
  // registration year can't be determined (e.g. no Sem-1 promotion/session).
  const registrationAcademicYearId = validityQuery.data?.registrationAcademicYearId ?? null;
  const templateAcademicYearId = registrationAcademicYearId ?? academicYearId;

  const templatesQuery = useQuery({
    queryKey: ["idcard", "templates", { academicYearId: templateAcademicYearId }],
    queryFn: () =>
      listTemplates({
        academicYearId: templateAcademicYearId,
        limit: 100,
        includeDisabled: false,
      }),
    enabled: !!templateAcademicYearId,
  });
  const templates = templatesQuery.data?.rows ?? [];

  // The listing returns templates without their fields[] — fetch the detail
  // for the selected one so the composer has coordinates to render.
  const activeTemplateQuery = useQuery({
    queryKey: ["idcard", "template-detail", templateId],
    queryFn: () => (templateId ? getTemplate(templateId) : null),
    enabled: !!templateId,
  });
  const templateWithFields: IdCardTemplate | null = activeTemplateQuery.data ?? null;
  const templateFieldsReady = (templateWithFields?.fields?.length ?? 0) > 0;
  const activeTemplate: IdCardTemplate | null =
    templateWithFields ?? templates.find((t) => t.id === templateId) ?? null;

  // When the template academic year actually changes, re-pick the default template.
  useEffect(() => {
    if (templateAcademicYearId == null) return;
    if (student && validityQuery.isLoading) return;
    if (prevTemplateAcademicYearIdRef.current === templateAcademicYearId) return;
    prevTemplateAcademicYearIdRef.current = templateAcademicYearId;
    setTemplateId(null);
    loadedPhotoIssueIdRef.current = null;
    setShowBack(false);
    if (!student) {
      setComposedBlob(null);
      setComposedPreview((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [templateAcademicYearId, student, validityQuery.isLoading]);

  useEffect(() => {
    if (!templateId && templates.length > 0) {
      const defaultTpl = templates.find((t) => t.isDefault) ?? templates[0];
      if (defaultTpl) setTemplateId(defaultTpl.id);
    }
  }, [templates, templateId]);

  useEffect(() => {
    setProgramValidTill(validityQuery.data?.validTill ?? null);
  }, [validityQuery.data?.validTill]);

  // The dd-mm-yyyy value drawn on the card / shown in the UI.
  const validTillDisplay =
    validityMode === "MANUAL"
      ? manualValidTill
        ? isoToDisplay(manualValidTill)
        : ""
      : (programValidTill ?? "");
  const activeValidTill = validTillDisplay;

  const historyQuery = useQuery({
    queryKey: ["idcard", "issues", { studentId: student?.id }],
    queryFn: () =>
      student
        ? listIssues({ studentId: student.id, limit: 50 })
        : Promise.resolve({ rows: [], total: 0, page: 1, limit: 50 }),
    enabled: !!student,
  });
  const priorIssues = historyQuery.data?.rows ?? [];
  const hasExistingIdCard = priorIssues.length > 0;

  useEffect(() => {
    if (!student) return;
    const newStatus: IdCardIssueStatus = hasExistingIdCard ? "REISSUED" : "ISSUED";
    setIssueStatus(newStatus);
    setRemarks(STATUS_REMARKS[newStatus]);
  }, [hasExistingIdCard, student]);

  const setStatusAndRemarks = (s: IdCardIssueStatus) => {
    setIssueStatus(s);
    setRemarks(STATUS_REMARKS[s]);
  };

  const resetCompositionState = () => {
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setComposedPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoBlob(null);
    setComposedBlob(null);
    loadedPhotoIssueIdRef.current = null;
    hasLocalPhotoOverrideRef.current = false;
  };

  const lookupMutation = useMutation({
    mutationFn: async (q: string) => fetchStudentByUid(q.trim()),
  });

  const handleLoadStudent = async () => {
    const q = uidQuery.trim();
    if (!q) return;
    const requestId = ++latestLookupRequestRef.current;
    try {
      const data = await lookupMutation.mutateAsync(q);
      if (requestId !== latestLookupRequestRef.current) return;

      const info = extractStudentInfo(data);
      if (!info.id) {
        toast.error("No student matched.");
        return;
      }

      const isSameStudent = student?.id === info.id;
      setStudent(info);
      setRfid(info.rfidNumber ?? "");

      if (!isSameStudent) {
        resetCompositionState();
        setValidityMode("PROGRAM");
        setManualValidTill("");
        setProgramValidTill(null);
      } else {
        loadedPhotoIssueIdRef.current = null;
      }

      const [healthRes, emRes] = await Promise.allSettled([
        axiosInstance.get(`/api/health/student/${info.id}`),
        axiosInstance.get(`/api/emergency-contact/student/${info.id}`),
      ]);
      if (requestId !== latestLookupRequestRef.current) return;

      const health = healthRes.status === "fulfilled" ? healthRes.value.data?.payload : null;
      const bloodGroup = health?.bloodGroup?.type ?? health?.bloodGroup?.name ?? null;
      const emPayload = emRes.status === "fulfilled" ? emRes.value.data?.payload : null;
      const emergencyPhone = emPayload?.phone ?? null;
      const emergencyRelation = emPayload?.havingRelationAs ?? null;
      setStudent((prev) =>
        prev && prev.id === info.id
          ? {
              ...prev,
              bloodGroup: bloodGroup ?? prev.bloodGroup,
              emergencyPhone,
              emergencyRelation,
            }
          : prev,
      );

      if (isSameStudent) {
        await Promise.all([validityQuery.refetch(), historyQuery.refetch()]);
      }
    } catch {
      if (requestId !== latestLookupRequestRef.current) return;
      toast.error("Lookup failed. Verify the UID.");
    }
  };

  const handleCapture = (full: Blob, cropped: Blob) => {
    loadedPhotoIssueIdRef.current = null;
    hasLocalPhotoOverrideRef.current = true;
    setComposedBlob(null);
    setComposedPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoBlob(cropped);
    setPhotoPreviewUrl(URL.createObjectURL(cropped));
    void full;
  };

  const handleUpload = (file: File) => {
    loadedPhotoIssueIdRef.current = null;
    hasLocalPhotoOverrideRef.current = true;
    setComposedBlob(null);
    setComposedPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoBlob(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  // Draw the full card (template bg + photo + fields + QR) for a given photo onto
  // the given canvas and return it as a PNG blob. Pure renderer — no state writes,
  // so it's reused both for the live composer and the read-only history viewer.
  const renderCard = async (
    photoSource: Blob,
    canvas: HTMLCanvasElement,
    template: IdCardTemplate,
    studentInfo: StudentInfo,
    validTill: string,
  ): Promise<Blob | null> => {
    if (!template.fields?.length) return null;
    canvas.width = template.canvasWidthPx;
    canvas.height = template.canvasHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Ensure fonts are loaded before drawing text — otherwise the first compose
    // can paint the (black) text with an unready font, leaving it invisible.
    try {
      await document.fonts?.ready;
      await document.fonts?.load?.("bold 1em Calibri");
    } catch {
      /* fonts API unavailable — fall back to immediate draw */
    }

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    // Pull the template image through the authed backend proxy so the canvas
    // is never tainted by cross-origin S3 fetches.
    let bgUrl: string | null = null;
    let photoUrl: string | null = null;
    try {
      const bgBlob = await fetchTemplateImageBlob(template.id);
      bgUrl = URL.createObjectURL(bgBlob);
      const bg = await loadImg(bgUrl);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      photoUrl = URL.createObjectURL(photoSource);
      const photo = await loadImg(photoUrl);

      // SHIFT flows inline immediately after the COURSE text. Measure the
      // rendered course width so the shift anchor sits right after it (with a
      // small gap), regardless of how long the program-course name is.
      let shiftInlineAnchor: { x: number; y: number } | null = null;
      const courseField = (template.fields ?? []).find(
        (f) => f.fieldKey === "COURSE" && f.isVisible !== false,
      );
      if (courseField) {
        const courseText = valueForField("COURSE", studentInfo, validTill);
        if (courseText) {
          const cpx = courseField.fontSize ?? (FIELD_FONT_PX.COURSE || 22);
          ctx.font = `bold ${cpx}px Calibri`;
          const cw = ctx.measureText(courseText).width;
          const rightEdge =
            courseField.align === "CENTER"
              ? courseField.x + cw / 2
              : courseField.align === "RIGHT"
                ? courseField.x
                : courseField.x + cw;
          shiftInlineAnchor = { x: Math.round(rightEdge + SHIFT_GAP_PX), y: courseField.y };
        }
      }

      for (const field of template.fields ?? []) {
        if (field.isVisible === false) continue;

        if (field.fieldKey === "PHOTO") {
          const pw = field.width ?? 200;
          const ph = field.height ?? 250;
          // Aspect-fit the captured photo into the configured rect (centred,
          // crops overflow via clip).
          ctx.save();
          ctx.beginPath();
          ctx.rect(field.x, field.y, pw, ph);
          ctx.clip();
          const imgAspect = photo.width / photo.height;
          const boxAspect = pw / ph;
          let drawW: number;
          let drawH: number;
          let drawX: number;
          let drawY: number;
          if (imgAspect > boxAspect) {
            drawH = ph;
            drawW = ph * imgAspect;
            drawX = field.x - (drawW - pw) / 2;
            drawY = field.y;
          } else {
            drawW = pw;
            drawH = pw / imgAspect;
            drawX = field.x;
            drawY = field.y - (drawH - ph) / 2;
          }
          ctx.drawImage(photo, drawX, drawY, drawW, drawH);
          ctx.restore();
          continue;
        }

        if (field.fieldKey === "QRCODE") {
          // Prefer the per-field size set in the editor; fall back to the
          // template-level QR size, then a square default.
          const qrW = field.width || template.qrcodeSize || 80;
          const qrH = field.height || template.qrcodeHeight || qrW;
          const qrDataUrl = await QRCode.toDataURL(studentInfo.uid || "", {
            errorCorrectionLevel: "M",
            margin: 1,
            width: Math.max(qrW, qrH), // render at the larger dim, then scale to the box
          });
          const qrImg = await loadImg(qrDataUrl);
          ctx.drawImage(qrImg, field.x, field.y, qrW, qrH);
          continue;
        }

        if (TEXT_FIELDS.includes(field.fieldKey)) {
          const text = valueForField(field.fieldKey, studentInfo, validTill);
          if (!text) continue;
          const px = field.fontSize ?? (FIELD_FONT_PX[field.fieldKey] || 22);
          ctx.fillStyle = "#000000";
          ctx.font = `bold ${px}px Calibri`;
          ctx.textBaseline = "alphabetic";

          // SHIFT is anchored right after the COURSE text (inline) when course
          // is present; otherwise it falls back to its own saved coordinates.
          let drawX = field.x;
          let drawY = field.y;
          let alignVal: CanvasTextAlign =
            field.align === "CENTER" ? "center" : field.align === "RIGHT" ? "right" : "left";
          if (field.fieldKey === "SHIFT" && shiftInlineAnchor) {
            drawX = shiftInlineAnchor.x;
            drawY = shiftInlineAnchor.y;
            alignVal = "left";
          }

          // (x) is the alignment anchor: left edge / centre / right edge of the text.
          ctx.textAlign = alignVal;
          ctx.fillText(text, drawX, drawY);
        }
      }

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 1),
      );
      return blob;
    } catch (err) {
      console.error("compose failed", err);
      toast.error("Failed to compose card. Check template image access.");
      return null;
    } finally {
      if (bgUrl) URL.revokeObjectURL(bgUrl);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    }
  };

  const compose = async () => {
    if (!templateWithFields?.fields?.length || !student || !photoBlob) {
      toast.error("Need student, template, and photo before composing.");
      return;
    }
    const ok = await composeFromPhoto(photoBlob, templateWithFields, student, activeValidTill);
    if (!ok) toast.error("Could not compose the card image.");
  };

  const isImageBlob = (blob: Blob) =>
    blob.size > 0 && (blob.type.startsWith("image/") || blob.type === "");

  const composeFromPhoto = async (
    photo: Blob,
    template: IdCardTemplate,
    studentInfo: StudentInfo,
    validTill: string,
  ): Promise<boolean> => {
    if (!template.fields?.length) return false;
    const blob = await renderCard(
      photo,
      canvasRef.current ?? document.createElement("canvas"),
      template,
      studentInfo,
      validTill,
    );
    if (!blob) return false;
    applyComposedPreview(blob);
    return true;
  };

  // Load the latest issue photo and compose it onto the active template so the
  // full card design (background, fields, QR) is always shown.
  const loadIssuePreview = async (
    issueId: number,
    issue: IdCardIssue | null | undefined,
    template: IdCardTemplate,
    studentInfo: StudentInfo,
    validTill: string,
  ): Promise<boolean> => {
    if (!template.fields?.length) return false;

    try {
      const photo = await fetchIssuePhotoBlob(issueId);
      if (!isImageBlob(photo)) return false;

      setPhotoBlob(photo);
      setPhotoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(photo);
      });
      loadedPhotoIssueIdRef.current = issueId;
      hasLocalPhotoOverrideRef.current = false;

      if (await composeFromPhoto(photo, template, studentInfo, validTill)) {
        return true;
      }
    } catch {
      // Fall through to stored front image below.
    }

    if (activeTemplateQuery.isLoading || activeTemplateQuery.isFetching) {
      return false;
    }

    try {
      const front = await fetchIssueFrontBlob(issueId);
      if (isImageBlob(front)) {
        applyComposedPreview(front);
        loadedPhotoIssueIdRef.current = issueId;
        hasLocalPhotoOverrideRef.current = false;
        return true;
      }
    } catch {
      if (issue?.frontImageUrl) {
        setComposedPreview((prev) => {
          if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return issue.frontImageUrl;
        });
        loadedPhotoIssueIdRef.current = issueId;
        hasLocalPhotoOverrideRef.current = false;
        void fetch(issue.frontImageUrl)
          .then((res) => res.blob())
          .then((front) => {
            if (isImageBlob(front)) setComposedBlob(front);
          })
          .catch(() => undefined);
        return true;
      }
    }

    return false;
  };

  // On a reissue / renewal, fetch the latest issue preview from S3 once the
  // template (with fields) is ready so the composer can render correctly.
  useEffect(() => {
    if (!student || isSaving) return;
    if (!templateFieldsReady || !templateWithFields) return;
    const recent = priorIssues[0];
    if (!recent?.id) return;
    if (!recent.photoImageKey && !recent.frontImageKey && !recent.frontImageUrl) return;
    if (loadedPhotoIssueIdRef.current === recent.id) return;
    if (hasLocalPhotoOverrideRef.current) return;
    if (previewLoadInFlightRef.current) return;

    let cancelled = false;
    previewLoadInFlightRef.current = true;
    setIsRefreshingPreview(true);

    void loadIssuePreview(recent.id, recent, templateWithFields, student, activeValidTill)
      .then((ok) => {
        if (!cancelled && !ok) loadedPhotoIssueIdRef.current = null;
      })
      .finally(() => {
        previewLoadInFlightRef.current = false;
        if (!cancelled) setIsRefreshingPreview(false);
      });

    return () => {
      cancelled = true;
      previewLoadInFlightRef.current = false;
      setIsRefreshingPreview(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    student?.id,
    priorIssues[0]?.id,
    isSaving,
    templateWithFields?.id,
    templateFieldsReady,
    activeValidTill,
  ]);

  // History viewer: compose a past issue's card (template + that issue's photo)
  // into a dialog. We only store the cropped photo, so the card is re-generated.
  const [viewCardOpen, setViewCardOpen] = useState(false);
  const [viewCardUrl, setViewCardUrl] = useState<string | null>(null);
  const [viewCardLoading, setViewCardLoading] = useState(false);
  const handleViewIssueCard = async (issue: IdCardIssue) => {
    if (!activeTemplate || !student) {
      toast.error("Load the student first.");
      return;
    }
    setViewCardOpen(true);
    setViewCardLoading(true);
    setViewCardUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const photo = await fetchIssuePhotoBlob(issue.id);
      if (!templateWithFields?.fields?.length) {
        toast.error("Template fields are not ready yet.");
        return;
      }
      const blob = await renderCard(
        photo,
        document.createElement("canvas"),
        templateWithFields,
        student,
        activeValidTill,
      );
      if (blob) setViewCardUrl(URL.createObjectURL(blob));
      else toast.error("Could not render this card.");
    } catch {
      toast.error("No photo stored for this issue.");
    } finally {
      setViewCardLoading(false);
    }
  };

  // Auto-compose once student + template fields + photo are all in.
  useEffect(() => {
    if (isSaving) return;
    if (!photoBlob || !templateFieldsReady || !templateWithFields || !student) return;
    void compose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photoBlob,
    templateWithFields?.id,
    templateFieldsReady,
    student?.id,
    activeValidTill,
    isSaving,
  ]);

  // Lazy-load the back-side image (proxied + authed) when the toggle is flipped.
  useEffect(() => {
    if (!showBack || !activeTemplate?.id) return;
    if (!activeTemplate.backsideImageKey) {
      toast.error("This template has no back-side image yet.");
      setShowBack(false);
      return;
    }
    let revoke: string | null = null;
    fetchTemplateBacksideBlob(activeTemplate.id)
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        revoke = u;
        setBackImageUrl(u);
      })
      .catch(() => {
        toast.error("Could not load back-side image.");
        setShowBack(false);
      });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
      setBackImageUrl(null);
    };
  }, [showBack, activeTemplate?.id, activeTemplate?.backsideImageKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!student || !templateId) throw new Error("Missing student or template.");
      if (!composedBlob) {
        throw new Error("Capture and compose the card first.");
      }
      // validTill column is a Postgres date → persist ISO (yyyy-mm-dd); the
      // dd-mm-yyyy form is what gets drawn on the card.
      const validTillIso = validTillDisplay ? displayToIso(validTillDisplay) : null;
      const payload = {
        studentId: student.id,
        templateId,
        issueStatus,
        rfidNumber: rfid.trim() || null,
        validFrom: null,
        validTill: validTillIso,
        nameSnapshot: student.name,
        courseSnapshot: student.course,
        mobileSnapshot: student.mobile,
        bloodGroupSnapshot: student.bloodGroup,
        sportsQuotaSnapshot: student.sportsQuota,
        uidSnapshot: student.uid,
        remarks: remarks.trim() || null,
      };
      return createIssue(payload, {
        frontImage: composedBlob,
        photoImage: photoBlob ?? undefined,
      });
    },
    onSuccess: async ({ id }: { id: number }) => {
      const refetchResult = await historyQuery.refetch();
      const savedIssue =
        refetchResult.data?.rows?.find((row) => row.id === id) ?? refetchResult.data?.rows?.[0];
      if (templateWithFields?.fields?.length && student) {
        await loadIssuePreview(id, savedIssue, templateWithFields, student, activeValidTill);
      }

      try {
        await Swal.fire({
          icon: "success",
          title: "Saved successfully",
          text: "ID card has been saved successfully.",
          confirmButtonColor: "#2563eb",
        });
      } finally {
        setIsSaving(false);
      }
    },
    onError: async (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Could not save the ID card.";
      try {
        await Swal.fire({
          icon: "error",
          title: "Save failed",
          text: msg,
          confirmButtonColor: "#2563eb",
        });
      } finally {
        setIsSaving(false);
      }
    },
  });

  const saveDisabled = !composedBlob || isSaving || saveMutation.isLoading;

  const handleSaveIdCard = () => {
    if (saveDisabled) return;
    flushSync(() => setIsSaving(true));
    saveMutation.mutate();
  };

  const deleteIssueMutation = useMutation({
    mutationFn: (id: number) => deleteIssue(id),
    onSuccess: () => {
      toast.success("Issue removed.");
      void historyQuery.refetch();
    },
    onError: () => toast.error("Could not delete that issue."),
  });

  const handleDeleteIssue = async (issue: IdCardIssue) => {
    await Swal.fire({
      title: "Delete this issue record?",
      text: "This ID card issue will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deleteIssueMutation.mutateAsync(issue.id);
        } catch {
          Swal.showValidationMessage("Could not delete that issue.");
        }
      },
    });
  };

  const printComposedCard = () => {
    if (!composedPreview || showBack) return;
    // Set @page to a CR80 ID-card-sized portrait sheet (54 × 86 mm) so Chrome
    // forces portrait orientation and gives a card-sized PDF/print regardless
    // of the user's saved "Layout" preference in the print dialog. Image fills
    // the page exactly, so the card prints undistorted on CR80 stock or as a
    // small portrait PDF.
    const w = window.open("", "_blank", "width=638,height=1004");
    if (!w) return;
    const html = [
      "<!doctype html>",
      "<html>",
      "<head>",
      "<title>Print ID Card</title>",
      "<style>",
      "@page { size: 54mm 86mm; margin: 0; }",
      "html, body { width: 54mm; height: 86mm; margin: 0; padding: 0; background: #fff; }",
      "body { overflow: hidden; }",
      "img { width: 54mm; height: 86mm; display: block; margin: 0; padding: 0; }",
      "</style>",
      "</head>",
      "<body>",
      `<img src="${composedPreview}" alt="ID Card" onload="window.focus();window.print();setTimeout(()=>window.close(),250);" />`,
      "</body>",
      "</html>",
    ].join("");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const capturedLabel = photoPreviewUrl
    ? "Change Photo"
    : hasExistingIdCard
      ? "Retake Photo"
      : "Capture Photo";

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={ScanLine}
        title="Issue / Reissue ID Card"
        subtitle="Search a student, capture the photo, compose the card and save."
        actions={<AcademicYearSelector className="w-56" showLabel={false} />}
      />

      {/* UID search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Enter the UID</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter student UID or code number"
              value={uidQuery}
              inputMode="numeric"
              onChange={(e) => setUidQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && uidQuery.trim()) void handleLoadStudent();
              }}
            />
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              onClick={() => void handleLoadStudent()}
              disabled={!uidQuery.trim() || lookupMutation.isLoading}
            >
              {lookupMutation.isLoading ? "Loading…" : "Load"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {student && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left column 66% — Personal Details */}
          <Card className="bg-blue-50 rounded-xl shadow-md w-full lg:w-2/3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="w-10" />
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" /> Personal Details
              </CardTitle>
              <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <HistoryIcon className="h-4 w-4" /> History
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[420px] sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>ID Card Issue History</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3 max-h-[80vh] overflow-y-auto">
                    {priorIssues.length === 0 && (
                      <p className="text-sm text-gray-500">No ID card issue history.</p>
                    )}
                    {priorIssues.map((it: IdCardIssue, idx: number) => (
                      <div key={it.id} className="border rounded-md p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold">
                            #{priorIssues.length - idx} Type: {it.issueStatus}
                          </div>
                          <div className="flex gap-1">
                            {it.photoImageKey && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600"
                                title="View ID card"
                                onClick={() => void handleViewIssueCard(it)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => void handleDeleteIssue(it)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">Remarks: {it.remarks ?? "—"}</div>
                        <div className="text-xs text-gray-600">
                          Date:{" "}
                          {it.issueDate
                            ? (() => {
                                // The DB column is PG `timestamp without time zone`
                                // storing IST wall-clock (server tz). Drizzle serializes
                                // it with a MISLEADING trailing 'Z' (e.g. "…T22:19:00Z"
                                // actually means 22:19 IST, not UTC). So we must NOT shift
                                // it: read the literal wall-clock by formatting in UTC.
                                // Normalize any naive string to 'Z' first.
                                const s = it.issueDate;
                                const d = new Date(
                                  s.endsWith("Z") || s.includes("+")
                                    ? s
                                    : s.replace(" ", "T") + "Z",
                                );
                                return d.toLocaleString("en-IN", {
                                  timeZone: "UTC",
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                });
                              })()
                            : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog
                open={viewCardOpen}
                onOpenChange={(o) => {
                  setViewCardOpen(o);
                  if (!o)
                    setViewCardUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                }}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>ID Card</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center min-h-[260px]">
                    {viewCardLoading ? (
                      <p className="text-sm text-gray-500">Generating card…</p>
                    ) : viewCardUrl ? (
                      <img
                        src={viewCardUrl}
                        alt="ID Card"
                        className="max-h-[70vh] w-auto rounded-md border"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No card image available.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <DetailRow label="Student Name" value={student.name ?? "-"} />
                <DetailRow label="Course" value={student.course ?? "-"} />
                <DetailRow label="Shift" value={student.shift ?? "-"} />
                <DetailRow label="Blood Group" value={student.bloodGroup ?? "-"} />
                <DetailRow
                  label="Quota Type"
                  value={student.quotaTypeLabel ?? student.sportsQuota ?? "-"}
                />
                <DetailRow
                  label="Emergency Phone"
                  value={
                    student.emergencyPhone
                      ? student.emergencyRelation
                        ? `${student.emergencyPhone} (${student.emergencyRelation})`
                        : student.emergencyPhone
                      : "-"
                  }
                />
              </div>

              <div className="flex flex-wrap items-end gap-3 pt-2">
                <div>
                  <Label htmlFor="rfid" className="font-semibold">
                    RFID:
                  </Label>
                  <Input
                    id="rfid"
                    value={rfid}
                    onChange={(e) => setRfid(e.target.value)}
                    placeholder="Enter RFID"
                    className="w-48 bg-white"
                  />
                </div>
                <div className="text-xs text-gray-600 self-end pb-1">
                  Template:{" "}
                  <span className="font-medium text-gray-800">{activeTemplate?.name ?? "—"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 pt-2">
                <div>
                  <Label className="font-semibold">Validity</Label>
                  <Select
                    value={validityMode}
                    onValueChange={(v) => setValidityMode(v as "PROGRAM" | "MANUAL")}
                  >
                    <SelectTrigger className="w-56 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROGRAM">Program course (auto)</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {validityMode === "MANUAL" ? (
                  <div>
                    <Label className="font-semibold">Valid Till</Label>
                    <Input
                      type="date"
                      value={manualValidTill}
                      onChange={(e) => setManualValidTill(e.target.value)}
                      className="w-48 bg-white"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 self-end pb-2">
                    Valid till{" "}
                    <span className="font-medium text-gray-800">
                      {validityQuery.isLoading ? "…" : (programValidTill ?? "Not available")}
                    </span>
                  </div>
                )}
              </div>

              {hasExistingIdCard && (
                <div className="bg-white rounded-md p-4 mt-3 space-y-3">
                  <div>
                    <Label className="font-semibold">Type</Label>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox id="t-issued" checked={issueStatus === "ISSUED"} disabled />
                        ISSUED
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          id="t-renewed"
                          checked={issueStatus === "RENEWED"}
                          onCheckedChange={(c) => c && setStatusAndRemarks("RENEWED")}
                        />
                        RENEWED
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          id="t-reissued"
                          checked={issueStatus === "REISSUED"}
                          onCheckedChange={(c) => c && setStatusAndRemarks("REISSUED")}
                        />
                        REISSUED
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Remarks</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                      rows={2}
                    />
                  </div>
                  <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2">
                    <strong>Note:</strong> This student already has an ID card issued. You can
                    select "RENEWED" or "REISSUED" type and add appropriate remarks.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column 34% — Generated ID Card */}
          <Card className="rounded-xl shadow-md w-full lg:w-1/3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Generated ID Card</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBack((v) => !v)}
                disabled={!activeTemplate?.backsideImageKey && !activeTemplate?.backsideImageUrl}
                title={
                  activeTemplate?.backsideImageKey || activeTemplate?.backsideImageUrl
                    ? undefined
                    : "Upload a back-side image on this template first."
                }
              >
                {showBack ? "Show Front" : "Show Back"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={() => {
                  if (showBack) {
                    if (backImageUrl || activeTemplate?.backsideImageUrl) setShowZoomedCard(true);
                  } else if (composedPreview || activeTemplate?.templateImageUrl) {
                    setShowZoomedCard(true);
                  }
                }}
                className="w-full h-[420px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in p-2"
              >
                {showBack ? (
                  // Back side: prefer the auth-proxy blob if loaded, fall back
                  // to the presigned URL from the listing.
                  backImageUrl ? (
                    <img
                      src={backImageUrl}
                      alt="back of card"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : activeTemplate?.backsideImageUrl ? (
                    <img
                      src={activeTemplate.backsideImageUrl}
                      alt="back of card"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm text-gray-400 px-4 text-center">
                      No back-side image uploaded for this template.
                    </span>
                  )
                ) : composedPreview ? (
                  <img
                    src={composedPreview}
                    alt="generated card"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : priorIssues[0]?.frontImageUrl ? (
                  <img
                    src={priorIssues[0].frontImageUrl}
                    alt="latest saved card"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : isRefreshingPreview || activeTemplateQuery.isLoading ? (
                  <span className="text-sm text-gray-500 px-4 text-center">
                    Refreshing card preview…
                  </span>
                ) : activeTemplate?.templateImageUrl ? (
                  <img
                    src={activeTemplate.templateImageUrl}
                    alt={`${activeTemplate.name} front`}
                    className="max-h-full max-w-full object-contain opacity-90"
                  />
                ) : (
                  <span className="text-sm text-gray-400 px-4 text-center">
                    No ID card template configured for this academic year yet.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  onClick={() => setShowCamera(true)}
                  disabled={showBack}
                >
                  <Camera className="h-4 w-4 mr-1" /> {capturedLabel}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={printComposedCard}
                  disabled={!composedPreview || showBack}
                >
                  <Printer className="h-4 w-4 mr-1" /> Print ID Card
                </Button>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />

              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full border-0 !text-white",
                  saveDisabled
                    ? "pointer-events-none cursor-not-allowed !bg-blue-400 !opacity-70 hover:!bg-blue-400"
                    : "!bg-blue-600 hover:!bg-blue-700",
                )}
                disabled={saveDisabled}
                aria-disabled={saveDisabled}
                onClick={handleSaveIdCard}
              >
                {isSaving || saveMutation.isLoading ? "Saving…" : "Save ID Card"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <WebcamCaptureDialog
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
      />

      <Dialog open={showZoomedCard} onOpenChange={setShowZoomedCard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Zoomed ID Card Preview ({showBack ? "Back" : "Front"})
            </DialogTitle>
          </DialogHeader>
          {showBack ? (
            backImageUrl ? (
              <img
                src={backImageUrl}
                alt="zoomed back"
                className="mx-auto max-h-[80vh] object-contain rounded-md border"
              />
            ) : activeTemplate?.backsideImageUrl ? (
              <img
                src={activeTemplate.backsideImageUrl}
                alt="zoomed back"
                className="mx-auto max-h-[80vh] object-contain rounded-md border"
              />
            ) : null
          ) : composedPreview ? (
            <img
              src={composedPreview}
              alt="zoomed card"
              className="mx-auto max-h-[80vh] object-contain rounded-md border"
            />
          ) : activeTemplate?.templateImageUrl ? (
            <img
              src={activeTemplate.templateImageUrl}
              alt="zoomed front template"
              className="mx-auto max-h-[80vh] object-contain rounded-md border"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-48 font-semibold text-left mr-4">{label}</span>
      <span>{value}</span>
    </div>
  );
}
