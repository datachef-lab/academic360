import React, { useState } from "react";
import { Users, Edit, Trash2, Download, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFeeGroups, useFeeCategories, useFeesSlabs } from "@/hooks/useFees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { FeeGroupDto } from "@repo/db/dtos/fees";
import { toast } from "sonner";
import { NewFeeGroup } from "@/services/fees-api";
import * as XLSX from "xlsx";

const FeeGroupsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeGroupDto | null>(null);
  const [editingItem, setEditingItem] = useState<FeeGroupDto | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<{
    feeCategoryId: number | undefined;
    feeSlabId: number | undefined;
    description: string;
    validityType: "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE";
    isCarryForwarded: boolean;
  }>({
    feeCategoryId: undefined,
    feeSlabId: undefined,
    description: "",
    validityType: "SEMESTER",
    isCarryForwarded: false,
  });

  const { feeGroups, loading, addFeeGroup, updateFeeGroupById, deleteFeeGroupById } = useFeeGroups();
  const { feeCategories, loading: categoriesLoading } = useFeeCategories();
  const { feesSlabs, loading: slabsLoading } = useFeesSlabs();

  // Check if there's a duplicate fee group with the same feeCategoryId + feeSlabId combination
  const hasDuplicateCombination = React.useMemo(() => {
    if (!form.feeCategoryId || !form.feeSlabId || !feeGroups || feeGroups.length === 0) {
      return false;
    }
    const duplicate = feeGroups.find(
      (g) => g.feeCategory?.id === form.feeCategoryId && g.feeSlab?.id === form.feeSlabId && g.id !== editingItem?.id,
    );
    return !!duplicate;
  }, [form.feeCategoryId, form.feeSlabId, feeGroups, editingItem?.id]);

  // Check if the fee slab is already used in any fee group (irrespective of category)
  const hasDuplicateSlab = React.useMemo(() => {
    if (!form.feeSlabId || !feeGroups || feeGroups.length === 0) {
      return false;
    }
    const duplicate = feeGroups.find((g) => g.feeSlab?.id === form.feeSlabId && g.id !== editingItem?.id);
    return !!duplicate;
  }, [form.feeSlabId, feeGroups, editingItem?.id]);

  // Filter available slabs: exclude slabs that are already used in any fee group
  const availableSlabs = React.useMemo(() => {
    if (!feesSlabs || feesSlabs.length === 0) {
      return [];
    }
    if (!feeGroups || feeGroups.length === 0) {
      return feesSlabs;
    }
    // Get all slab IDs that are already used
    const usedSlabIds = new Set(
      feeGroups
        .filter((g) => g.id !== editingItem?.id) // Exclude current editing item
        .map((g) => g.feeSlab?.id)
        .filter((id): id is number => id !== undefined),
    );
    // Return only slabs that are not used
    return feesSlabs.filter((slab) => !usedSlabIds.has(slab.id!));
  }, [feesSlabs, feeGroups, editingItem?.id]);

  // Combined duplicate check: either duplicate combination OR duplicate slab
  const hasDuplicate = hasDuplicateCombination || hasDuplicateSlab;

  // Filter fee groups based on search text
  const filteredFeeGroups =
    feeGroups?.filter((group) => {
      const searchLower = searchText.toLowerCase();
      return (
        group.feeCategory?.name?.toLowerCase().includes(searchLower) ||
        group.feeSlab?.name?.toLowerCase().includes(searchLower) ||
        group.description?.toLowerCase().includes(searchLower) ||
        group.validityType?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleDownloadAll = () => {
    if (!feeGroups || feeGroups.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Fee Category", "Fee Slab", "Description", "Validity Type", "Carry Forwarded"],
      ...feeGroups.map((g) => [
        g.id || "",
        g.feeCategory?.name || "",
        g.feeSlab?.name || "",
        g.description || "",
        g.validityType || "",
        g.isCarryForwarded ? "Yes" : "No",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Groups");
    XLSX.writeFile(wb, `fee_groups_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  const handleSubmit = async () => {
    if (!form.feeCategoryId) {
      toast.warning("Please select a fee category");
      return;
    }

    if (!form.feeSlabId) {
      toast.warning("Please select a fee slab");
      return;
    }

    // Check for duplicate feeCategoryId + feeSlabId combination
    if (feeGroups && feeGroups.length > 0) {
      const duplicate = feeGroups.find(
        (g) => g.feeCategory?.id === form.feeCategoryId && g.feeSlab?.id === form.feeSlabId && g.id !== editingItem?.id,
      );
      if (duplicate) {
        toast.warning("A fee group with this fee category and fee slab combination already exists.");
        return;
      }
    }

    try {
      const groupData: NewFeeGroup = {
        feeCategoryId: form.feeCategoryId!,
        feeSlabId: form.feeSlabId!,
        description: form.description.trim() || null,
        validityType: form.validityType,
        isCarryForwarded: form.isCarryForwarded,
      };

      if (editingItem) {
        const result = await updateFeeGroupById(editingItem.id!, groupData);
        if (!result) {
          // Check if it's a duplicate error (409) or other error
          toast.error(
            "Failed to update fee group. A fee group with this fee category and fee slab combination may already exist.",
          );
          return;
        }
        toast.success("Fee group updated successfully");
      } else {
        const result = await addFeeGroup(groupData);
        if (!result) {
          // Check if it's a duplicate error (409) or other error
          toast.error(
            "Failed to create fee group. A fee group with this fee category and fee slab combination may already exist.",
          );
          return;
        }
        toast.success("Fee group created successfully");
      }
      handleClose();
    } catch (error: any) {
      console.error("Error saving fee group:", error);
      // Check if it's a conflict error (duplicate)
      if (error?.response?.status === 409 || error?.response?.data?.httpStatus === "CONFLICT") {
        toast.warning("A fee group with this fee category and fee slab combination already exists.");
      } else {
        toast.error("Failed to save fee group. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      feeCategoryId: undefined,
      feeSlabId: undefined,
      description: "",
      validityType: "SEMESTER",
      isCarryForwarded: false,
    });
  };

  const handleEdit = (group: FeeGroupDto) => {
    setEditingItem(group);
    setForm({
      feeCategoryId: group.feeCategory?.id,
      feeSlabId: group.feeSlab?.id,
      description: group.description || "",
      validityType: group.validityType as "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE",
      isCarryForwarded: group.isCarryForwarded ?? false,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      feeCategoryId: undefined,
      feeSlabId: undefined,
      description: "",
      validityType: "SEMESTER",
      isCarryForwarded: false,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (group: FeeGroupDto) => {
    setDeletingItem(group);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteFeeGroupById(deletingItem.id!);
      if (!result) {
        toast.error("Failed to delete fee group. Please try again.");
        throw new Error("Delete failed");
      }
      toast.success("Fee group deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting fee group:", error);
      toast.error("Failed to delete fee group. Please try again.");
      throw error; // Re-throw to prevent modal from closing
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Fee Groups
              </CardTitle>
              <div className="text-muted-foreground">Manage fee groups</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading fee groups...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Fee Groups
            </CardTitle>
            <div className="text-muted-foreground">Manage fee groups</div>
          </div>

          <div className="flex items-center gap-2">
            <AlertDialog open={showModal} onOpenChange={setShowModal}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-[800px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingItem ? "Edit Fee Group" : "Add New Fee Group"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A fee group with the same Fee Category and Fee Slab combination cannot be
                      created. Additionally, each Fee Slab can only be used once across all fee groups (irrespective of
                      category). Each combination must be unique.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fee Category */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Fee Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.feeCategoryId?.toString() || ""}
                        onValueChange={(value) => {
                          const categoryId = parseInt(value);
                          setForm({ ...form, feeCategoryId: categoryId, feeSlabId: undefined }); // Reset slab when category changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee category" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeCategories && feeCategories.length > 0 ? (
                            feeCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id!.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {categoriesLoading ? "Loading categories..." : "No categories available"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fee Slab */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Fee Slab <span className="text-red-500">*</span>
                      </Label>
                      <>
                        <Select
                          value={form.feeSlabId?.toString() || ""}
                          onValueChange={(value) => setForm({ ...form, feeSlabId: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee slab" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlabs && availableSlabs.length > 0 ? (
                              availableSlabs.map((slab) => (
                                <SelectItem key={slab.id} value={slab.id!.toString()}>
                                  {slab.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {slabsLoading
                                  ? "Loading slabs..."
                                  : availableSlabs.length === 0 && feesSlabs && feesSlabs.length > 0
                                    ? "All fee slabs are already used in other fee groups"
                                    : "No slabs available"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {availableSlabs.length === 0 && feesSlabs && feesSlabs.length > 0 && !slabsLoading && (
                          <p className="text-sm text-muted-foreground mt-1">
                            All available fee slabs are already used in other fee groups.
                          </p>
                        )}
                      </>
                    </div>

                    {/* Description – full width */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length > 0 && value[0] === " ") return;
                          setForm({ ...form, description: value });
                        }}
                        placeholder="Enter description"
                        maxLength={500}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Validity Type */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Validity Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.validityType}
                        onValueChange={(value) => {
                          const validityType = value as "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE";
                          // Auto-select carry forwarded for PROGRAM_COURSE and ACADEMIC_YEAR
                          const shouldCarryForward =
                            validityType === "PROGRAM_COURSE" || validityType === "ACADEMIC_YEAR";
                          setForm({
                            ...form,
                            validityType,
                            isCarryForwarded: shouldCarryForward ? true : form.isCarryForwarded,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="SEMESTER">Semester</SelectItem>

                          <SelectItem value="ACADEMIC_YEAR">Academic Year</SelectItem>

                          <SelectItem value="PROGRAM_COURSE">Program Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Carry Forwarded */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isCarryForwarded"
                          checked={form.isCarryForwarded}
                          onChange={(e) => setForm({ ...form, isCarryForwarded: e.target.checked })}
                          disabled={form.validityType === "PROGRAM_COURSE" || form.validityType === "ACADEMIC_YEAR"}
                          className="h-4 w-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Label htmlFor="isCarryForwarded" className="cursor-pointer">
                          Carry Forwarded
                        </Label>
                      </div>
                      {/* Reserve space for note to prevent layout shifting */}
                      <div className="min-h-[20px] ml-6">
                        {form.validityType === "ACADEMIC_YEAR" && (
                          <p className="text-sm text-red-600 font-medium">
                            Note: Carry Forwarded is automatically enabled for Academic Year validity type and applies
                            only for that academic year.
                          </p>
                        )}
                        {form.validityType === "PROGRAM_COURSE" && (
                          <p className="text-sm text-red-600 font-medium">
                            Note: Carry Forwarded is automatically enabled for Program Course validity type.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasDuplicate && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        {hasDuplicateSlab
                          ? "⚠️ This Fee Slab is already used in another fee group. Each Fee Slab can only be used once."
                          : "⚠️ A fee group with this fee category and fee slab combination already exists."}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!form.feeCategoryId || !form.feeSlabId || hasDuplicate}>
                      {editingItem ? "Update" : "Save"}
                    </Button>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto h-full">
              <Table className="border rounded-md" style={{ tableLayout: "fixed", width: "100%" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: "7%", whiteSpace: "nowrap" }}>Sr. No.</TableHead>
                    <TableHead style={{ width: "16%" }}>Fee Category</TableHead>
                    <TableHead style={{ width: "16%" }}>Fee Slab</TableHead>
                    <TableHead style={{ width: "26%" }}>Description</TableHead>
                    <TableHead style={{ width: "15%" }}>Validity Type</TableHead>
                    <TableHead style={{ width: "12%" }}>Carry Forward</TableHead>
                    <TableHead style={{ width: "8%" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No fee groups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeeGroups.map((row, index) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: "7%" }}>{index + 1}</TableCell>
                        <TableCell style={{ width: "16%" }}>
                          {row.feeCategory?.name ? (
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                              {row.feeCategory.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "16%" }}>
                          {row.feeSlab?.name ? (
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              {row.feeSlab.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "26%" }} className="truncate" title={row.description || ""}>
                          {row.description || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell style={{ width: "15%" }}>
                          {row.validityType ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              {row.validityType.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "12%" }}>
                          {row.isCarryForwarded ? (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "8%" }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(row)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(row)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setDeletingItem(null);
          }
        }}
        title="Delete Fee Group"
        itemName={deletingItem ? `${deletingItem.feeCategory?.name} - ${deletingItem.feeSlab?.name}` : ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeeGroupsPage;
