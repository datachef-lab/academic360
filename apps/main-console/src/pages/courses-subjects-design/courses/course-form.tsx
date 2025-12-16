import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Course } from "@repo/db/index";
// removed unused degree hooks
import { Controller } from "react-hook-form";

interface CourseFormProps {
  initialData?: Course | null;
  onSubmit: (data: Course) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().nullable().optional(),
  sequence: z.number().min(0, "Sequence must be a positive number").nullable().optional(),
  isActive: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof formSchema>;

export function CourseForm({ initialData, onSubmit, onCancel, isSubmitting }: CourseFormProps) {
  // removed degrees for now; backend Course does not require it in form

  const defaultValues: CourseFormValues = {
    name: initialData?.name || "",
    shortName: initialData?.shortName || "",
    sequence: initialData?.sequence || 0,
    isActive: initialData?.isActive || false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    // setValue,
    // watch,
    control,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: CourseFormValues) => {
    const courseData: Course = {
      name: data.name,
      shortName: data.shortName || null,
      sequence: data.sequence || null,
      isActive: data.isActive,
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSubmit(courseData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter course name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortName">Short Name</Label>
        <Input
          id="shortName"
          placeholder="Enter short name (optional)"
          {...register("shortName")}
          className={errors.shortName ? "border-red-500" : ""}
        />
        {errors.shortName && <p className="text-sm text-red-500">{errors.shortName.message}</p>}
      </div>

      {/* Degree selection removed for now */}

      <div className="space-y-2">
        <Label htmlFor="sequence">Sequence</Label>
        <Input
          id="sequence"
          type="number"
          placeholder="Enter sequence number"
          {...register("sequence", { valueAsNumber: true })}
          className={errors.sequence ? "border-red-500" : ""}
        />
        {errors.sequence && <p className="text-sm text-red-500">{errors.sequence.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => <Checkbox id="isActive" checked={!!field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
