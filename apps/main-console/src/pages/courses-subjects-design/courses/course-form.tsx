import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Course } from "@repo/db";
import { Degree } from "@/types/resources/degree.types";
import { findAllDegrees } from "@/services/degree.service";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  disabled: z.boolean().default(false),
  degreeId: z.number().nullable().optional(),
});

type CourseFormValues = z.infer<typeof formSchema>;

export function CourseForm({ initialData, onSubmit, onCancel, isSubmitting }: CourseFormProps) {
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(true);

  const defaultValues: CourseFormValues = {
    name: initialData?.name || "",
    shortName: initialData?.shortName || "",
    sequence: initialData?.sequence || 0,
    disabled: initialData?.disabled || false,
    degreeId: initialData?.degree?.id || null,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch degrees on component mount
  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        setIsLoadingDegrees(true);
        const degreesData = await findAllDegrees();
        setDegrees(degreesData);
      } catch (error) {
        console.error("Error fetching degrees:", error);
      } finally {
        setIsLoadingDegrees(false);
      }
    };

    fetchDegrees();
  }, []);

  const handleFormSubmit = (data: CourseFormValues) => {
    const selectedDegree = degrees.find((d) => d.id === data.degreeId);
    const courseData: Course = {
      name: data.name,
      shortName: data.shortName || null,
      sequence: data.sequence || null,
      disabled: data.disabled,
      degree: selectedDegree || null,
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

      <div className="space-y-2">
        <Label htmlFor="degree">Degree</Label>
        <Select
          value={watch("degreeId")?.toString() || "none"}
          onValueChange={(value) => setValue("degreeId", value === "none" ? null : parseInt(value))}
        >
          <SelectTrigger className={errors.degreeId ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a degree" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {isLoadingDegrees ? (
              <SelectItem value="loading" disabled>
                Loading degrees...
              </SelectItem>
            ) : Array.isArray(degrees) ? (
              degrees.map((degree) => (
                <SelectItem key={degree.id} value={degree.id?.toString() || "0"}>
                  {degree.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="error" disabled>
                Error loading degrees
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.degreeId && <p className="text-sm text-red-500">{errors.degreeId.message}</p>}
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
