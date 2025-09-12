import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Affiliation } from "@repo/db";
import { Form, FormControl, FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const affiliationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortName: z.string().optional().nullable(),
  sequence: z.number().optional().nullable(),
  disabled: z.boolean().default(false),
  remarks: z.string().optional().nullable(),
});

type AffiliationFormValues = z.infer<typeof affiliationSchema>;

interface AffiliationFormProps {
  initialData?: Affiliation | null;
  onSubmit: (data: Omit<Affiliation, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AffiliationForm({ initialData, onSubmit, onCancel, isLoading = false }: AffiliationFormProps) {
  const isEdit = !!initialData;

  const form = useForm<AffiliationFormValues>({
    resolver: zodResolver(affiliationSchema),
    defaultValues: {
      name: initialData?.name || "",
      shortName: initialData?.shortName || "",
      sequence: initialData?.sequence || null,
      disabled: initialData?.disabled ?? false,
      remarks: initialData?.remarks || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        shortName: initialData.shortName || "",
        sequence: initialData.sequence || null,
        disabled: initialData.disabled,
        remarks: initialData.remarks || "",
      });
    } else {
      form.reset({
        name: "",
        shortName: "",
        sequence: null,
        disabled: false,
        remarks: "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: AffiliationFormValues) => {
    const affiliationData = {
      name: data.name,
      shortName: data.shortName || null,
      sequence: data.sequence || null,
      disabled: data.disabled,
      remarks: data.remarks || null,
    };
    onSubmit(affiliationData);
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
                <FormLabel>
                  Name <span className="text-red-500">*</span>
                </FormLabel>
                <Input placeholder="Enter affiliation name" {...field} disabled={isLoading} />
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <FormField
          control={form.control}
          name="shortName"
          render={({ field }) => (
            <FormControl>
              <div className="space-y-2">
                <FormLabel>Short Name</FormLabel>
                <Input placeholder="Enter short name" {...field} value={field.value ?? ""} disabled={isLoading} />
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
          name="remarks"
          render={({ field }) => (
            <FormControl>
              <div className="space-y-2">
                <FormLabel>Remarks</FormLabel>
                <Textarea placeholder="Enter remarks" {...field} value={field.value ?? ""} disabled={isLoading} />
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  )}
                />
                <FormLabel className="text-sm font-normal">Disabled</FormLabel>
                <FormMessage />
              </div>
            </FormControl>
          )}
        />

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : isEdit ? "Update Affiliation" : "Create Affiliation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
