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
import { AffiliationTypeForm } from "./affiliation-type-form";
import { toast } from "sonner";
import { AffiliationType, AffiliationTypeData } from "@/services/affiliation-type.api";

const dummyAffiliationTypes: AffiliationType[] = [
  { id: "1", name: "University Grants Commission", code: "UGC", description: "UGC affiliated", isActive: true },
  {
    id: "2",
    name: "All India Council for Technical Education",
    code: "AICTE",
    description: "AICTE affiliated",
    isActive: true,
  },
];

const AffiliationTypesPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyAffiliationTypes.length,
    totalPages: Math.ceil(dummyAffiliationTypes.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyAffiliationTypes.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedAffiliationType, setSelectedAffiliationType] = React.useState<AffiliationType | null>(null);

  const refetch = async () => {};

  const handleEdit = (affiliationType: AffiliationType) => {
    setSelectedAffiliationType(affiliationType);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log("Delete:", id);
    toast.info("Delete functionality not implemented yet.");
  };

  const handleSubmit = (data: AffiliationTypeData) => {
    console.log("Submit:", data);
    toast.success(selectedAffiliationType ? "Affiliation type updated" : "Affiliation type created");
    setIsFormOpen(false);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedAffiliationType(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Affiliation Types</h1>
          <p className="text-gray-500">A list of all affiliation types.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Affiliation Type
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedAffiliationType ? "Edit Affiliation Type" : "Add New Affiliation Type"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AffiliationTypeForm
              initialData={selectedAffiliationType}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummyAffiliationTypes}
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

export default AffiliationTypesPage;
