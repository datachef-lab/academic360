import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ExternalLink,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  createReadingList,
  createReadingListItem,
  deleteReadingList,
  deleteReadingListItem,
  getReadingListItems,
  getReadingLists,
  updateReadingList,
} from "@/services/library-reading-lists.service";
import type {
  ReadingListItemRow,
  ReadingListItemUpsertBody,
  ReadingListRow,
  ReadingListUpsertBody,
} from "@/services/library-reading-lists.service";
import { Combobox } from "@/components/ui/combobox";
import { getProgramCourses } from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";
import { findAdminsAndStaff } from "@/services/user";
import { getBookList } from "@/services/books.service";
import { getJournalList } from "@/services/journal.service";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

type ListForm = {
  programCourseId: string;
  classId: string;
  facultyUserId: string;
  title: string;
  description: string;
  isPublished: boolean;
};

const emptyListForm = (): ListForm => ({
  programCourseId: "",
  classId: "",
  facultyUserId: "",
  title: "",
  description: "",
  isPublished: false,
});

const rowToListForm = (r: ReadingListRow): ListForm => ({
  programCourseId: String(r.programCourseId ?? ""),
  classId: r.classId != null ? String(r.classId) : "",
  facultyUserId: r.facultyUserId != null ? String(r.facultyUserId) : "",
  title: r.title ?? "",
  description: r.description ?? "",
  isPublished: r.isPublished ?? false,
});

const listFormToBody = (f: ListForm): ReadingListUpsertBody => ({
  programCourseId: Number(f.programCourseId),
  classId: f.classId ? Number(f.classId) : null,
  facultyUserId: f.facultyUserId ? Number(f.facultyUserId) : null,
  title: f.title.trim(),
  description: f.description.trim() || null,
  isPublished: f.isPublished,
});

type ItemForm = {
  itemType: "BOOK" | "JOURNAL" | "EXTERNAL_URL";
  bookId: string;
  journalId: string;
  externalUrl: string;
  externalTitle: string;
  notes: string;
  displayOrder: string;
};

const emptyItemForm = (): ItemForm => ({
  itemType: "BOOK",
  bookId: "",
  journalId: "",
  externalUrl: "",
  externalTitle: "",
  notes: "",
  displayOrder: "0",
});

const itemFormToBody = (f: ItemForm): ReadingListItemUpsertBody => ({
  itemType: f.itemType,
  bookId: f.itemType === "BOOK" && f.bookId ? Number(f.bookId) : null,
  journalId: f.itemType === "JOURNAL" && f.journalId ? Number(f.journalId) : null,
  externalUrl: f.itemType === "EXTERNAL_URL" ? f.externalUrl.trim() || null : null,
  externalTitle: f.externalTitle.trim() || null,
  notes: f.notes.trim() || null,
  displayOrder: Number(f.displayOrder || "0"),
});

