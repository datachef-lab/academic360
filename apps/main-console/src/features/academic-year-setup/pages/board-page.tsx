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

const BoardForm = ({
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
};

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

  // Load boards on component mount
  React.useEffect(() => {
    loadBoards();
    // Load dropdowns
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
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getAllBoards();
      console.log("data", data);
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards");
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (board: BoardDto) => {
    setSelectedBoard(board);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: {
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
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedBoard(null);
  };

  const handleAddNew = () => {
    setSelectedBoard(null);
    setIsFormOpen(true);
  };

  // Delete disabled per requirements

  const handleDownloadAll = () => {
    try {
      const data = boards.map((b, index) => ({
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

  const filtered = boards.filter(
    (b) =>
      b.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (b.code ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (b.sequence?.toString() ?? "").includes(searchText.toLowerCase()) ||
      (b.degree?.name ?? "").toLowerCase().includes(searchText.toLowerCase()),
  );

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
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search by board name, code, or degree..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1250px]" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow>
                    <TableHead
                      style={{
                        width: 60,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      ID
                    </TableHead>
                    <TableHead
                      style={{
                        width: 180,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Name
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Code
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Sequence
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks
                    </TableHead>
                    <TableHead
                      style={{
                        width: 200,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Degree
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        width: 130,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                      }}
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
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No boards found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b, index) => (
                      <TableRow key={b.id} className="group">
                        <TableCell style={{ width: 60, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ width: 180, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.name ? <Badge variant="secondary">{b.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.code ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.sequence ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.passingMarks ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 200, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.degree?.name ? <Badge variant="outline">{b.degree.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, borderRight: "1px solid #e5e7eb" }}>
                          {b.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 130, padding: "8px 4px" }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(b)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}
