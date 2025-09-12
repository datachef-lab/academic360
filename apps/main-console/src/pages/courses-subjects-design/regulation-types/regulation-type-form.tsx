import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RegulationType } from "@repo/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
// import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema and types
const regulationTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().nullable().optional(),
  sequence: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
});

type RegulationTypeFormValues = z.infer<typeof regulationTypeSchema>;

interface RegulationTypeFormProps {
  initialData?: RegulationType | null;
  onSubmit: (data: Omit<RegulationType, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RegulationTypeForm({ initialData, onSubmit, onCancel, isLoading = false }: RegulationTypeFormProps) {
  const isEdit = !!initialData;

  const form = useForm<RegulationTypeFormValues>({
    resolver: zodResolver(regulationTypeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      shortName: initialData?.shortName ?? "",
      sequence: initialData?.sequence ?? null,
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        shortName: initialData.shortName ?? "",
        sequence: initialData.sequence ?? null,
        isActive: Boolean(initialData.isActive),
      });
    } else {
      form.reset({
        name: "",
        shortName: "",
        sequence: null,
        isActive: true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: RegulationTypeFormValues) => {
    onSubmit({
      name: data.name,
      shortName: data.shortName || null,
      sequence: data.sequence ?? null,
      isActive: data.isActive,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter regulation type name" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter short name" {...field} value={field.value ?? ""} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter sequence number"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={() => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      disabled={isLoading}
                    />
                  )}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Regulation Type" : "Create Regulation Type"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
