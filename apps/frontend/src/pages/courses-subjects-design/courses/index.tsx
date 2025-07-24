import { UserDataTable } from "@/pages/DataTableTest";
import { columns, Course } from "./columns";
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
import { CourseForm } from "./course-form";
import { toast } from "sonner";

const dummyCourses: Course[] = [
  {
    id: "1",
    name: "Bachelor of Science in Computer Science",
    code: "BSc-CS",
    description: "A comprehensive program in computer science.",
    isActive: true,
  },
  {
    id: "2",
    name: "Master of Business Administration",
    code: "MBA",
    description: "A program for aspiring business leaders.",
    isActive: true,
  },
  {
    id: "3",
    name: "Bachelor of Arts in History",
    code: "BA-Hist",
    description: "A study of past events.",
    isActive: false,
  },
];

const CoursesPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyCourses.length,
    totalPages: Math.ceil(dummyCourses.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyCourses.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refetch = async () => {};

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
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
      toast.success(selectedCourse ? "Course updated successfully" : "Course created successfully");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to save course with error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
          <p className="text-gray-500">A list of all the courses offered.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedCourse ? "Edit Course" : "Add New Course"}</AlertDialogTitle>
            </AlertDialogHeader>
            <CourseForm
              initialData={selectedCourse}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummyCourses}
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

export default CoursesPage;
