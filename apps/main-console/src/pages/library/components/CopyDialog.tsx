import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCopyDetails,
  getCopyDetailsById,
  updateCopyDetails,
  type CopyDetailsDetail,
  type CopyDetailsMetaPayload,
  type CopyDetailsUpsertBody,
} from "@/services/copy-details.service";

const NONE = "__none__";

const comboWithNone = (
  items: { value: string; label: string }[],
  noneLabel: string,
): { value: string; label: string }[] => [{ value: NONE, label: noneLabel }, ...items];

type FormState = {
  accessNumber: string;
  oldAccessNumber: string;
  isbn: string;
  publishedYear: string;
  statusId: string;
  entryModeId: string;
  rackId: string;
  shelfId: string;
  enclosureId: string;
  bindingTypeId: string;
  priceInINR: string;
  type: string;
  issueType: string;
  voucherNumber: string;
  numberOfEnclosures: string;
  numberOfPages: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  accessNumber: "",
  oldAccessNumber: "",
  isbn: "",
  publishedYear: "",
  statusId: NONE,
  entryModeId: NONE,
  rackId: NONE,
  shelfId: NONE,
  enclosureId: NONE,
  bindingTypeId: NONE,
  priceInINR: "",
  type: "",
  issueType: "",
  voucherNumber: "",
  numberOfEnclosures: "",
  numberOfPages: "",
  remarks: "",
});

const detailToForm = (d: CopyDetailsDetail): FormState => ({
  accessNumber: d.accessNumber ?? "",
  oldAccessNumber: d.oldAccessNumber ?? "",
  isbn: d.isbn ?? "",
  publishedYear: d.publishedYear ?? "",
  statusId: d.statusId != null ? String(d.statusId) : NONE,
  entryModeId: d.enntryModeId != null ? String(d.enntryModeId) : NONE,
  rackId: d.rackId != null ? String(d.rackId) : NONE,
  shelfId: d.shelfId != null ? String(d.shelfId) : NONE,
  enclosureId: d.enclosureId != null ? String(d.enclosureId) : NONE,
  bindingTypeId: d.bindingTypeId != null ? String(d.bindingTypeId) : NONE,
  priceInINR: d.priceInINR ?? "",
  type: d.type ?? "",
  issueType: d.issueType ?? "",
  voucherNumber: d.voucherNumber ?? "",
  numberOfEnclosures: d.numberOfEnclosures != null ? String(d.numberOfEnclosures) : "",
  numberOfPages: d.numberOfPages != null ? String(d.numberOfPages) : "",
  remarks: d.remarks ?? "",
});

const parseOptionalCount = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const formToBody = (f: FormState, bookId: number): CopyDetailsUpsertBody => ({
  bookId,
  accessNumber: f.accessNumber.trim() || null,
  oldAccessNumber: f.oldAccessNumber.trim() || null,
  isbn: f.isbn.trim() || null,
  publishedYear: f.publishedYear.trim() || null,
  statusId: f.statusId === NONE ? null : Number(f.statusId),
  enntryModeId: f.entryModeId === NONE ? null : Number(f.entryModeId),
  rackId: f.rackId === NONE ? null : Number(f.rackId),
  shelfId: f.shelfId === NONE ? null : Number(f.shelfId),
  enclosureId: f.enclosureId === NONE ? null : Number(f.enclosureId),
  bindingTypeId: f.bindingTypeId === NONE ? null : Number(f.bindingTypeId),
  priceInINR: f.priceInINR.trim() || null,
  type: f.type.trim() || null,
  issueType: f.issueType.trim() || null,
  voucherNumber: f.voucherNumber.trim() || null,
  numberOfEnclosures: parseOptionalCount(f.numberOfEnclosures),
  numberOfPages: parseOptionalCount(f.numberOfPages),
  remarks: f.remarks.trim() || null,
});

type CopyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number;
  bookTitle?: string;
  copyId: number | null;
  meta: CopyDetailsMetaPayload | null;
  onSaved: () => void;
};

