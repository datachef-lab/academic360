import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Eye, History as HistoryIcon, Printer, ScanLine, Trash2, User } from "lucide-react";
import QRCode from "qrcode";
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

import {
  createIssue,
  deleteIssue,
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
  section: string | null;
  classRollNumber: string | null;
  emergencyPhone: string | null;
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

function extractStudentInfo(raw: any): StudentInfo {
  return {
    id: raw?.id ?? 0,
    uid: raw?.uid ?? "",
    name: raw?.user?.name ?? raw?.name ?? null,
    course:
      raw?.programCourse?.shortName ??
      raw?.programCourse?.course?.shortName ??
      raw?.programCourse?.name ??
      raw?.programCourse?.course?.name ??
      null,
    mobile:
      raw?.user?.phone ?? raw?.person?.phone ?? raw?.admissionGeneralInfo?.mobileNumber ?? null,
    bloodGroup: raw?.health?.bloodGroup?.type ?? raw?.health?.bloodGroup?.name ?? null,
    rfidNumber: raw?.rfidNumber ?? null,
    sportsQuota: raw?.sportsInfo?.[0]?.sportsCategory?.name ?? null,
    quotaType: raw?.admissionCourseDetails?.quota?.name ?? raw?.quotaType ?? null,
    section: raw?.section?.name ?? null,
    classRollNumber: raw?.classRollNumber ?? raw?.rollNumber ?? null,
    shift:
      raw?.currentPromotion?.shift?.name ?? raw?.promotion?.shift?.name ?? raw?.shift?.name ?? null,
    // Filled in after lookup from the emergency-contact endpoint.
    emergencyPhone: null,
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
  const activeTemplate: IdCardTemplate | null =
    (activeTemplateQuery.data as IdCardTemplate | null) ??
    templates.find((t) => t.id === templateId) ??
    null;

  // When the template academic year changes (registration year, or the
  // selected-year fallback), drop the previously selected templateId so the
  // default-template lookup below can re-pick the right one for the new year
  // (and clear any stale composed/back artefacts).
  useEffect(() => {
    setTemplateId(null);
    setComposedBlob(null);
    setComposedPreview(null);
    setShowBack(false);
  }, [templateAcademicYearId]);

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

  // On a reissue / renewal, fetch the previously captured photo from S3 via the
  // authed backend proxy so the composer can rebuild the card immediately —
  // operator only needs to click Retake if they want a fresh one.
  useEffect(() => {
    if (!student) return;
    if (photoBlob) return;
    const recent = priorIssues[0];
    if (!recent?.id || !recent.photoImageKey) return;
    let revoke: string | null = null;
    let cancelled = false;
    fetchIssuePhotoBlob(recent.id)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoke = url;
        setPhotoBlob(blob);
        setPhotoPreviewUrl(url);
      })
      .catch(() => {
        // Non-fatal — operator can still capture a fresh photo.
      });
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, priorIssues[0]?.id]);

  const setStatusAndRemarks = (s: IdCardIssueStatus) => {
    setIssueStatus(s);
    setRemarks(STATUS_REMARKS[s]);
  };

  const resetCompositionState = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setComposedBlob(null);
    setComposedPreview(null);
  };

  const lookupMutation = useMutation({
    mutationFn: async (q: string) => fetchStudentByUid(q.trim()),
    onSuccess: (data) => {
      const info = extractStudentInfo(data);
      if (!info.id) {
        toast.error("No student matched.");
        return;
      }
      setStudent(info);
      setRfid(info.rfidNumber ?? "");
      resetCompositionState();
      // Default each new student back to the auto "Program course" validity.
      setValidityMode("PROGRAM");
      setManualValidTill("");
      setProgramValidTill(null);

      // Blood group (health) and emergency phone live in separate tables keyed by
      // userId, so they aren't on the student DTO — fetch them by studentId.
      void (async () => {
        const [healthRes, emRes] = await Promise.allSettled([
          axiosInstance.get(`/api/health/student/${info.id}`),
          axiosInstance.get(`/api/emergency-contact/student/${info.id}`),
        ]);
        const health = healthRes.status === "fulfilled" ? healthRes.value.data?.payload : null;
        const bloodGroup = health?.bloodGroup?.type ?? health?.bloodGroup?.name ?? null;
        const emergencyPhone =
          emRes.status === "fulfilled" ? (emRes.value.data?.payload?.phone ?? null) : null;
        setStudent((prev) =>
          prev && prev.id === info.id
            ? { ...prev, bloodGroup: bloodGroup ?? prev.bloodGroup, emergencyPhone }
            : prev,
        );
      })();
    },
    onError: () => toast.error("Lookup failed. Verify the UID."),
  });

  const handleCapture = (full: Blob, cropped: Blob) => {
    setPhotoBlob(cropped);
    setPhotoPreviewUrl(URL.createObjectURL(cropped));
    void full;
  };

  const handleUpload = (file: File) => {
    setPhotoBlob(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const compose = async () => {
    if (!activeTemplate || !student || !photoBlob) {
      toast.error("Need student, template, and photo before composing.");
      return;
    }
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = activeTemplate.canvasWidthPx;
    canvas.height = activeTemplate.canvasHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      const bgBlob = await fetchTemplateImageBlob(activeTemplate.id);
      bgUrl = URL.createObjectURL(bgBlob);
      const bg = await loadImg(bgUrl);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      photoUrl = URL.createObjectURL(photoBlob);
      const photo = await loadImg(photoUrl);

      // SHIFT flows inline immediately after the COURSE text. Measure the
      // rendered course width so the shift anchor sits right after it (with a
      // small gap), regardless of how long the program-course name is.
      let shiftInlineAnchor: { x: number; y: number } | null = null;
      const courseField = (activeTemplate.fields ?? []).find(
        (f) => f.fieldKey === "COURSE" && f.isVisible !== false,
      );
      if (courseField) {
        const courseText = valueForField("COURSE", student, activeValidTill);
        if (courseText) {
          const cpx = courseField.fontSize ?? (FIELD_FONT_PX.COURSE || 22);
          ctx.font = `bold ${cpx}px Calibri, Arial, sans-serif`;
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

      for (const field of activeTemplate.fields ?? []) {
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
          const size = activeTemplate.qrcodeSize || 80;
          const qrDataUrl = await QRCode.toDataURL(student.uid || "", {
            errorCorrectionLevel: "M",
            margin: 1,
            width: size,
          });
          const qrImg = await loadImg(qrDataUrl);
          ctx.drawImage(qrImg, field.x, field.y, size, size);
          continue;
        }

        if (TEXT_FIELDS.includes(field.fieldKey)) {
          const text = valueForField(field.fieldKey, student, activeValidTill);
          if (!text) continue;
          const px = field.fontSize ?? (FIELD_FONT_PX[field.fieldKey] || 22);
          ctx.fillStyle = "#000";
          ctx.font = `bold ${px}px Calibri, Arial, sans-serif`;
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
      if (!blob) {
        toast.error("Could not compose the card image.");
        return;
      }
      setComposedBlob(blob);
      setComposedPreview(URL.createObjectURL(blob));
    } catch (err) {
      console.error("compose failed", err);
      toast.error("Failed to compose card. Check template image access.");
    } finally {
      if (bgUrl) URL.revokeObjectURL(bgUrl);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    }
  };

  // Auto-compose once student + template + photo are all in.
  useEffect(() => {
    if (photoBlob && activeTemplate && student) {
      void compose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoBlob, activeTemplate?.id, student?.id, activeValidTill]);

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
    onSuccess: () => {
      toast.success("ID card saved.");
      setComposedBlob(null);
      setComposedPreview(null);
      setPhotoBlob(null);
      setPhotoPreviewUrl(null);
      void historyQuery.refetch();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Could not save the ID card.";
      toast.error(msg);
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: (id: number) => deleteIssue(id),
    onSuccess: () => {
      toast.success("Issue removed.");
      void historyQuery.refetch();
    },
    onError: () => toast.error("Could not delete that issue."),
  });

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
                if (e.key === "Enter" && uidQuery.trim()) lookupMutation.mutate(uidQuery);
              }}
            />
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              onClick={() => lookupMutation.mutate(uidQuery)}
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
                            #{idx + 1} Type: {it.issueStatus}
                          </div>
                          <div className="flex gap-1">
                            {it.frontImageUrl && (
                              <a
                                href={it.frontImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600"
                              >
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("Delete this issue record?"))
                                  deleteIssueMutation.mutate(it.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">Remarks: {it.remarks ?? "—"}</div>
                        <div className="text-xs text-gray-600">
                          Date: {it.issueDate ? new Date(it.issueDate).toLocaleString() : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <DetailRow label="Student Name" value={student.name ?? "-"} />
                <DetailRow label="Course" value={student.course ?? "-"} />
                <DetailRow label="Shift" value={student.shift ?? "-"} />
                <DetailRow label="Blood Group" value={student.bloodGroup ?? "-"} />
                <DetailRow
                  label="Quota Type"
                  value={student.quotaType ?? student.sportsQuota ?? "-"}
                />
                <DetailRow label="Emergency Phone" value={student.emergencyPhone ?? "-"} />
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
                  // Front: after photo capture + compose, show the composed card.
                  <img
                    src={composedPreview}
                    alt="generated card"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : activeTemplate?.templateImageUrl ? (
                  // Front before capture: show the template background so the
                  // operator sees the active template for the chosen year.
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!composedBlob || saveMutation.isLoading}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isLoading ? "Saving…" : "Save ID Card"}
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
                className="mx-auto max-h-[80vh] object-contain"
              />
            ) : activeTemplate?.backsideImageUrl ? (
              <img
                src={activeTemplate.backsideImageUrl}
                alt="zoomed back"
                className="mx-auto max-h-[80vh] object-contain"
              />
            ) : null
          ) : composedPreview ? (
            <img
              src={composedPreview}
              alt="zoomed card"
              className="mx-auto max-h-[80vh] object-contain"
            />
          ) : activeTemplate?.templateImageUrl ? (
            <img
              src={activeTemplate.templateImageUrl}
              alt="zoomed front template"
              className="mx-auto max-h-[80vh] object-contain"
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
