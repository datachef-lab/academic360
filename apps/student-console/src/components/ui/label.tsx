"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Loosen typings to accommodate current Radix/shadcn versions
const LabelP = LabelPrimitive.Root as any;

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, any>(({ className, ...props }, ref) => (
  <LabelP ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
