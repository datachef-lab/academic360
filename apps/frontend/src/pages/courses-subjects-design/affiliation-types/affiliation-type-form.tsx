import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AffiliationType } from "@/types/course-design";
import { Form, FormControl, FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const affiliationTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  sequence: z.number().optional().nullable(),
  disabled: z.boolean().default(false),
});

type AffiliationTypeFormValues = z.infer<typeof affiliationTypeSchema>;

interface AffiliationTypeFormProps {
  initialData?: AffiliationType | null;
  onSubmit: (data: Omit<AffiliationType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AffiliationTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AffiliationTypeFormProps) {
  const isEdit = !!initialData;
  
  const form = useForm<AffiliationTypeFormValues>({
    resolver: zodResolver(affiliationTypeSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sequence: initialData?.sequence || null,
      disabled: initialData?.disabled ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        sequence: initialData.sequence || null,
        disabled: initialData.disabled,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        sequence: null,
        disabled: false,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: AffiliationTypeFormValues) => {
    const affiliationTypeData = {
      name: data.name,
      description: data.description || null,
      sequence: data.sequence || null,
      disabled: data.disabled,
    };
    onSubmit(affiliationTypeData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormControl>
              <div className="space-y-2">
                <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                <Input
                  placeholder="Enter affiliation type name"
                  {...field}
                  disabled={isLoading}
                />
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormControl>
              <div className="space-y-2">
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter description"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <FormField
          control={form.control}
          name="sequence"
          render={({ field }) => (
            <FormControl>
              <div className="space-y-2">
                <FormLabel>Sequence</FormLabel>
                <Input
                  type="number"
                  placeholder="Enter sequence number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoading}
                />
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <FormField
          control={form.control}
          name="disabled"
          render={() => (
            <FormControl>
              <div className="flex items-center space-x-2">
                <Controller
                  name="disabled"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                <FormLabel className="text-sm font-normal">
                  Disabled
                </FormLabel>
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <div className="flex gap-2">
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
            className="flex-1"
          >
            {isLoading
              ? "Saving..."
              : isEdit
              ? "Update Affiliation Type"
              : "Create Affiliation Type"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
