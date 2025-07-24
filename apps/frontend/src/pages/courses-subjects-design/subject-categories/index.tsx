import { UserDataTable } from "@/pages/DataTableTest";
import { columns } from "@/pages/column";
import { dummyUsers } from "@/pages/dummyData";
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
import { SubjectCategoryForm } from "./subject-category-form";

const SubjectCategoriesPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyUsers.length,
    totalPages: Math.ceil(dummyUsers.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyUsers.length)[1];

  const refetch = async () => {};

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subject Categories</h1>
          <p className="text-gray-500">A list of all subject categories.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject Category
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add New Subject Category</AlertDialogTitle>
            </AlertDialogHeader>
            <SubjectCategoryForm />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns}
        data={dummyUsers}
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

export default SubjectCategoriesPage;
