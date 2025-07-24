import { UserDataTable } from "@/pages/DataTableTest";
import { columns, Subject } from "./columns";
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
import { SubjectForm } from "./subject-form";
import { toast } from "sonner";

const dummySubjects: Subject[] = [
  { id: "1", name: "Introduction to Programming", code: "CS101", description: "Basics of programming", isActive: true },
  { id: "2", name: "Data Structures", code: "CS201", description: "Fundamental data structures", isActive: true },
  { id: "3", name: "Calculus I", code: "MATH101", description: "Introduction to calculus", isActive: false },
];

const SubjectsPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummySubjects.length,
    totalPages: Math.ceil(dummySubjects.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummySubjects.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refetch = async () => {};

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
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
      toast.success(selectedSubject ? "Subject updated" : "Subject created");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to save subject with error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedSubject(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-gray-500">A list of all available subjects.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedSubject ? "Edit Subject" : "Add New Subject"}</AlertDialogTitle>
            </AlertDialogHeader>
            <SubjectForm
              initialData={selectedSubject}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummySubjects}
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

export default SubjectsPage;
