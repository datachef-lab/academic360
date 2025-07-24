import { UserDataTable } from "@/pages/DataTableTest";
import { columns, RegulationType } from "./columns";
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
import { RegulationTypeForm } from "./regulation-type-form";
import { toast } from "sonner";

const dummyRegulationTypes: RegulationType[] = [
  { id: "1", name: "Choice Based Credit System", description: "CBCS regulation", isActive: true },
  { id: "2", name: "Outcome Based Education", description: "OBE regulation", isActive: true },
];

const RegulationTypesPage = () => {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyRegulationTypes.length,
    totalPages: Math.ceil(dummyRegulationTypes.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyRegulationTypes.length)[1];
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRegulationType, setSelectedRegulationType] = React.useState<RegulationType | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refetch = async () => {};

  const handleEdit = (regulationType: RegulationType) => {
    setSelectedRegulationType(regulationType);
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
      toast.success(selectedRegulationType ? "Regulation type updated" : "Regulation type created");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to save regulation type with error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedRegulationType(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Regulation Types</h1>
          <p className="text-gray-500">A list of all regulation types.</p>
        </div>
        <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <AlertDialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Regulation Type
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedRegulationType ? "Edit Regulation Type" : "Add New Regulation Type"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <RegulationTypeForm
              initialData={selectedRegulationType}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UserDataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={dummyRegulationTypes}
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

export default RegulationTypesPage;
