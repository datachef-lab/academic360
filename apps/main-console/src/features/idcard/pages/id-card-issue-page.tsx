import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Eye, History as HistoryIcon, Printer, ScanLine, Trash2, User } from "lucide-react";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { toast } from "sonner";

import { UserAvatar } from "@/hooks/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
  checkRfid,
  createIssue,
  deleteIssue,
  fetchIssueFrontBlob,
  fetchIssuePhotoBlob,
  fetchTemplateBacksideBlob,
  fetchTemplateImageBlob,
  finalizeIssue,
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
  /** false when the student's user is inactive/suspended — an ID card cannot be issued. */
  isActive: boolean;
  /** Human-readable reason shown in the blocking banner when inactive. */
  inactiveReason: string | null;
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

const STATUS_REMARKS: Record<Exclude<IdCardIssueStatus, "DRAFT">, string> = {
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
    // Inactive = user deactivated OR suspended OR the student record is inactive.
    isActive:
      raw?.user?.isActive !== false && raw?.user?.isSuspended !== true && raw?.active !== false,
    inactiveReason:
      raw?.user?.isSuspended === true
        ? raw?.user?.suspendedReason
          ? `Suspended: ${raw.user.suspendedReason}`
          : "This student's account is suspended."
        : raw?.user?.isActive === false || raw?.active === false
          ? "This student's account is inactive."
          : null,
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
  const { user } = useAuth();

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
  // Print → draft → finalize flow.
  const [draftIssueId, setDraftIssueId] = useState<number | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  // Captured when the draft is created (print time) — shown as the issue time.
  const [preparedAt, setPreparedAt] = useState<Date | null>(null);
  const [showRfidDialog, setShowRfidDialog] = useState(false);
  const [rfidChecking, setRfidChecking] = useState(false);
  const [rfidConflict, setRfidConflict] = useState<{
    uid: string | null;
    name: string | null;
  } | null>(null);
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
  // DRAFT rows are transient (created at print, before the RFID is entered) and
  // must never count as an existing card or flip the ISSUED→REISSUED default.
  const priorIssues = (historyQuery.data?.rows ?? []).filter((r) => r.issueStatus !== "DRAFT");
  const hasExistingIdCard = priorIssues.length > 0;

  useEffect(() => {
    if (!student) return;
    const newStatus: Exclude<IdCardIssueStatus, "DRAFT"> = hasExistingIdCard
      ? "REISSUED"
      : "ISSUED";
    setIssueStatus(newStatus);
    setRemarks(STATUS_REMARKS[newStatus]);
  }, [hasExistingIdCard, student]);

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
      // RFID is always entered fresh in the finalize dialog — never pre-filled.
      setRfid("");
      // Reset any in-flight print/draft state from a previous student.
      setDraftIssueId(null);
      setShowRfidDialog(false);
      setRfidConflict(null);
      setIsSaving(false);
      setPreparedAt(null);

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
      // A missing image (template bg or photo not found in S3) just leaves the
      // preview empty — no error toast, per product decision.
      console.error("compose failed", err);
      return null;
    } finally {
      if (bgUrl) URL.revokeObjectURL(bgUrl);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    }
  };

  const compose = async () => {
    if (!templateWithFields?.fields?.length || !student || !photoBlob) return;
    // Silent on failure — the empty preview + disabled Print convey the state.
    await composeFromPhoto(photoBlob, templateWithFields, student, activeValidTill);
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

  // Read a friendly message from an axios/API error (RFID conflict comes back 409).
  const apiErrorMessage = (e: unknown, fallback: string): string => {
    const resp = (e as { response?: { data?: { message?: string } } })?.response;
    return resp?.data?.message || (e instanceof Error ? e.message : fallback);
  };

  // Shared create payload for the print/draft step.
  const buildIssuePayload = (status: IdCardIssueStatus) => {
    if (!student || !templateId) return null;
    // validTill column is a Postgres date → persist ISO (yyyy-mm-dd); the
    // dd-mm-yyyy form is what gets drawn on the card.
    const validTillIso = validTillDisplay ? displayToIso(validTillDisplay) : null;
    return {
      studentId: student.id,
      templateId,
      issueStatus: status,
      rfidNumber: null,
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
  };

  // Step 1 (on Print): create a DRAFT row — records printed_at / printed_by and
  // uploads the composed images. Replaces any prior open draft for this student.
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      if (!student || !templateId) throw new Error("Missing student or template.");
      if (!composedBlob) throw new Error("Capture and compose the card first.");
      const payload = buildIssuePayload("DRAFT");
      if (!payload) throw new Error("Missing student or template.");
      return createIssue(payload, {
        frontImage: composedBlob,
        photoImage: photoBlob ?? undefined,
      });
    },
    onSuccess: async ({ id }: { id: number }) => {
      setDraftIssueId(id);
      await historyQuery.refetch();
    },
  });

  // Step 2 (RFID dialog Save): finalize the draft — sets the real type, the rfid
  // and saved_at. RFID must be unique (checked live + re-validated server-side).
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!draftIssueId) throw new Error("No draft to save. Print the card first.");
      const value = rfid.trim();
      if (!value) throw new Error("RFID is required.");
      const finalStatus = (issueStatus === "DRAFT" ? "ISSUED" : issueStatus) as Exclude<
        IdCardIssueStatus,
        "DRAFT"
      >;
      return finalizeIssue(draftIssueId, {
        rfidNumber: value,
        issueStatus: finalStatus,
        remarks: remarks.trim() || null,
      });
    },
    onSuccess: async ({ id }: { id: number }) => {
      setShowRfidDialog(false);
      setDraftIssueId(null);
      const refetchResult = await historyQuery.refetch();
      const savedIssue =
        refetchResult.data?.rows?.find((row) => row.id === id) ?? refetchResult.data?.rows?.[0];
      if (templateWithFields?.fields?.length && student) {
        await loadIssuePreview(id, savedIssue, templateWithFields, student, activeValidTill);
      }
      setIsSaving(false);
      await Swal.fire({
        icon: "success",
        title: "Saved successfully",
        text: "ID card has been saved successfully.",
        confirmButtonColor: "#2563eb",
      });
    },
    onError: (e: unknown) => {
      // Keep the dialog open (Save-only) so the operator can correct the RFID.
      toast.error(apiErrorMessage(e, "Could not save the ID card."));
    },
  });

  // Live RFID uniqueness check while the finalize dialog is open (debounced).
  useEffect(() => {
    if (!showRfidDialog || !student) return;
    const value = rfid.trim();
    if (!value) {
      setRfidConflict(null);
      setRfidChecking(false);
      return;
    }
    let cancelled = false;
    setRfidChecking(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await checkRfid(value, student.id);
        if (!cancelled) setRfidConflict(res.available ? null : res.conflict);
      } catch {
        if (!cancelled) setRfidConflict(null);
      } finally {
        if (!cancelled) setRfidChecking(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [rfid, showRfidDialog, student]);

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

  // Open the print popup and, once it closes (print done or cancelled), open the
  // RFID dialog so the operator can enter the chip and save. If popups are
  // blocked we skip straight to the dialog (the draft is already created).
  const openPrintPopup = () => {
    if (!composedPreview) {
      setShowRfidDialog(true);
      return;
    }
    // Set @page to a CR80 ID-card-sized portrait sheet (54 × 86 mm) so Chrome
    // forces portrait orientation and gives a card-sized PDF/print regardless
    // of the user's saved "Layout" preference in the print dialog. Image fills
    // the page exactly, so the card prints undistorted on CR80 stock or as a
    // small portrait PDF.
    const w = window.open("", "_blank", "width=638,height=1004");
    if (!w) {
      // Popup blocked — the draft is already created, so go straight to save.
      setShowRfidDialog(true);
      return;
    }
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

    // The popup self-closes ~250 ms after the print dialog is dismissed (printed
    // or cancelled). Poll for that, then open the RFID dialog. A safety timeout
    // opens it regardless in case close-detection ever misses.
    let opened = false;
    const openDialogOnce = () => {
      if (opened) return;
      opened = true;
      setShowRfidDialog(true);
    };
    const poll = window.setInterval(() => {
      if (w.closed) {
        window.clearInterval(poll);
        openDialogOnce();
      }
    }, 300);
    window.setTimeout(() => {
      window.clearInterval(poll);
      openDialogOnce();
    }, 30000);
  };

  // Print button handler: block inactive students, create the DRAFT (records
  // printed_at / printed_by + uploads images), then run the print → RFID-dialog flow.
  const handlePrint = async () => {
    if (!composedPreview || showBack || !student) return;
    if (!student.isActive) {
      toast.error("This student is inactive — an ID card cannot be issued.");
      return;
    }
    if (!composedBlob) {
      toast.error("Capture and compose the card first.");
      return;
    }
    try {
      // Keep the preview-reload effect quiet through the whole print→save flow.
      setIsSaving(true);
      setIsCreatingDraft(true);
      await createDraftMutation.mutateAsync();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not prepare the card for printing."));
      setIsCreatingDraft(false);
      setIsSaving(false);
      return;
    }
    setIsCreatingDraft(false);
    setPreparedAt(new Date());
    setRfid(""); // always start the finalize dialog with a blank RFID
    setRfidConflict(null);
    openPrintPopup();
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
        actions={
          <div className="flex w-full min-w-[280px] gap-2 sm:w-[420px]">
            <Input
              autoFocus
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
        }
      />

      {student && (
        <div className="flex flex-col gap-4">
          {!student.isActive && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span>
                <strong>Inactive student.</strong>{" "}
                {student.inactiveReason ?? "This student's account is inactive."} An ID card cannot
                be issued for an inactive student.
              </span>
            </div>
          )}
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
                    <Button
                      size="sm"
                      className="relative gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <HistoryIcon className="h-4 w-4" /> History
                      {priorIssues.length > 0 && (
                        <span
                          className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white shadow"
                          title={`${priorIssues.length} ID card${priorIssues.length === 1 ? "" : "s"} issued`}
                        >
                          {priorIssues.length}
                        </span>
                      )}
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
                      {priorIssues.map((it: IdCardIssue) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-2 rounded-md border bg-white p-3"
                        >
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold tabular-nums">
                                {it.rfidNumber ?? "—"}
                              </span>
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
                                {it.issueStatus}
                              </span>
                              {it.legacyIssueId != null && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                                  Legacy
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                user={{
                                  name: it.issuedBy?.name || undefined,
                                  image: it.issuedBy?.image || undefined,
                                }}
                                size="sm"
                                className="h-9 w-9 text-[11px] drop-shadow-none"
                              />
                              <div className="flex min-w-0 flex-col leading-tight">
                                <span className="truncate text-xs font-medium text-gray-800">
                                  {it.issuedBy?.name ?? "—"}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {formatDbStampIst(it.savedAt ?? it.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
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
                    onClick={handlePrint}
                    disabled={
                      !composedPreview ||
                      showBack ||
                      !student?.isActive ||
                      isCreatingDraft ||
                      createDraftMutation.isLoading
                    }
                  >
                    <Printer className="h-4 w-4 mr-1" />{" "}
                    {isCreatingDraft || createDraftMutation.isLoading
                      ? "Preparing…"
                      : "Print & Save"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Printing saves a draft, then asks for the RFID to finalize the card.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <WebcamCaptureDialog
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
      />

      {/* Post-print finalize dialog — non-dismissable; the card is only saved
          (draft → real issue) when a unique RFID is entered here. */}
      <Dialog open={showRfidDialog} onOpenChange={() => {}}>
        <DialogContent
          className="h-[90vh] w-[87vw] max-w-[87vw] overflow-hidden !flex flex-row !gap-0 !p-0 [&>button]:hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Left — RFID tap illustration, spans the FULL dialog height (footer excludes it). */}
          <div className="relative hidden h-full w-[26%] shrink-0 bg-gradient-to-b from-indigo-50 to-slate-100 md:block">
            <img
              src="/rfid-scan-illustration-2.png"
              alt="Tap the RFID card on the reader"
              className="h-full w-full object-cover"
            />
            {/* subtle backdrop tint over the illustration */}
            <div className="pointer-events-none absolute inset-0 bg-indigo-900/10" />
          </div>

          {/* Right side — the details/card grid, then the footer beneath them only. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              {/* Middle — title + all details + RFID/type table */}
              <div className="flex min-h-0 flex-1 flex-col p-6">
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
                  <DialogHeader className="text-left">
                    <DialogTitle>Save ID Card</DialogTitle>
                  </DialogHeader>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review the details, enter the RFID and choose the type to finalize the card.
                  </p>
                  <table className="mt-4 w-full border-collapse text-sm">
                    <tbody>
                      {(
                        [
                          ["Student", student?.name ?? "-"],
                          ["UID", student?.uid ?? "-"],
                          ["Course", student?.course ?? "-"],
                          ["Shift", student?.shift ?? "-"],
                          ["Blood Group", student?.bloodGroup ?? "-"],
                          ["Quota Type", student?.quotaTypeLabel ?? student?.sportsQuota ?? "-"],
                          [
                            "Emergency Phone",
                            student?.emergencyPhone
                              ? student?.emergencyRelation
                                ? `${student.emergencyPhone} (${student.emergencyRelation})`
                                : student.emergencyPhone
                              : "-",
                          ],
                          ["Valid Till", activeValidTill || "-"],
                        ] as [string, string][]
                      ).map(([k, v]) => (
                        <tr key={k}>
                          <td className="whitespace-nowrap border border-gray-300 bg-gray-50 px-3 py-2 align-middle font-semibold text-gray-600">
                            {k}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top text-gray-900">
                            {v}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="whitespace-nowrap border border-gray-300 bg-gray-50 px-3 py-2 align-middle font-semibold text-gray-600">
                          RFID <span className="text-red-500">*</span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-top">
                          <Input
                            id="finalize-rfid"
                            autoFocus
                            value={rfid}
                            onChange={(e) => setRfid(e.target.value)}
                            placeholder="Scan or type the RFID"
                          />
                          {rfid.trim() ? (
                            rfidChecking ? (
                              <p className="mt-1 text-xs text-gray-500">Checking availability…</p>
                            ) : rfidConflict ? (
                              <p className="mt-1 text-xs text-red-600">
                                Already assigned to {rfidConflict.name ?? "another student"}
                                {rfidConflict.uid ? ` (${rfidConflict.uid})` : ""}. RFID must be
                                unique.
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-green-600">RFID is available.</p>
                            )
                          ) : (
                            <p className="mt-1 text-xs text-gray-500">Enter the RFID to save.</p>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap border border-gray-300 bg-gray-50 px-3 py-2 align-middle font-semibold text-gray-600">
                          Type
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-top">
                          <Select
                            value={
                              issueStatus === "REISSUED" || issueStatus === "RENEWED"
                                ? issueStatus
                                : ""
                            }
                            onValueChange={(v) => {
                              const s = v as IdCardIssueStatus;
                              setIssueStatus(s);
                              setRemarks(STATUS_REMARKS[s as keyof typeof STATUS_REMARKS] ?? "");
                            }}
                          >
                            <SelectTrigger id="finalize-type">
                              <SelectValue placeholder="Issued (first card)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REISSUED">Reissued</SelectItem>
                              <SelectItem value="RENEWED">Renewed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap border border-gray-300 bg-gray-50 px-3 py-2 align-middle font-semibold text-gray-600">
                          Remarks
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-top">
                          <Textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter remarks"
                            rows={2}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right — the ID card being saved, full height */}
              <div className="hidden h-full w-[42%] shrink-0 items-center justify-center overflow-hidden border-l bg-muted/30 p-3 md:flex">
                {composedPreview ? (
                  <img
                    src={composedPreview}
                    alt="ID card to be saved"
                    className="max-h-full max-w-full rounded-md border object-contain shadow-sm"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">ID card preview</span>
                )}
              </div>
            </div>

            {/* Footer — issuer on the left, Save on the right (spans middle + right only). */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-background px-6 py-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{ name: user?.name || undefined, image: user?.image || undefined }}
                  size="sm"
                  className="h-9 w-9 drop-shadow-none"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-800">{user?.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {preparedAt ? formatIssuedAt(preparedAt) : "—"}
                  </span>
                </div>
              </div>
              <Button
                className="bg-blue-600 px-8 text-white hover:bg-blue-700"
                disabled={
                  !draftIssueId ||
                  !rfid.trim() ||
                  rfidChecking ||
                  !!rfidConflict ||
                  finalizeMutation.isLoading
                }
                onClick={() => finalizeMutation.mutate()}
              >
                {finalizeMutation.isLoading ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

// dd/mm/yyyy, hh:mm AM/PM in the given timezone.
function formatStamp(d: Date, timeZone: string): string {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return s.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

// A real Date ("now") shown in IST.
function formatIssuedAt(d: Date): string {
  return formatStamp(d, "Asia/Kolkata");
}

// A naive DB timestamp that already holds IST wall-clock (Drizzle serializes it
// with a misleading trailing 'Z'); read it literally by formatting in UTC.
function formatDbStampIst(value: string): string {
  const d = new Date(
    value.endsWith("Z") || value.includes("+") ? value : value.replace(" ", "T") + "Z",
  );
  return formatStamp(d, "UTC");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="mr-4 w-48 text-left font-semibold">{label}</span>
      <span>{value}</span>
    </div>
  );
}
