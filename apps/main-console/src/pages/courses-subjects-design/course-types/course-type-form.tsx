import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { CourseType } from "@repo/db";
import { Controller } from "react-hook-form";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().nullable().optional(),
  sequence: z.number().min(0, "Sequence must be a positive number").nullable().optional(),
  disabled: z.boolean().default(false),
});

type CourseTypeFormValues = z.infer<typeof formSchema>;

interface CourseTypeFormProps {
  initialData?: CourseType | null;
  onSubmit: (data: CourseType) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CourseTypeForm({ initialData, onSubmit, onCancel, isSubmitting }: CourseTypeFormProps) {
  const defaultValues: CourseTypeFormValues = {
    name: initialData?.name || "",
    shortName: initialData?.shortName || "",
    sequence: initialData?.sequence || 0,
    disabled: initialData?.disabled || false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CourseTypeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: CourseTypeFormValues) => {
    const courseTypeData: CourseType = {
      name: data.name,
      shortName: data.shortName || null,
      sequence: data.sequence || null,
      disabled: data.disabled,
    };
    onSubmit(courseTypeData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter course type name"
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
          name="disabled"
          control={control}
          render={({ field }) => <Checkbox id="disabled" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="disabled">Disabled</Label>
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
