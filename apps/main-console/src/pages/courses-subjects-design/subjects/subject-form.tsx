import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Subject } from "@/types/course-design";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().nullable().optional(),
  sequence: z.number().nullable().optional(),
  disabled: z.boolean().default(false),
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
    control,
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      sequence: initialData?.sequence || null,
      disabled: initialData?.disabled ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        code: initialData.code || "",
        sequence: initialData.sequence || null,
        disabled: initialData.disabled ?? false,
      });
    } else {
      reset({
        name: "",
        code: "",
        sequence: null,
        disabled: false,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            className={errors.name ? "border-red-500" : ""}
            {...register("name")}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="code">
            Code
          </Label>
          <Input
            id="code"
            type="text"
            className={errors.code ? "border-red-500" : ""}
            {...register("code")}
            disabled={isLoading}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sequence">
            Sequence
          </Label>
          <Input
            id="sequence"
            type="number"
            className={errors.sequence ? "border-red-500" : ""}
            {...register("sequence", { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.sequence && (
            <p className="mt-1 text-sm text-red-600">{errors.sequence.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="disabled"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                id="disabled"
                checked={value}
                onCheckedChange={onChange}
                disabled={isLoading}
              />
            )}
          />
          <Label htmlFor="disabled">
            Disabled
          </Label>
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
