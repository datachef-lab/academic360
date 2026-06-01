import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from "lucide-react";

type LibraryMasterHeaderActionsProps = {
  onDownload: () => void;
  onAdd: () => void;
  addLabel?: string;
  downloadDisabled?: boolean;
};

export function LibraryMasterHeaderActions({
  onDownload,
  onAdd,
  addLabel = "Add",
  downloadDisabled = false,
}: LibraryMasterHeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onDownload}
        disabled={downloadDisabled}
        className="h-9 flex-shrink-0 px-3"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button
        type="button"
        onClick={onAdd}
        className="h-9 flex-shrink-0 bg-purple-600 px-3 text-white hover:bg-purple-700"
      >
        <PlusCircle className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{addLabel}</span>
      </Button>
    </div>
  );
}
