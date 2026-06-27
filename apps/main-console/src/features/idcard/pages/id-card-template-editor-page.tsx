import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  IdCard,
  MoveHorizontal,
  MoveVertical,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getTemplate, listTemplateFields, upsertTemplateFields } from "../api/idcard-api";
import {
  IdCardFieldAlign,
  IdCardFieldKey,
  ID_CARD_FIELDS_WITH_DIMENSIONS,
  ID_CARD_FIELD_LABELS,
  IdCardTemplateFieldUpsertPayload,
} from "../types";
import { IdCardPageHeader } from "../components/page-header";

const DEFAULT_FIELD_ORDER: IdCardFieldKey[] = [
  "NAME",
  "COURSE",
  "UID",
  "MOBILE",
  "BLOOD_GROUP",
  "SPORTS_QUOTA",
  "SHIFT",
  "QRCODE",
  "VALID_TILL_DATE",
  "PHOTO",
];

// Per-field font sizes mirror the ones in the Issue page composer so the
// editor preview boxes have the same pixel footprint as the rendered text.
const FIELD_PREVIEW_FONT_PX: Partial<Record<IdCardFieldKey, number>> = {
  NAME: 28,
  COURSE: 26,
  UID: 30,
  MOBILE: 24,
  BLOOD_GROUP: 26,
  SPORTS_QUOTA: 26,
  SHIFT: 24,
  VALID_TILL_DATE: 20,
};

interface FieldDraft extends IdCardTemplateFieldUpsertPayload {}

