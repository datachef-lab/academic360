import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Title of the modal (e.g., "Delete Addon") */
  title: string;
  /** Name/identifier of the item being deleted (e.g., "Addon Name") */
  itemName: string;
  /** Callback when delete is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Optional: Custom description text or ReactNode. Defaults to standard message */
  description?: React.ReactNode;
  /** Optional: Custom confirm button text. Defaults to "Delete" */
  confirmButtonText?: string;
  /** Optional: Custom cancel button text. Defaults to "Cancel" */
  cancelButtonText?: string;
  /** Optional: Whether the delete action is in progress */
  isLoading?: boolean;
}

/**
 * Reusable Delete Confirmation Modal Component
 *
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   open={showDeleteModal}
 *   onOpenChange={setShowDeleteModal}
 *   title="Delete Addon"
 *   itemName={deletingItem?.name || ""}
 *   onConfirm={handleDeleteConfirm}
 * />
 * ```
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  itemName,
  onConfirm,
  description,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Delete confirmation error:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const defaultDescription = (
    <>
      Are you sure you want to delete <strong>"{itemName}"</strong>? This action cannot be undone.
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ? description : defaultDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
            {cancelButtonText}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
