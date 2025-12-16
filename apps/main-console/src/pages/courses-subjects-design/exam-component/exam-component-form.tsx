import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";
import { ExamComponent } from "@repo/db/index";

interface ExamComponentFormProps {
  initialData?: ExamComponent | null;
  onSubmit: (data: ExamComponent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().nullable(),
  code: z.string().nullable(),
  sequence: z.number().min(0, "Sequence must be a positive number").nullable().optional(),
  isActive: z.boolean().default(false),
});

type ExamComponentFormValues = z.infer<typeof formSchema>;

export function ExamComponentForm({ initialData, onSubmit, onCancel, isSubmitting }: ExamComponentFormProps) {
  const defaultValues: ExamComponentFormValues = {
    name: initialData?.name || "",
    code: initialData?.code || "",
    shortName: initialData?.shortName || "",
    sequence: initialData?.sequence || 0,
    isActive: initialData?.isActive || false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ExamComponentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: ExamComponentFormValues) => {
    onSubmit({
      isActive: data.isActive,
      name: data.name,
      code: data?.code,
      shortName: data.shortName,
      sequence: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter ExamComponent name"
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

      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          type="text"
          placeholder="Enter code"
          {...register("code", { valueAsNumber: false })}
          className={errors.code ? "border-red-500" : ""}
        />
        {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />}
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
