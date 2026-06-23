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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCopyDetails,
  getCopyAddress,
  getCopyDetailsById,
  saveCopyAddress,
  updateCopyDetails,
  type CopyDetailsDetail,
  type CopyDetailsMetaPayload,
  type CopyDetailsUpsertBody,
} from "@/services/copy-details.service";
import { getAllCountries } from "@/services/country.service";
import { getStatesByCountry } from "@/services/state.service";
import { getCitiesByState } from "@/services/city.service";

const NONE = "__none__";

const comboWithNone = (
  items: { value: string; label: string }[],
  noneLabel: string,
): { value: string; label: string }[] => [{ value: NONE, label: noneLabel }, ...items];

type FormState = {
  accessNumber: string;
  oldAccessNumber: string;
  rfidNumber: string;
  isbn: string;
  publishedYear: string;
  type: string;
  issueType: string;
  itemCategoryId: string;
  statusId: string;
  bindingTypeId: string;
  authorTypeId: string;
  entryModeId: string;
  branchId: string;
  rackId: string;
  shelfId: string;
  enclosureId: string;
  numberOfEnclosures: string;
  bookVolume: string;
  bookPart: string;
  bookPartInfo: string;
  volumeInfo: string;
  numberOfPages: string;
  bookSize: string;
  prefix: string;
  suffix: string;
  theftBitArmed: boolean;
  priceInINR: string;
  priceForeignCurrency: string;
  purchasePrice: string;
  setPrice: string;
  discount: string;
  shippingCharges: string;
  vendorId: string;
  voucherNumber: string;
  billDate: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  accessNumber: "",
  oldAccessNumber: "",
  rfidNumber: "",
  isbn: "",
  publishedYear: "",
  type: "",
  issueType: "",
  itemCategoryId: NONE,
  statusId: NONE,
  bindingTypeId: NONE,
  authorTypeId: NONE,
  entryModeId: NONE,
  branchId: NONE,
  rackId: NONE,
  shelfId: NONE,
  enclosureId: NONE,
  numberOfEnclosures: "",
  bookVolume: "",
  bookPart: "",
  bookPartInfo: "",
  volumeInfo: "",
  numberOfPages: "",
  bookSize: "",
  prefix: "",
  suffix: "",
  theftBitArmed: false,
  priceInINR: "",
  priceForeignCurrency: "",
  purchasePrice: "",
  setPrice: "",
  discount: "",
  shippingCharges: "",
  vendorId: NONE,
  voucherNumber: "",
  billDate: "",
  remarks: "",
});

