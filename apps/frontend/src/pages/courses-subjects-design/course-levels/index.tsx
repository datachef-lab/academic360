import { UserDataTable } from "@/pages/DataTableTest";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import React from "react";
import { CustomPaginationState } from "@/components/settings/SettingsContent";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CourseLevelForm } from "./course-level-form";
import { CourseLevel } from "@/services/course-level.api";
import { toast } from "sonner";

const dummyCourseLevels: CourseLevel[] = [
  { id: "1", name: "Level 100", description: "First year", levelOrder: 1, isActive: true },
  { id: "2", name: "Level 200", description: "Second year", levelOrder: 2, isActive: true },
];

const CourseLevelsPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyCourseLevels.length,
    totalPages: Math.ceil(dummyCourseLevels.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyCourseLevels.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourseLevel, setSelectedCourseLevel] = React.useState<CourseLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refetch = async () => {};

  const handleEdit = (courseLevel: CourseLevel) => {
    setSelectedCourseLevel(courseLevel);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Delete:", id);
    toast.info("Delete functionality not implemented yet.");
  };

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      console.log("Submit:", data);
      toast.success(selectedCourseLevel ? "Course level updated" : "Course level created");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to save course level with error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCourseLevel(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Course Levels</h1>
          <p className="text-gray-500">A list of all course levels.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course Level
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedCourseLevel ? "Edit Course Level" : "Add New Course Level"}</AlertDialogTitle>
            </AlertDialogHeader>
            <CourseLevelForm
              initialData={selectedCourseLevel}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummyCourseLevels}
        pagination={pagination}
        setPagination={setPagination}
        isLoading={false}
        searchText={searchText}
        setSearchText={setSearchText}
        setDataLength={setDataLength}
        refetch={refetch}
      />
    </div>
  );
};

export default CourseLevelsPage;
