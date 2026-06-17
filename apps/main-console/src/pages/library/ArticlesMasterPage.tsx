import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, ScrollText, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import type {
  LibraryArticleRow,
  LibraryArticleUpsertBody,
} from "@/services/library-articles.service";
import {
  createLibraryArticle,
  deleteLibraryArticle,
  getLibraryArticleById,
  getLibraryArticles,
  updateLibraryArticle,
} from "@/services/library-articles.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";

type LibraryArticleSocketUpdate = {
  id: string;
  type: "library_article_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  articleId: number;
  articleName: string;
  message: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  code: string;
  isDocumentTypeExist: boolean;
  isUniqueAccessNumber: boolean;
  isJournal: boolean;
  isAuthor: boolean;
  isImprint: boolean;
  isCopyDetail: boolean;
  isKeyword: boolean;
  isRemarks: boolean;
  isCallNumber: boolean;
  isEnclosure: boolean;
  isVoucher: boolean;
  isAnalytical: boolean;
  isCallNumberAuto: boolean;
  isCallNumberCompulsory: boolean;
  isPublisher: boolean;
  isNote: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  code: "",
  isDocumentTypeExist: false,
  isUniqueAccessNumber: false,
  isJournal: false,
  isAuthor: false,
  isImprint: false,
  isCopyDetail: false,
  isKeyword: false,
  isRemarks: false,
  isCallNumber: false,
  isEnclosure: false,
  isVoucher: false,
  isAnalytical: false,
  isCallNumberAuto: false,
  isCallNumberCompulsory: false,
  isPublisher: false,
  isNote: false,
});

const detailToForm = (d: LibraryArticleRow): FormState => ({
  name: d.name ?? "",
  code: d.code ?? "",
  isDocumentTypeExist: Boolean(d.isDocumentTypeExist),
  isUniqueAccessNumber: Boolean(d.isUniqueAccessNumber),
  isJournal: Boolean(d.isJournal),
  isAuthor: Boolean(d.isAuthor),
  isImprint: Boolean(d.isImprint),
  isCopyDetail: Boolean(d.isCopyDetail),
  isKeyword: Boolean(d.isKeyword),
  isRemarks: Boolean(d.isRemarks),
  isCallNumber: Boolean(d.isCallNumber),
  isEnclosure: Boolean(d.isEnclosure),
  isVoucher: Boolean(d.isVoucher),
  isAnalytical: Boolean(d.isAnalytical),
  isCallNumberAuto: Boolean(d.isCallNumberAuto),
  isCallNumberCompulsory: Boolean(d.isCallNumberCompulsory),
  isPublisher: Boolean(d.isPublisher),
  isNote: Boolean(d.isNote),
});

