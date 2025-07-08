import { useState } from "react";
import { FileIcon, Plus } from "lucide-react";
import StudyMaterialTable from "./StudyMaterialTable";
import StudyMaterialForm from "./StudyMaterialForm";
import { Button } from "@/components/ui/button";

const CourseMaterialPage = () => {
  const [formOpen, setFormOpen] = useState(false);

  // For demo, no real data update logic
  const handleSave = (_data: unknown) => {
    console.log("Saving data:", _data);
    // TODO: Add logic to update table data
    setFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-0 sm:px-2 lg:px-2">
      <div className="p-8">
        {/* Modern Card Header */}
        <div className="rounded-2xl bg-white/80 shadow-md px-8 py-6 flex flex-col gap-2 mb-6 border border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-purple-100 p-3 rounded-xl shrink-0">
                <FileIcon className="w-7 h-7 text-purple-600" />
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Course Materials</span>
            </div>
            <Button
              className="flex items-center gap-2 px-5 py-2 font-semibold text-base mt-3 sm:mt-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={() => setFormOpen(true)}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 mr-2">
                <Plus className="h-5 w-5" />
              </span>
              Add
            </Button>
          </div>
          <span className="text-sm text-muted-foreground pl-2 mt-1">Manage study materials for students across all courses</span>
        </div>
        <StudyMaterialTable />
        <StudyMaterialForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
      </div>
    </div>
  );
};

export default CourseMaterialPage;
