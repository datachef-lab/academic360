import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CourseLevel } from "@/services/course-level.api";

const courseLevelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  levelOrder: z.number().int().positive("Order must be a positive number"),
  isActive: z.boolean().default(true),
});

type CourseLevelFormValues = z.infer<typeof courseLevelSchema>;

interface CourseLevelFormProps {
  initialData?: CourseLevel | null;
  onSubmit: (data: CourseLevelFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CourseLevelForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CourseLevelFormProps) {
  const isEdit = !!initialData?.id;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseLevelFormValues>({
    resolver: zodResolver(courseLevelSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      levelOrder: 1,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const handleFormSubmit = async (data: CourseLevelFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter course level name"
          {...register("name")}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter description"
          {...register("description")}
          className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="levelOrder">Order</Label>
        <Input
          id="levelOrder"
          type="number"
          placeholder="Enter level order"
          {...register("levelOrder", { valueAsNumber: true })}
          className={errors.levelOrder ? 'border-red-500' : ''}
        />
        {errors.levelOrder && (
          <p className="text-sm text-red-500">{errors.levelOrder.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Level"}
        </Button>
      </div>
    </form>
  );
}