export default function CopyDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  copyId,
  meta,
  onSaved,
}: CopyDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (copyId == null) {
      setForm(emptyForm());
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        const res = await getCopyDetailsById(copyId);
        setForm(detailToForm(res.payload));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load copy");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, copyId]);

  const formComboStatuses = useMemo(
    () =>
      comboWithNone(
        (meta?.statuses ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.statuses],
  );
  const formComboEntryModes = useMemo(
    () =>
      comboWithNone(
        (meta?.entryModes ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.entryModes],
  );
  const formComboRacks = useMemo(
    () =>
      comboWithNone(
        (meta?.racks ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.racks],
  );
  const formComboShelves = useMemo(
    () =>
      comboWithNone(
        (meta?.shelves ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.shelves],
  );
  const formComboEnclosures = useMemo(
    () =>
      comboWithNone(
        (meta?.enclosures ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.enclosures],
  );
  const formComboBindings = useMemo(
    () =>
      comboWithNone(
        (meta?.bindings ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.bindings],
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const body = formToBody(form, bookId);
      if (copyId == null) {
        await createCopyDetails(body);
        toast.success("Copy added");
      } else {
        await updateCopyDetails(copyId, body);
        toast.success("Copy updated");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not save copy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {copyId == null ? "Add copy" : "Edit copy"}
            {bookTitle ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">— {bookTitle}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="grid max-h-[min(70vh,560px)] gap-3 overflow-y-auto py-2 pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Accession</Label>
                <Input
                  value={form.accessNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accessNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Old accession</Label>
                <Input
                  value={form.oldAccessNumber}
                  onChange={(e) => setForm((f) => ({ ...f, oldAccessNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ISBN</Label>
                <Input
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Published year</Label>
                <Input
                  value={form.publishedYear}
                  onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Combobox
                  className="h-10"
                  placeholder="Status"
                  value={form.statusId}
                  dataArr={formComboStatuses}
                  onChange={(v) => setForm((f) => ({ ...f, statusId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entry mode</Label>
                <Combobox
                  className="h-10"
                  placeholder="Entry mode"
                  value={form.entryModeId}
                  dataArr={formComboEntryModes}
                  onChange={(v) => setForm((f) => ({ ...f, entryModeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rack</Label>
                <Combobox
                  className="h-10"
                  placeholder="Rack"
                  value={form.rackId}
                  dataArr={formComboRacks}
                  onChange={(v) => setForm((f) => ({ ...f, rackId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Shelf</Label>
                <Combobox
                  className="h-10"
                  placeholder="Shelf"
                  value={form.shelfId}
                  dataArr={formComboShelves}
                  onChange={(v) => setForm((f) => ({ ...f, shelfId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Enclosure</Label>
                <Combobox
                  className="h-10"
                  placeholder="Enclosure"
                  value={form.enclosureId}
                  dataArr={formComboEnclosures}
                  onChange={(v) => setForm((f) => ({ ...f, enclosureId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Binding</Label>
                <Combobox
                  className="h-10"
                  placeholder="Binding"
                  value={form.bindingTypeId}
                  dataArr={formComboBindings}
                  onChange={(v) => setForm((f) => ({ ...f, bindingTypeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price (₹)</Label>
                <Input
                  value={form.priceInINR}
                  onChange={(e) => setForm((f) => ({ ...f, priceInINR: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue type</Label>
                <Input
                  value={form.issueType}
                  onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Voucher #</Label>
                <Input
                  value={form.voucherNumber}
                  onChange={(e) => setForm((f) => ({ ...f, voucherNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs"># Enclosures</Label>
                <Input
                  value={form.numberOfEnclosures}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfEnclosures: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs"># Pages</Label>
                <Input
                  value={form.numberOfPages}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfPages: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || loading} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Formats stored INR text with grouping (e.g. 1234567 → 12,34,567). Unparseable values are shown as-is. */
export function formatPriceInrDisplay(raw: string | null | undefined): string | null {
  const t = raw?.trim() ?? "";
  if (!t) return null;
  const normalized = t.replace(/,/g, "").replace(/\s/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return t;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
