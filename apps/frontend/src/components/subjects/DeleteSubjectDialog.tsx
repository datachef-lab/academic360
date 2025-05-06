import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Subject {
  id: number;
  name: string;
  irpCode: string;
  semester: number;
  [key: string]: any;
}

interface DeleteSubjectDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  subject: Subject | null;
  isDeleting: boolean;
  onConfirmDelete: () => Promise<void>;
}

const DeleteSubjectDialog: React.FC<DeleteSubjectDialogProps> = ({
  isOpen,
  setIsOpen,
  subject,
  isDeleting,
  onConfirmDelete,
}) => {
  if (!subject) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="border-purple-300">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-purple-900">
            <AlertTriangle className="h-5 w-5 text-purple-700" />
            Confirm Subject Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-gray-600">
            <p>Are you sure you want to delete the following subject?</p>
            {subject && (
              <div className="bg-purple-100 p-3 rounded-md border border-purple-300">
                <p className="font-medium text-purple-900">{subject.name}</p>
                <div className="flex gap-2 mt-1 text-sm text-purple-800">
                  <span>Code: {subject.irpCode}</span>
                  <span>•</span>
                  <span>Semester: {subject.semester}</span>
                </div>
              </div>
            )}
            <p className="mt-2 text-red-500">
              This action cannot be undone and may affect student records that reference this subject.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            className="border-purple-300 text-purple-800 hover:bg-purple-100 hover:text-purple-900"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Subject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSubjectDialog; 