import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createTemplate, updateTemplate } from "../api/idcard-api";
import { IdCardTemplate, IdCardTemplateUpsertPayload } from "../types";

interface Props {
  open: boolean;
  academicYearId: number;
  template: IdCardTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TemplateUpsertDialog({
  open,
  academicYearId,
  template,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [canvasWidthPx, setCanvasWidthPx] = useState(template?.canvasWidthPx ?? 600);
  const [canvasHeightPx, setCanvasHeightPx] = useState(template?.canvasHeightPx ?? 900);
  const [qrcodeSize, setQrcodeSize] = useState(template?.qrcodeSize ?? 0);
  const [qrcodeHeight, setQrcodeHeight] = useState(template?.qrcodeHeight ?? 0);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  useEffect(() => {
    setName(template?.name ?? "");
    setDescription(template?.description ?? "");
    setCanvasWidthPx(template?.canvasWidthPx ?? 600);
    setCanvasHeightPx(template?.canvasHeightPx ?? 900);
    setQrcodeSize(template?.qrcodeSize ?? 0);
    setQrcodeHeight(template?.qrcodeHeight ?? 0);
    setIsDefault(template?.isDefault ?? false);
    setFile(null);
    setBackFile(null);
  }, [template]);

  const buildPayload = (): IdCardTemplateUpsertPayload => ({
    academicYearId,
    name: name.trim(),
    description: description.trim() || null,
    canvasWidthPx,
    canvasHeightPx,
    qrcodeSize,
    qrcodeHeight,
    isDefault,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Template name is required.");
      if (!isEdit && !file) throw new Error("Template image is required.");
      const payload = buildPayload();
      if (isEdit && template) {
        await updateTemplate(template.id, payload, file ?? undefined, backFile ?? undefined);
      } else {
        await createTemplate(payload, file!, backFile ?? undefined);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Template updated." : "Template created.");
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not save template.";
      toast.error(message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle>{isEdit ? "Edit Template" : "New ID Card Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-y-auto px-6 py-4">
          <div>
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Canvas Width (px)</Label>
              <Input
                type="number"
                value={canvasWidthPx}
                onChange={(e) => setCanvasWidthPx(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Canvas Height (px)</Label>
              <Input
                type="number"
                value={canvasHeightPx}
                onChange={(e) => setCanvasHeightPx(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>QR Code Width (px)</Label>
              <Input
                type="number"
                value={qrcodeSize}
                onChange={(e) => setQrcodeSize(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>QR Code Height (px)</Label>
              <Input
                type="number"
                value={qrcodeHeight}
                onChange={(e) => setQrcodeHeight(Number(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">0 = square (uses width)</p>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="isDefault"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <Label htmlFor="isDefault">Mark as default</Label>
            </div>
          </div>
          <div>
            <Label>
              {isEdit ? "Replace Front Template Image (optional)" : "Front Template Image"}
            </Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {isEdit && template?.templateImageUrl && (
              <img
                src={template.templateImageUrl}
                alt={template.name}
                className="mt-2 h-24 rounded border"
              />
            )}
          </div>
          <div>
            <Label>
              {isEdit ? "Replace Back-Side Image (optional)" : "Back-Side Image (optional)"}
            </Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
            />
            {isEdit && template?.backsideImageUrl && (
              <img
                src={template.backsideImageUrl}
                alt={`${template.name} back`}
                className="mt-2 h-24 rounded border"
              />
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 py-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isLoading}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
