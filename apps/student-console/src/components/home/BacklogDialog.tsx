import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertCircle, XCircle } from "lucide-react";
import { SubjectMetadataType } from "@/types/academics/marksheet-summary";

type BacklogDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  backlogs: SubjectMetadataType[] | null;
};

export default function BacklogDialog({
  open,
  backlogs,
  setOpen,
}: BacklogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Failed Subjects
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {backlogs && backlogs.length > 0 ? (
            <div className="space-y-3">
              {backlogs.map((subject, index) => (
                <BacklogCard key={`backlog-${index}`} backlog={subject} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No backlog details available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BacklogCard({ backlog }: { backlog: SubjectMetadataType }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
      <div className="rounded-full bg-red-100 p-2 flex-shrink-0">
        <XCircle className="h-4 w-4 text-red-600" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900">{backlog.name}</h4>
        {backlog.marksheetCode && (
          <p className="text-sm text-gray-600">
            Code: {backlog.marksheetCode || backlog.irpCode || "N/A"}
          </p>
        )}
        {backlog.fullMarks && (
          <p className="text-sm text-gray-600">
            Full Marks: {backlog.fullMarks}
          </p>
        )}
        {backlog.credit && (
          <p className="text-sm text-gray-600">Credits: {backlog.credit}</p>
        )}
      </div>
    </div>
  );
}