const formToBody = (f: FormState): LibraryArticleUpsertBody => ({
  name: f.name.trim(),
  code: f.code.trim() ? f.code.trim() : null,
  isDocumentTypeExist: f.isDocumentTypeExist,
  isUniqueAccessNumber: f.isUniqueAccessNumber,
  isJournal: f.isJournal,
  isAuthor: f.isAuthor,
  isImprint: f.isImprint,
  isCopyDetail: f.isCopyDetail,
  isKeyword: f.isKeyword,
  isRemarks: f.isRemarks,
  isCallNumber: f.isCallNumber,
  isEnclosure: f.isEnclosure,
  isVoucher: f.isVoucher,
  isAnalytical: f.isAnalytical,
  isCallNumberAuto: f.isCallNumberAuto,
  isCallNumberCompulsory: f.isCallNumberCompulsory,
  isPublisher: f.isPublisher,
  isNote: f.isNote,
});

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function FlagBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={[
        "whitespace-nowrap text-xs",
        value
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-700",
      ].join(" ")}
    >
      {label}: {value ? "Yes" : "No"}
    </Badge>
  );
}

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LibraryArticleRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryArticleRow) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700"
        onClick={() => onDelete(row)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ArticlesMasterPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<LibraryArticleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryArticleRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryArticles({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_articles");

    const handleUpdate = (data: LibraryArticleSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_article_update", handleUpdate);

    return () => {
      socket.off("library_article_update", handleUpdate);
      socket.emit("unsubscribe_library_articles");
    };
  }, [socket, isConnected, fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getLibraryArticleById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load article");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createLibraryArticle(body);
        toast.success("Article created");
      } else {
        await updateLibraryArticle(editingId, body);
        toast.success("Article updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save article");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (row: LibraryArticleRow) => {
    setDeleteTarget(row);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteInProgress(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryArticle(deleteTarget.id);
      toast.success("Article deleted");
      closeDeleteDialog();
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const formCheckboxGrid = useMemo(() => {
    const items: Array<{ key: keyof FormState; label: string }> = [
      { key: "isDocumentTypeExist", label: "Document type exists" },
      { key: "isUniqueAccessNumber", label: "Unique access #" },
      { key: "isJournal", label: "Journal" },
      { key: "isAuthor", label: "Author" },
      { key: "isImprint", label: "Imprint" },
      { key: "isCopyDetail", label: "Copy detail" },
      { key: "isKeyword", label: "Keyword" },
      { key: "isRemarks", label: "Remarks" },
      { key: "isCallNumber", label: "Call number" },
      { key: "isEnclosure", label: "Enclosure" },
      { key: "isVoucher", label: "Voucher" },
      { key: "isAnalytical", label: "Analytical" },
      { key: "isCallNumberAuto", label: "Call # auto" },
      { key: "isCallNumberCompulsory", label: "Call # compulsory" },
      { key: "isPublisher", label: "Publisher" },
      { key: "isNote", label: "Note" },
    ];
    return items;
  }, []);

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <ScrollText className="mr-2 h-8 w-8 rounded-md border p-1" />
                Articles
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Configure article flags used by the library catalog.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add article
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="mb-3 border-b bg-background px-2 py-3 sm:px-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search by name or code..."
                value={searchInput}
                onChange={(e) => {
                  setPage(1);
                  setSearchInput(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="relative min-w-0 px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No articles found.
              </div>
            ) : (
              <>
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pb-2 lg:hidden">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-card p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          #{(page - 1) * limit + i + 1}
                        </span>
                        <RowActions row={row} onEdit={openEdit} onDelete={openDeleteDialog} />
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 underline underline-offset-2">
                          {row.name}
                        </p>
                        {row.code?.trim() ? (
                          <p className="text-xs text-muted-foreground">Code: {row.code}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Code: —</p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <FlagBadge value={row.isJournal} label="Journal" />
                        <FlagBadge value={row.isAuthor} label="Author" />
                        <FlagBadge value={row.isDocumentTypeExist} label="Doc type" />
                        <FlagBadge value={row.isUniqueAccessNumber} label="Unique #" />
                        <FlagBadge value={row.isCallNumber} label="Call #" />
                        <FlagBadge value={row.isEnclosure} label="Enclosure" />
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Updated: {parseDate(row.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[980px]">
                      <TableHeader className={STICKY_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={cn(STICKY_TH_LEFT, "w-10")}>#</TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[240px]")}>
                            Name
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[140px]")}>
                            Code
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[110px]")}>
                            Doc type
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[130px]")}>
                            Unique #
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>
                            Journal
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>
                            Updated
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_RIGHT, "w-[90px] text-right")}>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top whitespace-nowrap">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-900 underline underline-offset-2">
                                  {row.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Author: {row.isAuthor ? "Yes" : "No"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <span className="font-mono text-xs text-slate-800">
                                {row.code?.trim() ? row.code : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge
                                variant="outline"
                                className={
                                  row.isDocumentTypeExist
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }
                              >
                                {row.isDocumentTypeExist ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge
                                variant="outline"
                                className={
                                  row.isUniqueAccessNumber
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }
                              >
                                {row.isUniqueAccessNumber ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge
                                variant="outline"
                                className={
                                  row.isJournal
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }
                              >
                                {row.isJournal ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {parseDate(row.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <RowActions row={row} onEdit={openEdit} onDelete={openDeleteDialog} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-sm text-slate-600 sm:px-4">
            <span>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(96vw,980px)] overflow-y-auto p-0 sm:max-w-[980px]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{editingId == null ? "Add article" : "Edit article"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Article name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter article name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Optional code"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-slate-700">Flags</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {formCheckboxGrid.map((item) => (
                  <label
                    key={String(item.key)}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-muted/20 px-3 py-2"
                  >
                    <Checkbox
                      checked={Boolean(form[item.key])}
                      onCheckedChange={(v) =>
                        setForm(
                          (f) =>
                            ({
                              ...f,
                              [item.key]: v === true,
                            }) as FormState,
                        )
                      }
                    />
                    <span className="text-xs text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="ml-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.name}&quot;
                  </span>
                  . This cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteInProgress}
              onClick={() => void confirmDelete()}
            >
              {deleteInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
