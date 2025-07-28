import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubjectPaper } from "@/types/course-design";
import { Subject, Affiliation, RegulationType } from "@/types/course-design";

const subjectPaperSchema = z.object({
  subjectId: z.number().min(1, "Subject is required"),
  affiliationId: z.number().min(1, "Affiliation is required"),
  regulationTypeId: z.number().min(1, "Regulation Type is required"),
  academicYearId: z.number().min(1, "Academic Year is required"),
  sequence: z.number().optional(),
  disabled: z.boolean().default(false),
});

type SubjectPaperFormData = z.infer<typeof subjectPaperSchema>;

interface SubjectPaperFormProps {
  initialData?: SubjectPaper | null;
  onSubmit: (data: Omit<SubjectPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  subjects: Subject[];
  affiliations: Affiliation[];
  regulationTypes: RegulationType[];
  academicYears: { id: number; year: string; isActive?: boolean }[];
}

export const SubjectPaperForm: React.FC<SubjectPaperFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  subjects,
  affiliations,
  regulationTypes,
  academicYears,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SubjectPaperFormData>({
    resolver: zodResolver(subjectPaperSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || 0,
      affiliationId: initialData?.affiliationId || 0,
      regulationTypeId: initialData?.regulationTypeId || 0,
      academicYearId: initialData?.academicYearId || 0,
      sequence: initialData?.sequence || undefined,
      disabled: initialData?.disabled || false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        subjectId: initialData.subjectId,
        affiliationId: initialData.affiliationId,
        regulationTypeId: initialData.regulationTypeId,
        academicYearId: initialData.academicYearId,
        sequence: initialData.sequence || undefined,
        disabled: initialData.disabled,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: SubjectPaperFormData) => {
    onSubmit({
      ...data,
      sequence: data.sequence || null
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subjectId">Subject</Label>
          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id!.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.subjectId && (
            <p className="text-sm text-red-500">{errors.subjectId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="affiliationId">Affiliation</Label>
          <Controller
            name="affiliationId"
            control={control}
            render={({ field }) => (
              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Affiliation" />
                </SelectTrigger>
                <SelectContent>
                  {affiliations.map((affiliation) => (
                    <SelectItem key={affiliation.id} value={affiliation.id!.toString()}>
                      {affiliation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.affiliationId && (
            <p className="text-sm text-red-500">{errors.affiliationId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="regulationTypeId">Regulation Type</Label>
          <Controller
            name="regulationTypeId"
            control={control}
            render={({ field }) => (
              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Regulation Type" />
                </SelectTrigger>
                <SelectContent>
                  {regulationTypes.map((regulationType) => (
                    <SelectItem key={regulationType.id} value={regulationType.id!.toString()}>
                      {regulationType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.regulationTypeId && (
            <p className="text-sm text-red-500">{errors.regulationTypeId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="academicYearId">Academic Year</Label>
          <Controller
            name="academicYearId"
            control={control}
            render={({ field }) => (
              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((academicYear) => (
                    <SelectItem key={academicYear.id} value={academicYear.id!.toString()}>
                      {academicYear.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.academicYearId && (
            <p className="text-sm text-red-500">{errors.academicYearId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input
            {...register("sequence", { valueAsNumber: true })}
            type="number"
            placeholder="Enter sequence"
          />
          {errors.sequence && (
            <p className="text-sm text-red-500">{errors.sequence.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="disabled">Status</Label>
          <Controller
            name="disabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!field.value}
                  onCheckedChange={(checked) => field.onChange(!checked)}
                />
                <span className="text-sm">{field.value ? "Inactive" : "Active"}</span>
              </div>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}; 