export default function ReadingListsPage() {
  const [rows, setRows] = useState<ReadingListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const [items, setItems] = useState<ReadingListItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [listForm, setListForm] = useState<ListForm>(emptyListForm());
  const [savingList, setSavingList] = useState(false);
  const [confirmList, setConfirmList] = useState<ReadingListRow | null>(null);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm());
  const [savingItem, setSavingItem] = useState(false);

  const [programCourseOptions, setProgramCourseOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<{ value: string; label: string }[]>([]);
  const [bookOptions, setBookOptions] = useState<{ value: string; label: string }[]>([]);
  const [journalOptions, setJournalOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const [pcs, classes, faculty, books, journals] = await Promise.all([
          getProgramCourses(),
          getAllClasses(),
          findAdminsAndStaff(1, 500),
          getBookList({ page: 1, limit: 500 }),
          getJournalList({ page: 1, limit: 500 }),
        ]);
        setProgramCourseOptions(
          (pcs ?? []).map((p) => ({
            value: String(p.id),
            label: p.name ?? "",
          })),
        );
        setClassOptions(
          (classes ?? []).map((c) => ({
            value: String(c.id),
            label: c.name,
          })),
        );
        setFacultyOptions(
          (faculty ?? []).map((u) => ({
            value: String(u.id),
            label: u.name ?? `User #${u.id}`,
          })),
        );
        setBookOptions(
          (books.payload?.rows ?? []).map((b) => ({
            value: String(b.id),
            label: b.title,
          })),
        );
        setJournalOptions(
          (journals.payload?.rows ?? []).map((j) => ({
            value: String(j.id),
            label: j.title,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReadingLists({
        page,
        limit,
        search: debounced.trim() || undefined,
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load reading lists.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const fetchItems = useCallback(async (listId: number) => {
    setItemsLoading(true);
    try {
      const res = await getReadingListItems(listId);
      setItems(res.payload ?? []);
    } catch {
      toast.error("Failed to load reading list items.");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void fetchItems(selectedId);
    else setItems([]);
  }, [selectedId, fetchItems]);

  const onCreateList = () => {
    setEditingId(null);
    setListForm(emptyListForm());
    setListDialogOpen(true);
  };

  const onEditList = (r: ReadingListRow) => {
    setEditingId(r.id);
    setListForm(rowToListForm(r));
    setListDialogOpen(true);
  };

  const onSubmitList = async () => {
    if (!listForm.title.trim() || !listForm.programCourseId) {
      toast.error("Title and program course ID are required.");
      return;
    }
    setSavingList(true);
    try {
      if (editingId) {
        await updateReadingList(editingId, listFormToBody(listForm));
        toast.success("Reading list updated.");
      } else {
        await createReadingList(listFormToBody(listForm));
        toast.success("Reading list created.");
      }
      setListDialogOpen(false);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Save failed.";
      toast.error(msg);
    } finally {
      setSavingList(false);
    }
  };

  const onDeleteList = async () => {
    if (!confirmList) return;
    try {
      await deleteReadingList(confirmList.id);
      toast.success("Reading list deleted.");
      if (selectedId === confirmList.id) setSelectedId(null);
      setConfirmList(null);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Delete failed.";
      toast.error(msg);
    }
  };

  const onAddItem = () => {
    setItemForm(emptyItemForm());
    setItemDialogOpen(true);
  };

  const onSubmitItem = async () => {
    if (!selectedId) return;
    if (itemForm.itemType === "BOOK" && !itemForm.bookId) {
      toast.error("Book ID is required.");
      return;
    }
    if (itemForm.itemType === "JOURNAL" && !itemForm.journalId) {
      toast.error("Journal ID is required.");
      return;
    }
    if (itemForm.itemType === "EXTERNAL_URL" && !itemForm.externalUrl.trim()) {
      toast.error("URL is required.");
      return;
    }
    setSavingItem(true);
    try {
      await createReadingListItem(selectedId, itemFormToBody(itemForm));
      toast.success("Item added.");
      setItemDialogOpen(false);
      void fetchItems(selectedId);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add item.";
      toast.error(msg);
    } finally {
      setSavingItem(false);
    }
  };

  const onDeleteItem = async (itemId: number) => {
    try {
      await deleteReadingListItem(itemId);
      if (selectedId) void fetchItems(selectedId);
    } catch {
      toast.error("Failed to remove item.");
    }
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={ListChecks}
        title="Reading Lists"
        subtitle="Curated lists of books, journals, and external resources per program-course / class."
        actions={
          <Button onClick={onCreateList} className="gap-1">
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No reading lists yet.</div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-lg border p-3 text-left transition hover:bg-indigo-50 ${
                      selectedId === r.id ? "border-indigo-400 bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="truncate text-xs text-gray-500">
                          {r.programCourseName ?? `Course #${r.programCourseId}`}
                          {r.className ? ` · ${r.className}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {r.isPublished ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditList(r);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmList(r);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {total > limit ? (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {page} / {Math.max(1, Math.ceil(total / limit))}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              {selected ? selected.title : "Select a reading list"}
            </CardTitle>
            {selected ? (
              <Button onClick={onAddItem} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Add item
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Pick a reading list to manage its items.
              </div>
            ) : itemsLoading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No items in this list yet.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-indigo-700">
                          {it.itemType}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium">
                        {it.externalTitle ??
                          (it.itemType === "BOOK"
                            ? `Book #${it.bookId}`
                            : it.itemType === "JOURNAL"
                              ? `Journal #${it.journalId}`
                              : (it.externalUrl ?? ""))}
                      </p>
                      {it.itemType === "EXTERNAL_URL" && it.externalUrl ? (
                        <a
                          href={it.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                        >
                          {it.externalUrl} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                      {it.notes ? <p className="mt-1 text-xs text-gray-500">{it.notes}</p> : null}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600"
                      onClick={() => onDeleteItem(it.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* List Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit reading list" : "New reading list"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={listForm.title}
                onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Program Course *</Label>
                <Combobox
                  placeholder="Select program course"
                  value={listForm.programCourseId}
                  dataArr={programCourseOptions}
                  onChange={(v) => setListForm({ ...listForm, programCourseId: v })}
                />
              </div>
              <div>
                <Label>Class</Label>
                <Combobox
                  placeholder="Select class"
                  value={listForm.classId}
                  dataArr={classOptions}
                  onChange={(v) => setListForm({ ...listForm, classId: v })}
                />
              </div>
            </div>
            <div>
              <Label>Faculty</Label>
              <Combobox
                placeholder="Select faculty"
                value={listForm.facultyUserId}
                dataArr={facultyOptions}
                onChange={(v) => setListForm({ ...listForm, facultyUserId: v })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={listForm.description}
                onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rl-published"
                type="checkbox"
                checked={listForm.isPublished}
                onChange={(e) => setListForm({ ...listForm, isPublished: e.target.checked })}
              />
              <Label htmlFor="rl-published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListDialogOpen(false)}
              disabled={savingList}
            >
              Cancel
            </Button>
            <Button onClick={onSubmitList} disabled={savingList}>
              {savingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Tabs
              value={itemForm.itemType}
              onValueChange={(v) =>
                setItemForm({
                  ...itemForm,
                  itemType: v as ItemForm["itemType"],
                })
              }
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="BOOK">Book</TabsTrigger>
                <TabsTrigger value="JOURNAL">Journal</TabsTrigger>
                <TabsTrigger value="EXTERNAL_URL">URL</TabsTrigger>
              </TabsList>
            </Tabs>

            {itemForm.itemType === "BOOK" ? (
              <div>
                <Label>Book *</Label>
                <Combobox
                  placeholder="Select book"
                  value={itemForm.bookId}
                  dataArr={bookOptions}
                  onChange={(v) => setItemForm({ ...itemForm, bookId: v })}
                />
              </div>
            ) : null}

            {itemForm.itemType === "JOURNAL" ? (
              <div>
                <Label>Journal *</Label>
                <Combobox
                  placeholder="Select journal"
                  value={itemForm.journalId}
                  dataArr={journalOptions}
                  onChange={(v) => setItemForm({ ...itemForm, journalId: v })}
                />
              </div>
            ) : null}

            {itemForm.itemType === "EXTERNAL_URL" ? (
              <div>
                <Label>URL *</Label>
                <Input
                  value={itemForm.externalUrl}
                  onChange={(e) => setItemForm({ ...itemForm, externalUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ) : null}

            <div>
              <Label>Display title</Label>
              <Input
                value={itemForm.externalTitle}
                onChange={(e) => setItemForm({ ...itemForm, externalTitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
            </div>
            <div>
              <Label>Display order</Label>
              <Input
                value={itemForm.displayOrder}
                onChange={(e) => setItemForm({ ...itemForm, displayOrder: e.target.value })}
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemDialogOpen(false)}
              disabled={savingItem}
            >
              Cancel
            </Button>
            <Button onClick={onSubmitItem} disabled={savingItem}>
              {savingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmList} onOpenChange={(v) => !v && setConfirmList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reading list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{confirmList?.title}" and all of its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={onDeleteList} className="ml-2">
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
