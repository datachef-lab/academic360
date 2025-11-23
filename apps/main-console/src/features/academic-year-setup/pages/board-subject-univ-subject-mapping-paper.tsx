import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//
//
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, MinusCircle, Download, ToggleLeft, ToggleRight, Edit3 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  boardSubjectUnivSubjectMappingService,
  type BoardSubjectUnivSubjectMappingDto,
} from "@/services/board-subject-univ-subject-mapping.service";
import { getAllSubjects } from "@/services/subject.api";
import { boardSubjectService, type BoardSubjectDto } from "@/services/board-subject.service";

type MappingFormData = {
  subjectId: number;
  boardSubjectIds: number[];
};

const MappingForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  subjectOptions,
  boardSubjectOptions,
}: {
  initialData: BoardSubjectUnivSubjectMappingDto | null;
  onSubmit: (data: MappingFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  subjectOptions: { id: number; name: string; code?: string | null }[];
  boardSubjectOptions: BoardSubjectDto[];
}) => {
  const [formData, setFormData] = React.useState<MappingFormData>({
    subjectId: initialData?.subject.id || 0,
    boardSubjectIds: initialData?.boardSubjects?.map((b) => b.id) || [],
  });
  const [availableSearch, setAvailableSearch] = React.useState("");

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        subjectId: initialData.subject.id ?? 0,
        boardSubjectIds: initialData.boardSubjects.map((b) => b.id),
      });
    } else {
      setFormData({ subjectId: 0, boardSubjectIds: [] });
    }
  }, [initialData]);

  const toggleBoardSubject = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      boardSubjectIds: prev.boardSubjectIds.includes(id)
        ? prev.boardSubjectIds.filter((x) => x !== id)
        : [...prev.boardSubjectIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2 min-h-[84px]">
        <label className="text-sm font-semibold text-gray-700">University Subject *</label>
        <Select
          value={formData.subjectId > 0 ? String(formData.subjectId) : ""}
          onValueChange={(v) => setFormData({ ...formData, subjectId: parseInt(v) || 0 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select University Subject" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-auto">
            {subjectOptions.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Board Subjects *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded p-2 h-72 flex flex-col">
            <div className="flex items-center justify-between mb-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mapped</span>
                <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                  {formData.boardSubjectIds.length}
                </Badge>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-3"
                  disabled={formData.boardSubjectIds.length === 0}
                  onClick={() => setFormData((prev) => ({ ...prev, boardSubjectIds: [] }))}
                >
                  Remove All
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {boardSubjectOptions
                .filter((bs) => formData.boardSubjectIds.includes(bs.id))
                .map((bs) => (
                  <div key={bs.id} className="flex items-center justify-between py-1">
                    <span className="text-sm truncate" title={bs.boardSubjectName.name}>
                      {bs.boardSubjectName.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {bs.board.code ? (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">
                          {bs.board.code}
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => toggleBoardSubject(bs.id)}
                        title="Remove from mapped"
                      >
                        <MinusCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {formData.boardSubjectIds.length === 0 && (
                <div className="text-xs text-muted-foreground">No mapped subjects</div>
              )}
            </div>
          </div>
          <div className="border rounded p-2 h-72 flex flex-col">
            <div className="flex items-center justify-between mb-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Available</span>
                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                  {boardSubjectOptions.filter((bs) => !formData.boardSubjectIds.includes(bs.id)).length}
                </Badge>
              </div>
              <div className="w-1/2">
                <Input
                  placeholder="Search available subjects..."
                  value={availableSearch}
                  onChange={(e) => setAvailableSearch(e.target.value)}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => {
                    const addable = boardSubjectOptions
                      .filter((bs) => !formData.boardSubjectIds.includes(bs.id))
                      .filter((bs) =>
                        `${bs.boardSubjectName.name} ${bs.board.code ?? ""}`
                          .toLowerCase()
                          .includes(availableSearch.toLowerCase().trim()),
                      )
                      .map((bs) => bs.id);
                    if (addable.length === 0) return;
                    setFormData((prev) => ({
                      ...prev,
                      boardSubjectIds: Array.from(new Set([...prev.boardSubjectIds, ...addable])),
                    }));
                  }}
                >
                  Add All
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {boardSubjectOptions
                .filter((bs) => !formData.boardSubjectIds.includes(bs.id))
                .filter((bs) =>
                  `${bs.boardSubjectName.name} ${bs.board.code ?? ""}`
                    .toLowerCase()
                    .includes(availableSearch.toLowerCase().trim()),
                )
                .map((bs) => (
                  <div key={bs.id} className="flex items-center justify-between py-1">
                    <span className="text-sm truncate" title={bs.boardSubjectName.name}>
                      {bs.boardSubjectName.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {bs.board.code ? (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">
                          {bs.board.code}
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => toggleBoardSubject(bs.id)}
                        title="Add to mapped"
                      >
                        <PlusCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {boardSubjectOptions.filter((bs) => !formData.boardSubjectIds.includes(bs.id)).length === 0 && (
                <div className="text-xs text-muted-foreground">No available subjects</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default function BoardSubjectUnivSubjectMappingPaper() {
  const [rows, setRows] = React.useState<BoardSubjectUnivSubjectMappingDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BoardSubjectUnivSubjectMappingDto | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [subjects, setSubjects] = React.useState<{ id: number; name: string; code?: string | null }[]>([]);
  const [boardSubjects, setBoardSubjects] = React.useState<BoardSubjectDto[]>([]);

  React.useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mappings, subjectList, bsPage] = await Promise.all([
        boardSubjectUnivSubjectMappingService.list(),
        getAllSubjects(),
        boardSubjectService.getAll(1, 10000),
      ]);
      setRows(mappings);
      setSubjects(subjectList.map((s) => ({ id: s.id!, name: s.name, code: s.code ?? null })));
      setBoardSubjects(bsPage.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mappings");
      toast.error("Failed to load mappings");
    } finally {
      setLoading(false);
    }
  };

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase().trim();
    let base = rows;
    if (typeof selectedSubjectId === "number") {
      base = base.filter((r) => (r.subject as { id?: number })?.id === selectedSubjectId);
    }
    if (!q) return base;
    return base.filter(
      (r) =>
        r.subject.name.toLowerCase().includes(q) ||
        (r.subject.code ?? "").toLowerCase().includes(q) ||
        r.boardSubjects.some(
          (bs) => bs.board.name.toLowerCase().includes(q) || bs.boardSubjectName.name.toLowerCase().includes(q),
        ),
    );
  }, [rows, searchText, selectedSubjectId]);

  // Table rows: one per board subject under a university subject
  const tableRows = React.useMemo(
    () =>
      filtered.flatMap((m) =>
        (m.boardSubjects || []).map((bs) => ({
          mappingId: m.id,
          subjectName: m.subject.name,
          subjectCode: m.subject.code ?? "",
          boardSubjectName: bs.boardSubjectName.name,
          boardCode: bs.board.code || "",
          isActive: Boolean(bs.isActive),
          boardSubjectId: bs.id,
        })),
      ),
    [filtered],
  );

  // Pagination over flattened table rows
  const totalItems = tableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = React.useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return tableRows.slice(start, start + pageSize);
  }, [tableRows, currentPageSafe, pageSize]);

  const toggleBoardSubjectActive = async (boardSubjectId: number, isActive: boolean) => {
    try {
      const updated = await boardSubjectService.update(boardSubjectId, { isActive: !isActive });
      setRows((prev) =>
        prev.map((m) => ({
          ...m,
          boardSubjects: m.boardSubjects.map((bs) =>
            bs.id === boardSubjectId ? { ...bs, isActive: updated.isActive } : bs,
          ),
        })),
      );
      toast.success(`Marked as ${!isActive ? "Active" : "Inactive"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const onAdd = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const onEditSelected = () => {
    if (typeof selectedSubjectId !== "number") return;
    const found = rows.find((r) => (r.subject as { id?: number })?.id === selectedSubjectId);
    if (found) {
      setSelected(found);
      setIsFormOpen(true);
    } else {
      toast.info("No mapping found for the selected subject");
    }
  };

  // const onEdit = (row: BoardSubjectUnivSubjectMappingDto) => {
  //   setSelected(row);
  //   setIsFormOpen(true);
  // };

  const onCancel = () => {
    setSelected(null);
    setIsFormOpen(false);
  };

  const onSubmit = async (data: MappingFormData) => {
    setIsSubmitting(true);
    try {
      // Basic validation and de-duplication
      if (!data.subjectId || data.subjectId <= 0) {
        toast.error("Please select a University Subject");
        setIsSubmitting(false);
        return;
      }
      const uniqueIds = Array.from(
        new Set((data.boardSubjectIds || []).filter((id): id is number => typeof id === "number" && id > 0)),
      );
      if (uniqueIds.length === 0) {
        toast.error("Please add at least one Board Subject");
        setIsSubmitting(false);
        return;
      }
      if (uniqueIds.length !== (data.boardSubjectIds || []).length) {
        toast.info("Duplicate board subjects removed");
      }

      const payload: BoardSubjectUnivSubjectMappingDto = {
        id: selected?.id ?? 0,
        subject: { id: data.subjectId } as unknown as BoardSubjectUnivSubjectMappingDto["subject"],
        boardSubjects: uniqueIds.map((id) => ({ id }) as Partial<BoardSubjectDto> as BoardSubjectDto),
      };
      // If editing or mapping already exists for this subject, perform update instead of create
      const existingForSubject = rows.find((r) => (r.subject as { id?: number })?.id === data.subjectId);
      if (selected || existingForSubject) {
        const targetId = (selected?.id as number | undefined) ?? (existingForSubject?.id as number);
        const updated = await boardSubjectUnivSubjectMappingService.update(targetId, payload);
        setRows((prev) => prev.map((r) => (r.id === targetId ? updated : r)));
        toast.success("Mapping updated successfully");
      } else {
        const created = await boardSubjectUnivSubjectMappingService.create(payload);
        setRows((prev) => [...prev, created]);
        toast.success("Mapping created successfully");
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save mapping");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDownload = async () => {
    try {
      const data = filtered.map((r, idx) => ({
        "S.No": idx + 1,
        Subject: r.subject.code ? `${r.subject.name} (${r.subject.code})` : r.subject.name,
        "Boards/Subjects": r.boardSubjects
          .map(
            (bs) =>
              `${bs.board.name} - ${bs.boardSubjectName.name}${bs.boardSubjectName.code ? ` (${bs.boardSubjectName.code})` : ""}`,
          )
          .join(", "),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 8 }, { wch: 40 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, ws, "Mappings");
      const filename = `board-subject-univ-mappings-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Download complete");
    } catch {
      toast.error("Failed to download");
    }
  };

  // Only allow unmapped University Subjects in the Add/Edit dialog dropdown.
  // When editing, keep the currently selected subject in the list even if already mapped.
  const mappedSubjectIdSet = React.useMemo(() => {
    const ids = new Set<number>();
    for (const r of rows) {
      const sid = (r.subject as { id?: number })?.id;
      if (typeof sid === "number") ids.add(sid);
    }
    return ids;
  }, [rows]);

  const subjectOptionsForDialog = React.useMemo(() => {
    const keepId = (selected?.subject as { id?: number })?.id;
    return subjects.filter((s) => !mappedSubjectIdSet.has(s.id) || (typeof keepId === "number" && s.id === keepId));
  }, [subjects, mappedSubjectIdSet, selected]);

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center mb-3 gap-4 sm:gap-0 sm:justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              Board Subject ↔ Univ Subject Mappings
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Mapping</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-6xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selected ? "Edit Mapping" : "Add New Mapping"}</AlertDialogTitle>
                </AlertDialogHeader>
                <MappingForm
                  initialData={selected}
                  onSubmit={onSubmit}
                  onCancel={onCancel}
                  isLoading={isSubmitting}
                  subjectOptions={subjectOptionsForDialog}
                  boardSubjectOptions={boardSubjects}
                />
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" onClick={onDownload} className="flex-shrink-0">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] sm:top-[88px] z-20 bg-background p-4 border-b flex flex-col sm:flex-row sm:items-center gap-4 mb-0 sm:justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
              <Input
                placeholder="Search by subject, board or board subject name..."
                className="w-full sm:w-64"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                value={selectedSubjectId ? String(selectedSubjectId) : "all"}
                onValueChange={(v) => {
                  setSelectedSubjectId(v === "all" ? undefined : parseInt(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="University Subject" />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-auto">
                  <SelectItem value="all">All University Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditSelected}
                disabled={typeof selectedSubjectId !== "number"}
                className="flex items-center gap-2 flex-shrink-0"
                title="Edit mapping for selected subject"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              {/* Top pagination controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPageSafe === 1}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">Prev</span>
                  <span className="sm:hidden">‹</span>
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  <span className="hidden sm:inline">
                    Page {currentPageSafe} / {totalPages}
                  </span>
                  <span className="sm:hidden">
                    {currentPageSafe}/{totalPages}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
              <span className="hidden sm:inline">
                Showing {(currentPageSafe - 1) * pageSize + 1} to {Math.min(currentPageSafe * pageSize, totalItems)} of{" "}
                {totalItems} results
              </span>
              <span className="sm:hidden">
                {Math.min(currentPageSafe * pageSize, totalItems)} / {totalItems}
              </span>
            </div>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md w-full min-w-max" style={{ tableLayout: "auto" }}>
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Sr No
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      University Subject
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Subject
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Code
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 8px",
                      }}
                    >
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No mappings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((r, idx) => (
                      <TableRow key={`${r.mappingId}-${r.boardSubjectId}`} className="group">
                        <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                          {(currentPageSafe - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                          <div
                            className="truncate"
                            title={`${r.subjectName}${r.subjectCode ? ` (${r.subjectCode})` : ""}`}
                          >
                            <span className="text-sm">
                              {r.subjectName}
                              {r.subjectCode ? (
                                <span className="text-muted-foreground ml-1">({r.subjectCode})</span>
                              ) : null}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                          <span className="text-sm truncate">{r.boardSubjectName}</span>
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                          {r.boardCode ? (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">
                              {r.boardCode}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                          {r.isActive ? (
                            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBoardSubjectActive(r.boardSubjectId, r.isActive)}
                            className="h-7 w-9 p-0 flex items-center justify-center"
                            title={r.isActive ? "Set Inactive" : "Set Active"}
                          >
                            {r.isActive ? (
                              <ToggleLeft className="h-5 w-5 text-red-600" />
                            ) : (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Pagination Controls */}
      {!loading && !error && totalItems > 0 && (
        <div className="mt-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-600">
            <span className="hidden sm:inline">
              Showing {(currentPageSafe - 1) * pageSize + 1} to {Math.min(currentPageSafe * pageSize, totalItems)} of{" "}
              {totalItems} results
            </span>
            <span className="sm:hidden">
              Page {currentPageSafe} of {totalPages} ({totalItems} total)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPageSafe === 1}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPageSafe - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPageSafe === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0 flex-shrink-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe === totalPages}
              className="flex-shrink-0"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
