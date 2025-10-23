import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { boardService, type BoardDto } from "@/services/board.service";
import { degreeService, type DegreeDto } from "@/services/degree.service";
import { addressService, type AddressDto } from "@/services/address.service";

// Options are fetched via services

const BoardTableRow = React.memo(
  ({
    board,
    index,
    onEdit,
    currentPage,
    pageSize,
  }: {
    board: BoardDto;
    index: number;
    onEdit: (board: BoardDto) => void;
    currentPage: number;
    pageSize: number;
  }) => (
    <TableRow className="group">
      <TableCell className="text-center" style={{ width: "8%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
        {(currentPage - 1) * pageSize + index + 1}.
      </TableCell>
      <TableCell
        style={{
          width: "25%",
          padding: "8px 4px",
          borderRight: "1px solid #e5e7eb",
          wordWrap: "break-word",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {board.name ? <div className="text-sm leading-tight">{board.name}</div> : "-"}
      </TableCell>
      <TableCell style={{ width: "12%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
        {board.code ?? "-"}
      </TableCell>
      <TableCell className="text-center" style={{ width: "12%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
        {board.passingMarks ?? "-"}
      </TableCell>
      <TableCell style={{ width: "18%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
        {board.degree?.name ? (
          <Badge variant="outline" className="text-xs">
            {board.degree.name}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell style={{ width: "10%", borderRight: "1px solid #e5e7eb" }}>
        {board.isActive ? (
          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">Active</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Inactive
          </Badge>
        )}
      </TableCell>
      <TableCell style={{ width: "15%", padding: "8px 4px" }}>
        <div className="flex space-x-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => onEdit(board)} className="h-5 w-5 p-0">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ),
);

const BoardForm = React.memo(
  ({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    degreeOptions,
    addressOptions,
  }: {
    initialData: BoardDto | null;
    onSubmit: (data: {
      name: string;
      code?: string | null;
      passingMarks?: number | null;
      sequence?: number | null;
      degreeId?: number | null;
      addressId?: number | null;
      isActive: boolean;
    }) => void;
    onCancel: () => void;
    isLoading: boolean;
    degreeOptions: DegreeDto[];
    addressOptions: AddressDto[];
  }) => {
    const [formData, setFormData] = React.useState({
      name: initialData?.name || "",
      code: initialData?.code || "",
      passingMarks: initialData?.passingMarks ?? "",
      sequence: initialData?.sequence ?? "",
      degreeId: initialData?.degree?.id || 0,
      addressId: initialData?.address?.id || 0,
      isActive: initialData?.isActive ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        name: formData.name,
        code: formData.code || null,
        passingMarks: formData.passingMarks === "" ? null : Number(formData.passingMarks),
        sequence: formData.sequence === "" ? null : Number(formData.sequence),
        degreeId: formData.degreeId === 0 ? null : formData.degreeId,
        addressId: formData.addressId === 0 ? null : formData.addressId,
        isActive: formData.isActive,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter board name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Board Code</Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter board code"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="passingMarks">Passing Marks</Label>
            <Input
              id="passingMarks"
              type="number"
              value={formData.passingMarks}
              onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
              placeholder="Enter passing marks"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sequence">Sequence</Label>
            <Input
              id="sequence"
              type="number"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
              placeholder="Enter sequence"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="degreeId">Degree</Label>
            <Select
              value={formData.degreeId.toString()}
              onValueChange={(v) => setFormData({ ...formData, degreeId: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Degree</SelectItem>
                {degreeOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressId">Address</Label>
            <Select
              value={formData.addressId.toString()}
              onValueChange={(v) => setFormData({ ...formData, addressId: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Address</SelectItem>
                {addressOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.addressLine ?? `Address #${a.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    );
  },
);

export default function BoardPage() {
  const [boards, setBoards] = React.useState<BoardDto[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedBoard, setSelectedBoard] = React.useState<BoardDto | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [degreeOptions, setDegreeOptions] = React.useState<DegreeDto[]>([]);
  const [addressOptions, setAddressOptions] = React.useState<AddressDto[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedDegreeId, setSelectedDegreeId] = React.useState<number | undefined>(undefined);

  // Memoize boards to prevent unnecessary re-renders
  const memoizedBoards = React.useMemo(() => boards, [boards]);

  // Load dropdowns on component mount only
  React.useEffect(() => {
    (async () => {
      try {
        const [degrees, addresses] = await Promise.all([degreeService.getAll(), addressService.getAll()]);
        // Map Degree[] to DegreeDto[] by converting disabled to isActive
        const degreeDtos: DegreeDto[] = degrees.map((degree) => ({
          id: degree.id!,
          name: degree.name,
          sequence: degree.sequence ?? null, // Convert undefined to null
          isActive: !degree.disabled, // Convert disabled to isActive
        }));
        setDegreeOptions(degreeDtos);
        setAddressOptions(addresses);
      } catch (e) {
        // Non-blocking
        console.warn("Failed loading degree/address options", e);
      }
    })();
  }, []); // Empty dependency array - only run once on mount

  // Load boards when dependencies change
  React.useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadBoards = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add a small delay to prevent rapid successive calls
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMounted) return;

        const result = await boardService.getAllBoards(currentPage, pageSize, searchText, selectedDegreeId);

        if (!isMounted) return; // Prevent state updates if component unmounted

        setBoards(result.data);
        setTotalItems(result.total);
      } catch (err: unknown) {
        if (!isMounted) return;

        // Handle timeout errors more gracefully
        if (err && typeof err === "object" && "code" in err && err.code === "ECONNABORTED") {
          setError("Request timed out. Please check your connection and try again.");
          toast.error("Request timed out. Please try again.");
        } else if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string" &&
          err.message.includes("timeout")
        ) {
          setError("Request timed out. Please check your connection and try again.");
          toast.error("Request timed out. Please try again.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load boards");
          toast.error("Failed to load boards");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBoards();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentPage, pageSize, searchText, selectedDegreeId]);

  const handleEdit = React.useCallback((board: BoardDto) => {
    setSelectedBoard(board);
    setIsFormOpen(true);
  }, []);

  const handleSubmit = React.useCallback(
    async (data: {
      name: string;
      code?: string | null;
      passingMarks?: number | null;
      sequence?: number | null;
      degreeId?: number | null;
      isActive: boolean;
    }) => {
      setIsSubmitting(true);
      try {
        if (selectedBoard?.id) {
          // Update existing board
          const updatedBoard = await boardService.updateBoard(selectedBoard.id, data);
          setBoards((prev) => prev.map((b) => (b.id === selectedBoard.id ? updatedBoard : b)));
          toast.success("Board updated successfully");
        } else {
          // Create new board
          const newBoard = await boardService.createBoard(data);
          setBoards((prev) => [...prev, newBoard]);
          toast.success("Board created successfully");
        }
        setIsFormOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save board");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedBoard?.id],
  );

  const handleCancel = React.useCallback(() => {
    setIsFormOpen(false);
    setSelectedBoard(null);
  }, []);

  const handleAddNew = React.useCallback(() => {
    setSelectedBoard(null);
    setIsFormOpen(true);
  }, []);

  // Delete disabled per requirements

  const handleDownloadAll = async () => {
    try {
      // Get all data with current filters but without pagination
      const result = await boardService.getAllBoards(1, 10000, searchText, selectedDegreeId);
      const data = result.data.map((b, index) => ({
        "S.No": index + 1,
        Name: b.name,
        Code: b.code || "-",
        Sequence: b.sequence ?? "-",
        "Passing Marks": b.passingMarks ?? "-",
        Degree: b.degree?.name || "-",
        Status: b.isActive ? "Active" : "Inactive",
      }));
      console.log("Download data:", data);
      toast.success("Download functionality would be implemented here");
    } catch {
      toast.error("Failed to download boards");
    }
  };

  // Search with debounce - more aggressive debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 800); // Increased debounce time
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Boards
            </CardTitle>
            <div className="text-muted-foreground">Manage board configuration.</div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Board
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedBoard ? "Edit Board" : "Add New Board"}</AlertDialogTitle>
                </AlertDialogHeader>
                <BoardForm
                  degreeOptions={degreeOptions}
                  addressOptions={addressOptions}
                  initialData={selectedBoard}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-4 mb-0 justify-between">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by board name, code, or degree..."
                className="w-64"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                value={selectedDegreeId?.toString() || "all"}
                onValueChange={(value) => setSelectedDegreeId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  {degreeOptions.map((degree) => (
                    <SelectItem key={degree.id} value={degree.id.toString()}>
                      {degree.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Showing {memoizedBoards.length} of {totalItems} results
            </div>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto h-full">
              <Table className="border rounded-md w-full" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow>
                    <TableHead
                      className="text-center"
                      style={{
                        width: "8%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Sr. No.
                    </TableHead>
                    <TableHead
                      style={{
                        width: "25%",
                        background: "#f3f4f6",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Name
                    </TableHead>
                    <TableHead
                      style={{
                        width: "12%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Code
                    </TableHead>
                    <TableHead
                      className="text-center"
                      style={{
                        width: "12%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks
                    </TableHead>
                    <TableHead
                      style={{
                        width: "18%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Degree
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        width: "15%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                      }}
                      className="text-center"
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500">
                        <div className="flex flex-col items-center gap-2">
                          <span>{error}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setError(null);
                              setCurrentPage(1);
                            }}
                            className="mt-2"
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : memoizedBoards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No boards found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    memoizedBoards.map((b, index) => (
                      <BoardTableRow
                        key={b.id}
                        board={b}
                        index={index}
                        onEdit={handleEdit}
                        currentPage={currentPage}
                        pageSize={pageSize}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {!loading && !error && totalItems > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of{" "}
                {totalItems} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(totalItems / pageSize)) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(Math.ceil(totalItems / pageSize) - 4, currentPage - 2)) + i;
                    if (pageNum > Math.ceil(totalItems / pageSize)) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalItems / pageSize), prev + 1))}
                  disabled={currentPage === Math.ceil(totalItems / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
