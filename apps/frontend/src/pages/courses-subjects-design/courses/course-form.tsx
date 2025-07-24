import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Course } from "@/types/course-design";
// import { Course } from "./columns";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CourseFormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  initialData?: Course | null;
  onSubmit: (data: CourseFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CourseFormProps) {
  const defaultValues: Course = {
    name: initialData?.name || "",
    degree: initialData?.degree || null,
    shortName: initialData?.shortName || "",
    sequence: initialData?.sequence || 0,
    disabled: initialData?.disabled || false,
    createdAt: initialData?.createdAt || new Date(),
    updatedAt: initialData?.updatedAt || new Date(),
    // code: initialData?.code || "",
    // description: initialData?.description || "",
    // isActive: initialData?.isActive ?? true,
  };

  const { register, handleSubmit, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter course name"
          {...register("name")}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          placeholder="Enter course code"
          {...register("code")}
          className={errors.code ? 'border-red-500' : ''}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter description (optional)"
          className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          {...register("isActive")}
          defaultChecked={!defaultValues.disabled}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
