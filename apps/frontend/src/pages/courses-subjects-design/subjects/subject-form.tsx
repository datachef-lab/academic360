import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Subject } from "./columns";
import { Button } from "@/components/ui/button";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectFormProps {
  initialData?: Subject | null;
  onSubmit: (data: SubjectFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SubjectForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SubjectFormProps) {
  const isEdit = !!initialData;
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        code: "",
        description: "",
        isActive: true,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`mt-1 block w-full rounded-md border ${
              errors.name ? "border-red-500" : "border-gray-300"
            } p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            {...register("name")}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700"
          >
            Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            type="text"
            className={`mt-1 block w-full rounded-md border ${
              errors.code ? "border-red-500" : "border-gray-300"
            } p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            {...register("code")}
            disabled={isLoading || isEdit}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className={`mt-1 block w-full rounded-md border ${
              errors.description ? "border-red-500" : "border-gray-300"
            } p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            {...register("description")}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="isActive"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...register("isActive")}
            disabled={isLoading}
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-gray-700"
          >
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? "Saving..."
            : isEdit
            ? "Update Subject"
            : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}
