import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Stream } from "@repo/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const streamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  shortName: z.string().optional().nullable(),
  ugPrefix: z.string().optional().nullable(),
  pgPrefix: z.string().optional().nullable(),
  sequence: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

type StreamFormValues = z.infer<typeof streamSchema>;

interface StreamFormProps {
  initialData?: Stream | null;
  onSubmit: (data: StreamFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StreamForm({ initialData, onSubmit, onCancel, isLoading = false }: StreamFormProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StreamFormValues>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      shortName: initialData?.shortName || "",
      ugPrefix: initialData?.ugPrefix || "",
      pgPrefix: initialData?.pgPrefix || "",
      sequence: initialData?.sequence || null,
      isActive: (initialData?.isActive ??
        (initialData?.disabled !== undefined ? !initialData.disabled : true)) as boolean,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        code: initialData.code || "",
        shortName: initialData.shortName || "",
        ugPrefix: initialData.ugPrefix || "",
        pgPrefix: initialData.pgPrefix || "",
        sequence: initialData.sequence || null,
        isActive: (initialData.isActive ??
          (initialData.disabled !== undefined ? !initialData.disabled : true)) as boolean,
      });
    } else {
      reset({
        name: "",
        code: "",
        shortName: "",
        ugPrefix: "",
        pgPrefix: "",
        sequence: null,
        isActive: true,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter stream name"
            {...register("name")}
            disabled={isLoading}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">
            Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter stream code"
            {...register("code")}
            disabled={isLoading}
            className={errors.code ? "border-red-500" : ""}
          />
          {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortName">Short Name</Label>
          <Input
            id="shortName"
            type="text"
            placeholder="Enter short name"
            {...register("shortName")}
            disabled={isLoading}
            className={errors.shortName ? "border-red-500" : ""}
          />
          {errors.shortName && <p className="text-sm text-red-600">{errors.shortName.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ugPrefix">UG Prefix</Label>
            <Input
              id="ugPrefix"
              type="text"
              placeholder="Enter UG prefix (optional)"
              {...register("ugPrefix")}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pgPrefix">PG Prefix</Label>
            <Input
              id="pgPrefix"
              type="text"
              placeholder="Enter PG prefix (optional)"
              {...register("pgPrefix")}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input
            id="sequence"
            type="number"
            placeholder="Enter sequence number"
            {...register("sequence", { valueAsNumber: true })}
            disabled={isLoading}
            className={errors.sequence ? "border-red-500" : ""}
          />
          {errors.sequence && <p className="text-sm text-red-600">{errors.sequence.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="isActive" {...register("isActive")} disabled={isLoading} />
          <Label
            htmlFor="isActive"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Active
          </Label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Update Stream" : "Create Stream"}
        </Button>
      </div>
    </form>
  );
}