/** Maps an ISO timestamp (or yyyy-mm-dd) to a yyyy-mm-dd value for <input type="date">. */
const isoToDateInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const detailToForm = (d: CopyDetailsDetail): FormState => ({
  accessNumber: d.accessNumber ?? "",
  oldAccessNumber: d.oldAccessNumber ?? "",
  rfidNumber: d.rfidNumber ?? "",
  isbn: d.isbn ?? "",
  publishedYear: d.publishedYear ?? "",
  type: d.type ?? "",
  issueType: d.issueType ?? "",
  itemCategoryId: d.itemCategoryId != null ? String(d.itemCategoryId) : NONE,
  statusId: d.statusId != null ? String(d.statusId) : NONE,
  bindingTypeId: d.bindingTypeId != null ? String(d.bindingTypeId) : NONE,
  authorTypeId: d.authorTypeId != null ? String(d.authorTypeId) : NONE,
  entryModeId: d.enntryModeId != null ? String(d.enntryModeId) : NONE,
  branchId: d.branchId != null ? String(d.branchId) : NONE,
  rackId: d.rackId != null ? String(d.rackId) : NONE,
  shelfId: d.shelfId != null ? String(d.shelfId) : NONE,
  enclosureId: d.enclosureId != null ? String(d.enclosureId) : NONE,
  numberOfEnclosures: d.numberOfEnclosures != null ? String(d.numberOfEnclosures) : "",
  bookVolume: d.bookVolume ?? "",
  bookPart: d.bookPart ?? "",
  bookPartInfo: d.bookPartInfo ?? "",
  volumeInfo: d.volumeInfo ?? "",
  numberOfPages: d.numberOfPages != null ? String(d.numberOfPages) : "",
  bookSize: d.bookSize ?? "",
  prefix: d.prefix ?? "",
  suffix: d.suffix ?? "",
  theftBitArmed: d.theftBitArmed ?? false,
  priceInINR: d.priceInINR ?? "",
  priceForeignCurrency: d.priceForeignCurrency ?? "",
  purchasePrice: d.purchasePrice ?? "",
  setPrice: d.setPrice ?? "",
  discount: d.discount ?? "",
  shippingCharges: d.shippingCharges ?? "",
  vendorId: d.vendorId != null ? String(d.vendorId) : NONE,
  voucherNumber: d.voucherNumber ?? "",
  billDate: isoToDateInput(d.billDate),
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
  rfidNumber: f.rfidNumber.trim() || null,
  isbn: f.isbn.trim() || null,
  publishedYear: f.publishedYear.trim() || null,
  type: f.type.trim() || null,
  issueType: f.issueType.trim() || null,
  itemCategoryId: f.itemCategoryId === NONE ? null : Number(f.itemCategoryId),
  statusId: f.statusId === NONE ? null : Number(f.statusId),
  bindingTypeId: f.bindingTypeId === NONE ? null : Number(f.bindingTypeId),
  authorTypeId: f.authorTypeId === NONE ? null : Number(f.authorTypeId),
  enntryModeId: f.entryModeId === NONE ? null : Number(f.entryModeId),
  branchId: f.branchId === NONE ? null : Number(f.branchId),
  rackId: f.rackId === NONE ? null : Number(f.rackId),
  shelfId: f.shelfId === NONE ? null : Number(f.shelfId),
  enclosureId: f.enclosureId === NONE ? null : Number(f.enclosureId),
  numberOfEnclosures: parseOptionalCount(f.numberOfEnclosures),
  bookVolume: f.bookVolume.trim() || null,
  bookPart: f.bookPart.trim() || null,
  bookPartInfo: f.bookPartInfo.trim() || null,
  volumeInfo: f.volumeInfo.trim() || null,
  numberOfPages: parseOptionalCount(f.numberOfPages),
  bookSize: f.bookSize.trim() || null,
  prefix: f.prefix.trim() || null,
  suffix: f.suffix.trim() || null,
  theftBitArmed: f.theftBitArmed,
  priceInINR: f.priceInINR.trim() || null,
  priceForeignCurrency: f.priceForeignCurrency.trim() || null,
  purchasePrice: f.purchasePrice.trim() || null,
  setPrice: f.setPrice.trim() || null,
  discount: f.discount.trim() || null,
  shippingCharges: f.shippingCharges.trim() || null,
  vendorId: f.vendorId === NONE ? null : Number(f.vendorId),
  voucherNumber: f.voucherNumber.trim() || null,
  billDate: f.billDate.trim() || null,
  remarks: f.remarks.trim() || null,
});

