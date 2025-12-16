import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { SubjectType } from "@repo/db/index";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  code: z.string().nullable().optional(),
  sequence: z.coerce.number().nullable().optional(),
  disabled: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface SubjectCategoryFormProps {
  initialData?: SubjectType | null;
  onSubmit: (data: Omit<SubjectType, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SubjectCategoryForm: React.FC<SubjectCategoryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      sequence: initialData?.sequence ?? null,
      disabled: initialData?.isActive ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        code: initialData.code || "",
        sequence: initialData.sequence ?? null,
        disabled: initialData.isActive ?? false,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        sequence: null,
        disabled: false,
      });
    }
  }, [initialData]);

  function handleSubmit(values: FormValues) {
    onSubmit({
      name: values.name,
      code: values.code || null,
      sequence: values.sequence ?? null,
      isActive: values.disabled,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter code" {...field} value={field.value ?? ""} />
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
                  placeholder="Enter sequence"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Controller
          name="disabled"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="disabled" disabled={isLoading} />
              </FormControl>
              <FormLabel htmlFor="disabled">Active</FormLabel>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
