import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDocumentType,
  deleteDocumentType,
  getAllDocumentTypes,
  updateDocumentType,
  type DocumentTypeUpsertBody,
} from "@/features/document-issuance/services/document-type.service";

export const documentTypeKeys = {
  all: ["document-types"] as const,
  lists: () => [...documentTypeKeys.all, "list"] as const,
};

export const useDocumentTypes = () =>
  useQuery({
    queryKey: documentTypeKeys.lists(),
    queryFn: async () => (await getAllDocumentTypes()).payload ?? [],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DocumentTypeUpsertBody) => createDocumentType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success("Document type created");
    },
    onError: () => toast.error("Failed to create document type"),
  });
};

export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DocumentTypeUpsertBody> }) =>
      updateDocumentType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success("Document type updated");
    },
    onError: () => toast.error("Failed to update document type"),
  });
};

export const useDeleteDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDocumentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success("Document type deleted");
    },
    onError: (e: unknown) => {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("Cannot delete: this document type is still in use");
      } else {
        toast.error("Failed to delete document type");
      }
    },
  });
};