type GeoOption = { id: number; name: string | null };
type CopyAddressForm = {
  addressLine: string;
  countryId: string;
  stateId: string;
  cityId: string;
  pincode: string;
  landmark: string;
};
const emptyCopyAddress = (): CopyAddressForm => ({
  addressLine: "",
  countryId: NONE,
  stateId: NONE,
  cityId: NONE,
  pincode: "",
  landmark: "",
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
  const [addressForm, setAddressForm] = useState<CopyAddressForm>(emptyCopyAddress());
  const [addressLoading, setAddressLoading] = useState(false);
  const [countries, setCountries] = useState<GeoOption[]>([]);
  const [states, setStates] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);

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

  // Load the copy's address into the editable form (reset for a new copy).
  useEffect(() => {
    if (!open) return;
    if (copyId == null) {
      setAddressForm(emptyCopyAddress());
      return;
    }
    let cancelled = false;
    setAddressLoading(true);
    void getCopyAddress(copyId)
      .then((a) => {
        if (cancelled) return;
        setAddressForm({
          addressLine: a.addressLine ?? "",
          countryId: a.countryId != null ? String(a.countryId) : NONE,
          stateId: a.stateId != null ? String(a.stateId) : NONE,
          cityId: a.cityId != null ? String(a.cityId) : NONE,
          pincode: a.pincode ?? "",
          landmark: a.landmark ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setAddressForm(emptyCopyAddress());
      })
      .finally(() => {
        if (!cancelled) setAddressLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, copyId]);

  // Geo dropdown options (cascading: country -> state -> city).
  useEffect(() => {
    void getAllCountries()
      .then((rows) =>
        setCountries(
          rows.filter((c) => c.id != null).map((c) => ({ id: c.id as number, name: c.name })),
        ),
      )
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (addressForm.countryId === NONE) {
      setStates([]);
      return;
    }
    let cancelled = false;
    void getStatesByCountry(Number(addressForm.countryId))
      .then((rows) => {
        if (!cancelled) setStates(rows.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [addressForm.countryId]);

  useEffect(() => {
    if (addressForm.stateId === NONE) {
      setCities([]);
      return;
    }
    let cancelled = false;
    void getCitiesByState(Number(addressForm.stateId))
      .then((rows) => {
        if (!cancelled)
          setCities(
            rows.filter((c) => c.id != null).map((c) => ({ id: c.id as number, name: c.name })),
          );
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [addressForm.stateId]);

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
  const formComboAuthorTypes = useMemo(
    () =>
      comboWithNone(
        (meta?.authorTypes ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.authorTypes],
  );
  const formComboItemCategories = useMemo(
    () =>
      comboWithNone(
        (meta?.itemCategories ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.itemCategories],
  );
  const formComboVendors = useMemo(
    () =>
      comboWithNone(
        (meta?.vendors ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.vendors],
  );
  const formComboBranches = useMemo(
    () =>
      comboWithNone(
        (meta?.branches ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.branches],
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const body = formToBody(form, bookId);
      let savedCopyId: number;
      if (copyId == null) {
        const res = await createCopyDetails(body);
        savedCopyId = res.payload.id;
        toast.success("Copy added");
      } else {
        await updateCopyDetails(copyId, body);
        savedCopyId = copyId;
        toast.success("Copy updated");
      }
      try {
        await saveCopyAddress(savedCopyId, {
          addressLine: addressForm.addressLine.trim() || null,
          countryId: addressForm.countryId === NONE ? null : Number(addressForm.countryId),
          stateId: addressForm.stateId === NONE ? null : Number(addressForm.stateId),
          cityId: addressForm.cityId === NONE ? null : Number(addressForm.cityId),
          pincode: addressForm.pincode.trim() || null,
          landmark: addressForm.landmark.trim() || null,
        });
      } catch (e) {
        console.error(e);
        toast.error("Copy saved, but address could not be saved");
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-3xl">
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
          <div className="grid max-h-[min(70vh,560px)] gap-5 overflow-y-auto py-2 pr-1">
            {/* Identification */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identification
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Access number</Label>
                  <Input
                    value={form.accessNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accessNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Old access number</Label>
                  <Input
                    value={form.oldAccessNumber}
                    onChange={(e) => setForm((f) => ({ ...f, oldAccessNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RFID number</Label>
                  <Input
                    value={form.rfidNumber}
                    onChange={(e) => setForm((f) => ({ ...f, rfidNumber: e.target.value }))}
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
              </div>
            </section>

            {/* Classification */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Classification
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Label className="text-xs">Item category</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Item category"
                    value={form.itemCategoryId}
                    dataArr={formComboItemCategories}
                    onChange={(v) => setForm((f) => ({ ...f, itemCategoryId: v }))}
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
                  <Label className="text-xs">Author type</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Author type"
                    value={form.authorTypeId}
                    dataArr={formComboAuthorTypes}
                    onChange={(v) => setForm((f) => ({ ...f, authorTypeId: v }))}
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
              </div>
            </section>

            {/* Location */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Branch"
                    value={form.branchId}
                    dataArr={formComboBranches}
                    onChange={(v) => setForm((f) => ({ ...f, branchId: v }))}
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
                  <Label className="text-xs">No. of enclosures</Label>
                  <Input
                    value={form.numberOfEnclosures}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfEnclosures: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* Physical */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Physical
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Book volume</Label>
                  <Input
                    value={form.bookVolume}
                    onChange={(e) => setForm((f) => ({ ...f, bookVolume: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Book part</Label>
                  <Input
                    value={form.bookPart}
                    onChange={(e) => setForm((f) => ({ ...f, bookPart: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Book part info</Label>
                  <Input
                    value={form.bookPartInfo}
                    onChange={(e) => setForm((f) => ({ ...f, bookPartInfo: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Volume info</Label>
                  <Input
                    value={form.volumeInfo}
                    onChange={(e) => setForm((f) => ({ ...f, volumeInfo: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">No. of pages</Label>
                  <Input
                    value={form.numberOfPages}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfPages: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Book size</Label>
                  <Input
                    value={form.bookSize}
                    onChange={(e) => setForm((f) => ({ ...f, bookSize: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prefix</Label>
                  <Input
                    value={form.prefix}
                    onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Suffix</Label>
                  <Input
                    value={form.suffix}
                    onChange={(e) => setForm((f) => ({ ...f, suffix: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-6">
                  <Label className="text-xs">Theft bit armed</Label>
                  <Switch
                    checked={form.theftBitArmed}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, theftBitArmed: v }))}
                  />
                </div>
              </div>
            </section>

            {/* Pricing & acquisition */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pricing &amp; acquisition
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹)</Label>
                  <Input
                    value={form.priceInINR}
                    onChange={(e) => setForm((f) => ({ ...f, priceInINR: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (foreign)</Label>
                  <Input
                    value={form.priceForeignCurrency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priceForeignCurrency: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Purchase price</Label>
                  <Input
                    value={form.purchasePrice}
                    onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Set price</Label>
                  <Input
                    value={form.setPrice}
                    onChange={(e) => setForm((f) => ({ ...f, setPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Discount</Label>
                  <Input
                    value={form.discount}
                    onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Shipping charges</Label>
                  <Input
                    value={form.shippingCharges}
                    onChange={(e) => setForm((f) => ({ ...f, shippingCharges: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vendor</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Vendor"
                    value={form.vendorId}
                    dataArr={formComboVendors}
                    onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
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
                  <Label className="text-xs">Bill date</Label>
                  <Input
                    type="date"
                    value={form.billDate}
                    onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* Copy address */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Copy address
                </h4>
                {addressLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label className="text-xs font-medium">Address line</Label>
                  <Input
                    className="h-10"
                    value={addressForm.addressLine ?? ""}
                    onChange={(e) => setAddressForm((a) => ({ ...a, addressLine: e.target.value }))}
                    placeholder="Street / building / area"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Country</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Country"
                    value={addressForm.countryId}
                    dataArr={[
                      { value: NONE, label: "— None —" },
                      ...countries.map((c) => ({
                        value: String(c.id),
                        label: c.name ?? `#${c.id}`,
                      })),
                    ]}
                    onChange={(v) =>
                      setAddressForm((a) => ({ ...a, countryId: v, stateId: NONE, cityId: NONE }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">State</Label>
                  <Combobox
                    className="h-10"
                    placeholder={addressForm.countryId === NONE ? "Select country first" : "State"}
                    value={addressForm.stateId}
                    dataArr={[
                      { value: NONE, label: "— None —" },
                      ...states.map((s) => ({
                        value: String(s.id),
                        label: s.name ?? `#${s.id}`,
                      })),
                    ]}
                    onChange={(v) => setAddressForm((a) => ({ ...a, stateId: v, cityId: NONE }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">City</Label>
                  <Combobox
                    className="h-10"
                    placeholder={addressForm.stateId === NONE ? "Select state first" : "City"}
                    value={addressForm.cityId}
                    dataArr={[
                      { value: NONE, label: "— None —" },
                      ...cities.map((c) => ({
                        value: String(c.id),
                        label: c.name ?? `#${c.id}`,
                      })),
                    ]}
                    onChange={(v) => setAddressForm((a) => ({ ...a, cityId: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pincode</Label>
                  <Input
                    className="h-10"
                    value={addressForm.pincode ?? ""}
                    onChange={(e) => setAddressForm((a) => ({ ...a, pincode: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Landmark</Label>
                  <Input
                    className="h-10"
                    value={addressForm.landmark ?? ""}
                    onChange={(e) => setAddressForm((a) => ({ ...a, landmark: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* Remarks */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Remarks
              </h4>
              <div className="space-y-1.5">
                <Input
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </div>
            </section>
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
