import { UserDataTable } from "@/pages/DataTableTest";
import { columns, CourseType } from "./columns";
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
import { CourseTypeForm } from "./course-type-form";
import { toast } from "sonner";

const dummyCourseTypes: CourseType[] = [
  {
    id: "1",
    name: "Undergraduate",
    description: "Undergraduate Programs",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Postgraduate",
    description: "Postgraduate Programs",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Doctorate",
    description: "Doctoral Programs",
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const CourseTypesPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyCourseTypes.length,
    totalPages: Math.ceil(dummyCourseTypes.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyCourseTypes.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourseType, setSelectedCourseType] = React.useState<CourseType | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refetch = async () => {};

  const handleEdit = (courseType: CourseType) => {
    setSelectedCourseType(courseType);
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
      toast.success(selectedCourseType ? "Course type updated successfully" : "Course type created successfully");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to save course type with error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCourseType(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Course Types</h1>
          <p className="text-gray-500">A list of all course types.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course Type
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedCourseType ? "Edit Course Type" : "Add New Course Type"}</AlertDialogTitle>
            </AlertDialogHeader>
            <CourseTypeForm
              initialData={selectedCourseType}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummyCourseTypes}
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

export default CourseTypesPage;