export default function IdCardTemplateEditorPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = Number(params.templateId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const templateQuery = useQuery({
    queryKey: ["idcard", "template", templateId],
    queryFn: () => getTemplate(templateId),
    enabled: Number.isFinite(templateId) && templateId > 0,
  });
  const fieldsQuery = useQuery({
    queryKey: ["idcard", "template", templateId, "fields"],
    queryFn: () => listTemplateFields(templateId),
    enabled: Number.isFinite(templateId) && templateId > 0,
  });

  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [draggingKey, setDraggingKey] = useState<IdCardFieldKey | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!fieldsQuery.data) return;
    const byKey = new Map(fieldsQuery.data.map((f) => [f.fieldKey, f]));
    const next = DEFAULT_FIELD_ORDER.map<FieldDraft>((key) => {
      const existing = byKey.get(key);
      if (existing) {
        return {
          fieldKey: existing.fieldKey,
          x: existing.x,
          y: existing.y,
          width: existing.width,
          height: existing.height,
          fontSize: existing.fontSize ?? null,
          align: existing.align ?? "LEFT",
          isVisible: existing.isVisible,
        };
      }
      const isPhoto = key === "PHOTO";
      return {
        fieldKey: key,
        x: 0,
        y: 0,
        width: isPhoto ? 200 : null,
        height: isPhoto ? 240 : null,
        fontSize: null,
        align: "LEFT",
        isVisible: false,
      };
    });
    setDrafts(next);
  }, [fieldsQuery.data]);

  const template = templateQuery.data;
  const canvasWidth = template?.canvasWidthPx ?? 600;
  const canvasHeight = template?.canvasHeightPx ?? 900;

  const previewScale = useMemo(() => {
    return Math.min(1, 480 / canvasWidth);
  }, [canvasWidth]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertTemplateFields(
        templateId,
        drafts.filter((d) => d.isVisible !== false),
      ),
    onSuccess: () => {
      toast.success("Fields saved.");
      queryClient.invalidateQueries({
        queryKey: ["idcard", "template", templateId, "fields"],
      });
    },
    onError: () => toast.error("Failed to save fields."),
  });

  const handleDrag = (key: IdCardFieldKey, event: React.MouseEvent) => {
    if (!previewRef.current) return;
    setDraggingKey(key);
    const rect = previewRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const draft = drafts.find((d) => d.fieldKey === key);
    if (!draft) return;
    const initialX = draft.x;
    const initialY = draft.y;

    const onMove = (e: MouseEvent) => {
      const dxPx = (e.clientX - startX) / previewScale;
      const dyPx = (e.clientY - startY) / previewScale;
      setDrafts((prev) =>
        prev.map((d) =>
          d.fieldKey === key
            ? {
                ...d,
                x: Math.max(0, Math.min(canvasWidth, Math.round(initialX + dxPx))),
                y: Math.max(0, Math.min(canvasHeight, Math.round(initialY + dyPx))),
              }
            : d,
        ),
      );
    };
    const onUp = () => {
      setDraggingKey(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    // Suppress text selection while dragging
    event.preventDefault();
    void rect;
  };

  const updateDraft = (key: IdCardFieldKey, patch: Partial<FieldDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.fieldKey === key ? { ...d, ...patch } : d)));

  // Box width/height a field occupies on the canvas (mirrors the preview math).
  const boxSize = (d: FieldDraft) => {
    const isPhoto = d.fieldKey === "PHOTO";
    const isQR = d.fieldKey === "QRCODE";
    const qrW = template?.qrcodeSize || 80;
    const qrH = template?.qrcodeHeight || qrW;
    const w = isPhoto ? (d.width ?? 200) : isQR ? qrW : 0;
    const h = isPhoto ? (d.height ?? 240) : isQR ? qrH : 0;
    return { isPhoto, isQR, w, h };
  };

  // Center horizontally: boxed fields (Photo/QR) center their box; text fields
  // anchor at the canvas mid-x and switch to CENTER alignment so the drawn text
  // is truly centered (text is anchored, not boxed).
  const centerHorizontally = (d: FieldDraft) => {
    const { isPhoto, isQR, w } = boxSize(d);
    if (isPhoto || isQR) {
      updateDraft(d.fieldKey, { x: Math.round((canvasWidth - w) / 2) });
    } else {
      updateDraft(d.fieldKey, { x: Math.round(canvasWidth / 2), align: "CENTER" });
    }
  };

  const centerVertically = (d: FieldDraft) => {
    const { isPhoto, isQR, h } = boxSize(d);
    if (isPhoto || isQR) {
      updateDraft(d.fieldKey, { y: Math.round((canvasHeight - h) / 2) });
    } else {
      updateDraft(d.fieldKey, { y: Math.round(canvasHeight / 2) });
    }
  };

  if (templateQuery.isLoading || fieldsQuery.isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }
  if (!template) {
    return <div className="p-6 text-sm text-red-600">Template not found.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={IdCard}
        title={`Template Editor — ${template.name}`}
        subtitle={`Canvas ${canvasWidth} × ${canvasHeight} px · drag handles or type coordinates`}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
              <Save className="h-4 w-4 mr-1" /> {saveMutation.isLoading ? "Saving…" : "Save Layout"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-3">
            <div
              className="relative mx-auto border rounded overflow-hidden bg-gray-50"
              style={{
                width: canvasWidth * previewScale,
                height: canvasHeight * previewScale,
              }}
            >
              <div
                ref={previewRef}
                className="absolute inset-0"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  width: canvasWidth,
                  height: canvasHeight,
                }}
              >
                {template.templateImageUrl && (
                  <img
                    src={template.templateImageUrl}
                    alt="template"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                )}
                {drafts
                  .filter((d) => d.isVisible !== false)
                  .map((d) => {
                    const isPhoto = d.fieldKey === "PHOTO";
                    const isQR = d.fieldKey === "QRCODE";
                    // Match compose():
                    //   PHOTO uses (x, y) as top-left + width/height.
                    //   QRCODE uses (x, y) as top-left + template's qrcodeSize.
                    //   Text fields use (x, y) as the alphabetic baseline, so
                    //   the visible box sits ABOVE (x, y) by its rendered
                    //   pixel height.
                    const fontPx = d.fontSize ?? FIELD_PREVIEW_FONT_PX[d.fieldKey] ?? 22;
                    const w = isPhoto
                      ? (d.width ?? 200)
                      : isQR
                        ? template.qrcodeSize || 80
                        : Math.max(140, fontPx * 6);
                    const h = isPhoto
                      ? (d.height ?? 240)
                      : isQR
                        ? template.qrcodeHeight || template.qrcodeSize || 80
                        : Math.round(fontPx * 1.15);
                    let top = isPhoto || isQR ? d.y : d.y - h + Math.round(fontPx * 0.18);
                    // Text fields use (x) as the alignment anchor — mirror the
                    // canvas textAlign so the preview box sits where text draws.
                    const align = (d.align ?? "LEFT") as IdCardFieldAlign;
                    const isText = !isPhoto && !isQR;
                    let left = isText
                      ? align === "CENTER"
                        ? d.x - w / 2
                        : align === "RIGHT"
                          ? d.x - w
                          : d.x
                      : d.x;
                    const justify =
                      align === "CENTER" ? "center" : align === "RIGHT" ? "flex-end" : "flex-start";
                    // SHIFT renders inline right after the COURSE text on the card.
                    // Mirror that here (approx, using an estimated course width) so
                    // the preview shows it trailing the course name.
                    if (d.fieldKey === "SHIFT") {
                      const course = drafts.find((c) => c.fieldKey === "COURSE");
                      if (course && course.isVisible !== false) {
                        const cFont = course.fontSize ?? FIELD_PREVIEW_FONT_PX["COURSE"] ?? 22;
                        const cW = Math.max(140, cFont * 6);
                        left = course.x + cW + 12;
                        top = course.y - h + Math.round(fontPx * 0.18);
                      }
                    }
                    const active = draggingKey === d.fieldKey;
                    const autoPlaced = d.fieldKey === "SHIFT";
                    return (
                      <div
                        key={d.fieldKey}
                        onMouseDown={autoPlaced ? undefined : (e) => handleDrag(d.fieldKey, e)}
                        title={autoPlaced ? "Auto: drawn after the Course name" : undefined}
                        className={`absolute border-2 rounded px-1 text-xs font-medium select-none flex items-end ${
                          autoPlaced ? "cursor-default" : "cursor-move"
                        } ${
                          autoPlaced
                            ? "border-dashed border-emerald-500 bg-emerald-100/60"
                            : active
                              ? "border-violet-500 bg-violet-100/70"
                              : "border-blue-400 bg-blue-100/60"
                        }`}
                        style={{
                          left,
                          top,
                          width: w,
                          height: h,
                          justifyContent: justify,
                        }}
                      >
                        {ID_CARD_FIELD_LABELS[d.fieldKey]}
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 space-y-3 max-h-[640px] overflow-y-auto">
            {drafts.map((d) => {
              const needsDims = ID_CARD_FIELDS_WITH_DIMENSIONS.includes(d.fieldKey);
              const isTextField = d.fieldKey !== "PHOTO" && d.fieldKey !== "QRCODE";
              const isShift = d.fieldKey === "SHIFT";
              return (
                <div key={d.fieldKey} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{ID_CARD_FIELD_LABELS[d.fieldKey]}</div>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={d.isVisible !== false}
                        onChange={(e) =>
                          updateDraft(d.fieldKey, {
                            isVisible: e.target.checked,
                          })
                        }
                      />
                      Visible on card
                    </label>
                  </div>
                  {isShift && (
                    <div className="rounded bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-800">
                      Position is automatic — Shift is drawn inline right after the Course name.
                      Move the Course field to reposition it; only Font Size applies here.
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {!isShift && (
                      <>
                        <div>
                          <Label className="text-xs">X</Label>
                          <Input
                            type="number"
                            value={d.x}
                            onChange={(e) =>
                              updateDraft(d.fieldKey, {
                                x: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={d.y}
                            onChange={(e) =>
                              updateDraft(d.fieldKey, {
                                y: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                    {needsDims && (
                      <>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={d.width ?? 0}
                            onChange={(e) =>
                              updateDraft(d.fieldKey, {
                                width: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={d.height ?? 0}
                            onChange={(e) =>
                              updateDraft(d.fieldKey, {
                                height: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                    {isTextField && (
                      <div>
                        <Label className="text-xs">Font Size (px)</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={String(FIELD_PREVIEW_FONT_PX[d.fieldKey] ?? 22)}
                          value={d.fontSize ?? ""}
                          onChange={(e) =>
                            updateDraft(d.fieldKey, {
                              fontSize:
                                e.target.value === "" ? null : Number(e.target.value) || null,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  {!isShift && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isTextField && (
                        <div className="flex items-center gap-1">
                          <Label className="text-xs mr-1">Align</Label>
                          {(["LEFT", "CENTER", "RIGHT"] as const).map((a) => {
                            const AlignIcon =
                              a === "LEFT" ? AlignLeft : a === "CENTER" ? AlignCenter : AlignRight;
                            const activeAlign = (d.align ?? "LEFT") === a;
                            return (
                              <Button
                                key={a}
                                type="button"
                                size="sm"
                                variant={activeAlign ? "default" : "outline"}
                                className="h-7 w-7 p-0"
                                title={`Align ${a.toLowerCase()}`}
                                onClick={() => updateDraft(d.fieldKey, { align: a })}
                              >
                                <AlignIcon className="h-3.5 w-3.5" />
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        title="Center horizontally on the card"
                        onClick={() => centerHorizontally(d)}
                      >
                        <MoveHorizontal className="h-3.5 w-3.5" />
                        Center H
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        title="Center vertically on the card"
                        onClick={() => centerVertically(d)}
                      >
                        <MoveVertical className="h-3.5 w-3.5" />
                        Center V
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
