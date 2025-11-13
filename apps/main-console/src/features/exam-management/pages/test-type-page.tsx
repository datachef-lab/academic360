import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, ClipboardList, Edit, Trash2, Loader2 } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getAllExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
  type ExamTypeT,
} from "@/services/exam-type.service";

type ExamTypeFormValues = {
  name: string;
  shortName?: string;
  description?: string;
  carry?: string;
  isBoardExam: boolean;
  passingMarks: number;
  fullMarks: number;
  weightage: number;
  writtenPassingMarks: number;
  writtenFullMarks: number;
  oralPassingMarks: number;
  oralFullMarks: number;
  review: boolean;
  isFormatativeTest1: boolean;
  isFormatativeTest2: boolean;
  isFormatativeTest3: boolean;
  isFormatativeTest4: boolean;
  isSummativeAssessment1: boolean;
  isSummativeAssessment2: boolean;
  sequence?: number;
  isActive: boolean;
};

export default function TestTypePage() {
  const [examTypes, setExamTypes] = React.useState<ExamTypeT[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedExamType, setSelectedExamType] = React.useState<ExamTypeT | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        setLoading(true);
        const response = await getAllExamTypes();
        if (response.httpStatus === "SUCCESS" && response.payload) {
          setExamTypes(response.payload);
        } else {
          toast.error("Failed to load exam types", {
            description: response.message || "An error occurred",
          });
        }
      } catch (error) {
        console.error("Error fetching exam types:", error);
        toast.error("Failed to load exam types", {
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExamTypes();
  }, []);

  const filteredExamTypes = examTypes.filter((examType) =>
    [
      examType.id?.toString() ?? "",
      examType.name ?? "",
      examType.shortName ?? "",
      examType.description ?? "",
      examType.carry ?? "",
      examType.sequence?.toString() ?? "",
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchText.toLowerCase())),
  );

  const handleAddNew = () => {
    setSelectedExamType(null);
  };

  const handleEdit = (examType: ExamTypeT) => {
    setSelectedExamType(examType);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this exam type?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await deleteExamType(id);
      if (response.httpStatus === "DELETED" || response.httpStatus === "SUCCESS") {
        toast.success("Exam type deleted successfully");
        setExamTypes((prev) => prev.filter((examType) => examType.id !== id));
      } else {
        toast.error("Failed to delete exam type", {
          description: response.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting exam type:", error);
      toast.error("Failed to delete exam type", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (form: ExamTypeFormValues) => {
    try {
      setIsSubmitting(true);

      if (selectedExamType) {
        const response = await updateExamType(selectedExamType.id!, {
          name: form.name,
          shortName: form.shortName,
          description: form.description,
          carry: form.carry,
          isBoardExam: form.isBoardExam,
          passingMarks: form.passingMarks,
          fullMarks: form.fullMarks,
          weightage: form.weightage,
          writtenPassingMarks: form.writtenPassingMarks,
          writtenFullMarks: form.writtenFullMarks,
          oralPassingMarks: form.oralPassingMarks,
          oralFullMarks: form.oralFullMarks,
          review: form.review,
          isFormatativeTest1: form.isFormatativeTest1,
          isFormatativeTest2: form.isFormatativeTest2,
          isFormatativeTest3: form.isFormatativeTest3,
          isFormatativeTest4: form.isFormatativeTest4,
          isSummativeAssessment1: form.isSummativeAssessment1,
          isSummativeAssessment2: form.isSummativeAssessment2,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "UPDATED" || response.httpStatus === "SUCCESS") {
          toast.success("Exam type updated successfully");
          const refreshResponse = await getAllExamTypes();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setExamTypes(refreshResponse.payload);
          }
          setIsFormOpen(false);
          setSelectedExamType(null);
        } else {
          toast.error("Failed to update exam type", {
            description: response.message || "An error occurred",
          });
        }
      } else {
        const response = await createExamType({
          name: form.name,
          shortName: form.shortName,
          description: form.description,
          carry: form.carry,
          isBoardExam: form.isBoardExam,
          passingMarks: form.passingMarks,
          fullMarks: form.fullMarks,
          weightage: form.weightage,
          writtenPassingMarks: form.writtenPassingMarks,
          writtenFullMarks: form.writtenFullMarks,
          oralPassingMarks: form.oralPassingMarks,
          oralFullMarks: form.oralFullMarks,
          review: form.review,
          isFormatativeTest1: form.isFormatativeTest1,
          isFormatativeTest2: form.isFormatativeTest2,
          isFormatativeTest3: form.isFormatativeTest3,
          isFormatativeTest4: form.isFormatativeTest4,
          isSummativeAssessment1: form.isSummativeAssessment1,
          isSummativeAssessment2: form.isSummativeAssessment2,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "SUCCESS") {
          toast.success("Exam type created successfully");
          const refreshResponse = await getAllExamTypes();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setExamTypes(refreshResponse.payload);
          }
          setIsFormOpen(false);
        } else {
          toast.error("Failed to create exam type", {
            description: response.message || "An error occurred",
          });
        }
      }
    } catch (error) {
      console.error("Error saving exam type:", error);
      toast.error(selectedExamType ? "Failed to update exam type" : "Failed to create exam type", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Exam Types
            </CardTitle>
            <div className="text-muted-foreground">A list of all the exam types.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedExamType ? "Edit Exam Type" : "Add New Exam Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <ExamTypeForm
                  initialData={selectedExamType ?? undefined}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedExamType(null);
                  }}
                  isSubmitting={isSubmitting}
                />
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
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1400px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 80 }}>ID</TableHead>
                    <TableHead style={{ width: 200 }}>Name</TableHead>
                    <TableHead style={{ width: 140 }}>Short Name</TableHead>
                    <TableHead style={{ width: 240 }}>Description</TableHead>
                    <TableHead style={{ width: 160 }}>Carry</TableHead>
                    <TableHead style={{ width: 140 }}>Board Exam</TableHead>
                    <TableHead style={{ width: 120 }}>Pass Marks</TableHead>
                    <TableHead style={{ width: 120 }}>Full Marks</TableHead>
                    <TableHead style={{ width: 120 }}>Weightage</TableHead>
                    <TableHead style={{ width: 160 }}>Written Pass</TableHead>
                    <TableHead style={{ width: 160 }}>Written Full</TableHead>
                    <TableHead style={{ width: 160 }}>Oral Pass</TableHead>
                    <TableHead style={{ width: 160 }}>Oral Full</TableHead>
                    <TableHead style={{ width: 120 }}>Review</TableHead>
                    <TableHead style={{ width: 140 }}>FT1</TableHead>
                    <TableHead style={{ width: 140 }}>FT2</TableHead>
                    <TableHead style={{ width: 140 }}>FT3</TableHead>
                    <TableHead style={{ width: 140 }}>FT4</TableHead>
                    <TableHead style={{ width: 160 }}>SA1</TableHead>
                    <TableHead style={{ width: 160 }}>SA2</TableHead>
                    <TableHead style={{ width: 120 }}>Sequence</TableHead>
                    <TableHead style={{ width: 120 }}>Active</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={22} className="text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading exam types...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredExamTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={22} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExamTypes.map((examType) => (
                      <TableRow key={examType.id} className="group">
                        <TableCell style={{ width: 80 }}>{examType.id}</TableCell>
                        <TableCell style={{ width: 200 }}>{examType.name}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.shortName ?? "-"}</TableCell>
                        <TableCell style={{ width: 240 }}>{examType.description ?? "-"}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.carry ?? "-"}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.isBoardExam ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.passingMarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.fullMarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.weightage}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.writtenPassingMarks}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.writtenFullMarks}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.oralPassingMarks}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.oralFullMarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.review ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.isFormatativeTest1 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.isFormatativeTest2 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.isFormatativeTest3 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 140 }}>{examType.isFormatativeTest4 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.isSummativeAssessment1 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 160 }}>{examType.isSummativeAssessment2 ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.sequence ?? "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>{examType.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(examType)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === examType.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(examType.id!)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === examType.id}
                            >
                              {deletingId === examType.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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

type ExamTypeFormProps = {
  initialData?: ExamTypeT;
  onSubmit: (data: ExamTypeFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function ExamTypeForm({ initialData, onSubmit, onCancel, isSubmitting = false }: ExamTypeFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [description, setDescription] = React.useState(initialData?.description ?? "");
  const [carry, setCarry] = React.useState(initialData?.carry ?? "");
  const [isBoardExam, setIsBoardExam] = React.useState(initialData?.isBoardExam ?? false);
  const [passingMarks, setPassingMarks] = React.useState<number>(initialData?.passingMarks ?? 0);
  const [fullMarks, setFullMarks] = React.useState<number>(initialData?.fullMarks ?? 0);
  const [weightage, setWeightage] = React.useState<number>(initialData?.weightage ?? 0);
  const [writtenPassingMarks, setWrittenPassingMarks] = React.useState<number>(initialData?.writtenPassingMarks ?? 0);
  const [writtenFullMarks, setWrittenFullMarks] = React.useState<number>(initialData?.writtenFullMarks ?? 0);
  const [oralPassingMarks, setOralPassingMarks] = React.useState<number>(initialData?.oralPassingMarks ?? 0);
  const [oralFullMarks, setOralFullMarks] = React.useState<number>(initialData?.oralFullMarks ?? 0);
  const [review, setReview] = React.useState(initialData?.review ?? false);
  const [isFormatativeTest1, setIsFormatativeTest1] = React.useState(initialData?.isFormatativeTest1 ?? false);
  const [isFormatativeTest2, setIsFormatativeTest2] = React.useState(initialData?.isFormatativeTest2 ?? false);
  const [isFormatativeTest3, setIsFormatativeTest3] = React.useState(initialData?.isFormatativeTest3 ?? false);
  const [isFormatativeTest4, setIsFormatativeTest4] = React.useState(initialData?.isFormatativeTest4 ?? false);
  const [isSummativeAssessment1, setIsSummativeAssessment1] = React.useState(
    initialData?.isSummativeAssessment1 ?? false,
  );
  const [isSummativeAssessment2, setIsSummativeAssessment2] = React.useState(
    initialData?.isSummativeAssessment2 ?? false,
  );
  const [sequence, setSequence] = React.useState<number | undefined>(initialData?.sequence ?? undefined);
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setShortName(initialData.shortName ?? "");
      setDescription(initialData.description ?? "");
      setCarry(initialData.carry ?? "");
      setIsBoardExam(initialData.isBoardExam ?? false);
      setPassingMarks(initialData.passingMarks ?? 0);
      setFullMarks(initialData.fullMarks ?? 0);
      setWeightage(initialData.weightage ?? 0);
      setWrittenPassingMarks(initialData.writtenPassingMarks ?? 0);
      setWrittenFullMarks(initialData.writtenFullMarks ?? 0);
      setOralPassingMarks(initialData.oralPassingMarks ?? 0);
      setOralFullMarks(initialData.oralFullMarks ?? 0);
      setReview(initialData.review ?? false);
      setIsFormatativeTest1(initialData.isFormatativeTest1 ?? false);
      setIsFormatativeTest2(initialData.isFormatativeTest2 ?? false);
      setIsFormatativeTest3(initialData.isFormatativeTest3 ?? false);
      setIsFormatativeTest4(initialData.isFormatativeTest4 ?? false);
      setIsSummativeAssessment1(initialData.isSummativeAssessment1 ?? false);
      setIsSummativeAssessment2(initialData.isSummativeAssessment2 ?? false);
      setSequence(initialData.sequence ?? undefined);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName("");
      setShortName("");
      setDescription("");
      setCarry("");
      setIsBoardExam(false);
      setPassingMarks(0);
      setFullMarks(0);
      setWeightage(0);
      setWrittenPassingMarks(0);
      setWrittenFullMarks(0);
      setOralPassingMarks(0);
      setOralFullMarks(0);
      setReview(false);
      setIsFormatativeTest1(false);
      setIsFormatativeTest2(false);
      setIsFormatativeTest3(false);
      setIsFormatativeTest4(false);
      setIsSummativeAssessment1(false);
      setIsSummativeAssessment2(false);
      setSequence(undefined);
      setIsActive(true);
    }
  }, [initialData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-h-[60vh] pr-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-name">Name *</Label>
          <Input
            id="exam-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter exam type name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="short-name">Short Name</Label>
          <Input id="short-name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="carry">Carry</Label>
          <Input id="carry" value={carry} onChange={(e) => setCarry(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Switch id="is-board-exam" checked={isBoardExam} onCheckedChange={setIsBoardExam} />
          <Label htmlFor="is-board-exam">Board Exam</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="is-review" checked={review} onCheckedChange={setReview} />
          <Label htmlFor="is-review">Review</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="is-active">Active</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="passing-marks">Passing Marks</Label>
          <Input
            id="passing-marks"
            type="number"
            value={passingMarks}
            onChange={(e) => setPassingMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="full-marks">Full Marks</Label>
          <Input
            id="full-marks"
            type="number"
            value={fullMarks}
            onChange={(e) => setFullMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weightage">Weightage</Label>
          <Input
            id="weightage"
            type="number"
            value={weightage}
            onChange={(e) => setWeightage(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="written-pass">Written Passing Marks</Label>
          <Input
            id="written-pass"
            type="number"
            value={writtenPassingMarks}
            onChange={(e) => setWrittenPassingMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="written-full">Written Full Marks</Label>
          <Input
            id="written-full"
            type="number"
            value={writtenFullMarks}
            onChange={(e) => setWrittenFullMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="oral-pass">Oral Passing Marks</Label>
          <Input
            id="oral-pass"
            type="number"
            value={oralPassingMarks}
            onChange={(e) => setOralPassingMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="oral-full">Oral Full Marks</Label>
          <Input
            id="oral-full"
            type="number"
            value={oralFullMarks}
            onChange={(e) => setOralFullMarks(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Switch id="ft1" checked={isFormatativeTest1} onCheckedChange={setIsFormatativeTest1} />
          <Label htmlFor="ft1">Formatative Test 1</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="ft2" checked={isFormatativeTest2} onCheckedChange={setIsFormatativeTest2} />
          <Label htmlFor="ft2">Formatative Test 2</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="ft3" checked={isFormatativeTest3} onCheckedChange={setIsFormatativeTest3} />
          <Label htmlFor="ft3">Formatative Test 3</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="ft4" checked={isFormatativeTest4} onCheckedChange={setIsFormatativeTest4} />
          <Label htmlFor="ft4">Formatative Test 4</Label>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Switch id="sa1" checked={isSummativeAssessment1} onCheckedChange={setIsSummativeAssessment1} />
          <Label htmlFor="sa1">Summative Assessment 1</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="sa2" checked={isSummativeAssessment2} onCheckedChange={setIsSummativeAssessment2} />
          <Label htmlFor="sa2">Summative Assessment 2</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input
            id="sequence"
            type="number"
            value={sequence ?? ""}
            onChange={(e) => setSequence(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Enter sequence (optional)"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              name,
              shortName: shortName || undefined,
              description: description || undefined,
              carry: carry || undefined,
              isBoardExam,
              passingMarks,
              fullMarks,
              weightage,
              writtenPassingMarks,
              writtenFullMarks,
              oralPassingMarks,
              oralFullMarks,
              review,
              isFormatativeTest1,
              isFormatativeTest2,
              isFormatativeTest3,
              isFormatativeTest4,
              isSummativeAssessment1,
              isSummativeAssessment2,
              sequence,
              isActive,
            })
          }
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
