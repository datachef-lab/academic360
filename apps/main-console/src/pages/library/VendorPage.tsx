import React, { useCallback, useEffect, memo, useState } from "react";
import { Building2, Search, ChevronLeft, ChevronRight, Loader2, Edit, Trash2 } from "lucide-react";
import { LibraryMasterHeaderActions } from "@/pages/library/components/LibraryMasterHeaderActions";
import { downloadCsv } from "@/pages/library/utils/download-csv";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useCreateVendor,
  useVendorsData,
  useUpdateVendor,
  useDeleteVendor,
  type LibraryVendorRow,
  type VendorBody,
} from "@/services/vendor.service";
import useDebounce from "@/components/Hooks/useDebounce";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";

// ── Constants ─────────────────────────────────────────────────────────────────

const LIMIT = 10;

const EMPTY_FORM: VendorFormValues = {
  name: "",
  code: "",
  email: "",
  phone: "",
  pan: "",
  website: "",
  personOfContact: "",
  personOfContactEmail: "",
  personOfContactPhone: "",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type LibraryVendorSocketUpdate = {
  id: string;
  type: "library_vendor_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  vendorId: number;
  vendorName: string;
  message: string;
  updatedAt: string;
};

type VendorFormValues = {
  name: string;
  code: string;
  email: string;
  phone: string;
  pan: string;
  website: string;
  personOfContact: string;
  personOfContactEmail: string;
  personOfContactPhone: string;
};

// ── Utils ─────────────────────────────────────────────────────────────────────

const nullify = (v: string) => v.trim() || null;

const rowToForm = (row: LibraryVendorRow): VendorFormValues => ({
  name: row.name,
  code: row.code ?? "",
  email: row.email,
  phone: row.phone,
  pan: row.pan,
  website: row.website ?? "",
  personOfContact: row.personOfContact ?? "",
  personOfContactEmail: row.personOfContactEmail ?? "",
  personOfContactPhone: row.personOfContactPhone ?? "",
});

const formToBody = (v: VendorFormValues): VendorBody => ({
  name: v.name.trim(),
  email: v.email.trim(),
  phone: v.phone.trim(),
  pan: v.pan.trim(),
  legacyVendorId: null,
  code: nullify(v.code),
  website: nullify(v.website),
  personOfContact: nullify(v.personOfContact),
  personOfContactEmail: nullify(v.personOfContactEmail),
  personOfContactPhone: nullify(v.personOfContactPhone),
});

// ── Field ─────────────────────────────────────────────────────────────────────

const Field = memo(
  ({
    label,
    error,
    colSpan2,
    children,
  }: {
    label: string;
    error?: string;
    colSpan2?: boolean;
    children: React.ReactNode;
  }) => (
    <div className={`space-y-1${colSpan2 ? " sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);

// ── RowActions ────────────────────────────────────────────────────────────────

const RowActions = memo(
  ({
    row,
    onEdit,
    onDelete,
  }: {
    row: LibraryVendorRow;

    onEdit: (v: LibraryVendorRow) => void;
    onDelete: (v: LibraryVendorRow) => void;
  }) => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 w-7 p-0"
        onClick={() => onEdit(row)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="h-7 w-7 p-0"
        onClick={() => onDelete(row)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ),
);

// ── VendorForm ────────────────────────────────────────────────────────────────

const VendorForm = memo(
  ({ editingRow, onClose }: { editingRow: LibraryVendorRow | null; onClose: () => void }) => {
    const { mutate: createVendor } = useCreateVendor();
    const { mutate: updateVendor } = useUpdateVendor();
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<VendorFormValues>({ defaultValues: EMPTY_FORM });

    useEffect(() => {
      reset(editingRow ? rowToForm(editingRow) : EMPTY_FORM);
    }, [editingRow, reset]);

    const onSubmit = useCallback(
      (values: VendorFormValues) => {
        const body = formToBody(values);
        if (editingRow) {
          updateVendor({ id: editingRow.id, body }, { onSuccess: onClose });
        } else {
          createVendor(body, { onSuccess: onClose });
        }
      },
      [editingRow, createVendor, updateVendor, onClose],
    );

    return (
      <form onSubmit={handleSubmit(onSubmit)} id="vendor-form">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field label="Name *" error={errors.name?.message}>
            <Input
              placeholder="e.g. ABC Technologies"
              {...register("name", { required: "Name is required" })}
            />
          </Field>

          <Field label="Code" error={errors.code?.message}>
            <Input placeholder="e.g. VEN001" {...register("code")} />
          </Field>

          <Field label="Email *" error={errors.email?.message}>
            <Input
              type="email"
              placeholder="vendor@example.com"
              {...register("email", { required: "Email is required" })}
            />
          </Field>

          <Field label="Phone *" error={errors.phone?.message}>
            <Input
              placeholder="9876543210"
              {...register("phone", { required: "Phone is required" })}
            />
          </Field>

          <Field label="PAN Number *" error={errors.pan?.message}>
            <Input placeholder="ABCDE1234F" {...register("pan", { required: "PAN is required" })} />
          </Field>

          <Field label="Website" error={errors.website?.message}>
            <Input placeholder="www.example.com" {...register("website")} />
          </Field>

          <Field label="Person of Contact" error={errors.personOfContact?.message}>
            <Input placeholder="John Doe" {...register("personOfContact")} />
          </Field>

          <Field label=" Person of Contact Email" error={errors.personOfContactEmail?.message}>
            <Input
              type="email"
              placeholder="john@example.com"
              {...register("personOfContactEmail")}
            />
          </Field>

          <Field
            label="Person of Contact Phone"
            error={errors.personOfContactPhone?.message}
            colSpan2
          >
            <Input placeholder="9876500001" {...register("personOfContactPhone")} />
          </Field>
        </div>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vendor-form" className="w-full sm:w-auto">
            {editingRow ? "Edit " : "Save "}
          </Button>
        </DialogFooter>
      </form>
    );
  },
);

// ── DeleteDialog ──────────────────────────────────────────────────────────────

const DeleteDialog = memo(
  ({ target, onClose }: { target: LibraryVendorRow | null; onClose: () => void }) => {
    const { mutate: deleteVendor } = useDeleteVendor();

    const handleConfirm = () => {
      if (!target) return;
      deleteVendor(target.id, { onSuccess: onClose });
    };

    return (
      <Dialog open={!!target} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{target?.name}</span>? This action
            cannot be undone.
          </p>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

// ── VendorTable ───────────────────────────────────────────────────────────────

const VendorTable = memo(
  ({
    vendorsData,
    page,
    onEdit,
    onDelete,
  }: {
    vendorsData: LibraryVendorRow[];
    page: number;
    onEdit: (row: LibraryVendorRow) => void;
    onDelete: (row: LibraryVendorRow) => void;
  }) => (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="bg-slate-100 w-10">#</TableHead>
            <TableHead className="bg-slate-100">Name</TableHead>
            <TableHead className="bg-slate-100">Code</TableHead>
            <TableHead className="bg-slate-100">Email</TableHead>
            <TableHead className="bg-slate-100">Phone</TableHead>
            <TableHead className="bg-slate-100">Website</TableHead>
            <TableHead className="bg-slate-100">PAN</TableHead>
            <TableHead className="bg-slate-100">Person of Contact</TableHead>
            <TableHead className="bg-slate-100">Person of Contact Email</TableHead>
            <TableHead className="bg-slate-100">Person of Contact Phone</TableHead>

            <TableHead className="bg-slate-100 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendorsData.map((vendor, index) => (
            <TableRow key={vendor.id}>
              <TableCell>{(page - 1) * LIMIT + index + 1}</TableCell>
              <TableCell className="font-medium">{vendor.name}</TableCell>
              <TableCell>{vendor.code ?? "—"}</TableCell>
              <TableCell>{vendor.email}</TableCell>
              <TableCell>{vendor.phone}</TableCell>
              <TableCell>{vendor.website ?? "—"}</TableCell>
              <TableCell>{vendor.pan}</TableCell>
              <TableCell>{vendor.personOfContact ?? "—"}</TableCell>
              <TableCell>{vendor.personOfContactEmail ?? "—"}</TableCell>
              <TableCell>{vendor.personOfContactPhone ?? "—"}</TableCell>

              <TableCell className="text-right align-top">
                <RowActions row={vendor} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
);

// ── Page ──────────────────────────────────────────────────────────────────────

const VendorPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LibraryVendorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryVendorRow | null>(null);
  const { user } = useAuth();
  const userId = user?.id?.toString();

  const { socket, isConnected } = useSocket({ userId });

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isFetching, isError, refetch } = useVendorsData({
    page,
    limit: LIMIT,
    search: debouncedSearch,
  });

  const vendorsData = data?.payload?.rows ?? [];
  const total = data?.payload?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const openAdd = useCallback(() => {
    setEditingRow(null);
    setIsFormOpen(true);
  }, []);
  const openEdit = useCallback((row: LibraryVendorRow) => {
    setEditingRow(row);
    setIsFormOpen(true);
  }, []);
  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingRow(null);
  }, []);
  const openDelete = useCallback((row: LibraryVendorRow) => setDeleteTarget(row), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_vendors");

    const handleVendorUpdate = (data: LibraryVendorSocketUpdate) => {
      toast.info(data.message);
      void refetch();
    };

    socket.on("library_vendor_update", handleVendorUpdate);

    return () => {
      socket.off("library_vendor_update", handleVendorUpdate);
      socket.emit("unsubscribe_library_vendors");
    };
  }, [socket, isConnected, refetch]);

  const handleDownload = () => {
    downloadCsv(
      "library-vendors.csv",
      [
        "#",
        "Name",
        "Code",
        "Email",
        "Phone",
        "Website",
        "PAN",
        "Person of Contact",
        "Person of Contact Email",
        "Person of Contact Phone",
      ],
      vendorsData.map((vendor, index) => [
        String((page - 1) * LIMIT + index + 1),
        vendor.name,
        vendor.code ?? "—",
        vendor.email,
        vendor.phone,
        vendor.website ?? "—",
        vendor.pan,
        vendor.personOfContact ?? "—",
        vendor.personOfContactEmail ?? "—",
        vendor.personOfContactPhone ?? "—",
      ]),
    );
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      {/* Header */}
      <div className="mb-3 rounded-md border bg-background p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center text-lg font-semibold sm:text-xl">
              <Building2 className="mr-2 h-8 w-8 shrink-0 rounded-md border p-1" />
              <span className="truncate">Vendors</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage vendor master data.
            </p>
          </div>
          <LibraryMasterHeaderActions onDownload={handleDownload} onAdd={openAdd} />
        </div>
      </div>

      {/* Search */}
      <div className="mb-3 border-b px-0 py-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearchChange}
            className="pl-9 w-full"
            placeholder="Search vendor..."
          />
        </div>
      </div>

      {/* Table area */}
      <div className="relative min-w-0 px-2 sm:px-0">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : isError ? (
          <div className="flex min-h-[320px] items-center justify-center text-red-500">
            Failed to load vendors. Please try again.
          </div>
        ) : vendorsData.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center text-slate-500">
            No vendors found.
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="absolute right-4 top-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
              </div>
            )}

            <VendorTable
              vendorsData={vendorsData}
              page={page}
              onEdit={openEdit}
              onDelete={openDelete}
            />

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between px-4 text-sm">
              <span className="text-muted-foreground">
                Showing {from} – {to} of {total} vendors
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="min-w-[80px] text-center text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Next</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <VendorForm editingRow={editingRow} onClose={closeForm} />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog target={deleteTarget} onClose={closeDelete} />
    </div>
  );
};

export default VendorPage;
