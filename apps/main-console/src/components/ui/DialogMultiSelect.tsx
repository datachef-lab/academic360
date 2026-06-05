import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

interface DialogMultiSelectProps {
  placeholder: string;
  options: Option[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  /** Classes for the dropdown panel (width, max-height, etc.) */
  contentClassName?: string;
}

function formatTriggerLabel(
  placeholder: string,
  options: Option[],
  selectedOptions: string[],
): string {
  if (selectedOptions.length === 0) return placeholder;
  if (selectedOptions.length === 1) {
    const match = options.find((o) => o.value === selectedOptions[0]);
    return match?.label ?? placeholder;
  }
  return `${selectedOptions.length} selected`;
}

/** Multi-select tuned for use inside scrollable dialogs (stable trigger, scrollable list). */
const DialogMultiSelect = ({
  placeholder,
  options: values,
  selectedOptions: selectedItems,
  onChange,
  contentClassName,
}: DialogMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleSelectChange = (value: string) => {
    const updated = selectedItems.includes(value)
      ? selectedItems.filter((item) => item !== value)
      : [...selectedItems, value];
    onChange(updated);
  };

  const triggerLabel = formatTriggerLabel(placeholder, values, selectedItems);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full min-w-0 flex items-center justify-between gap-2 font-normal"
        >
          <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
        className={cn(
          "z-[120] w-[var(--radix-popover-trigger-width)] p-1",
          "max-h-[min(16rem,var(--radix-popover-content-available-height,16rem))] overflow-y-auto overflow-x-hidden overscroll-contain",
          "data-[state=open]:animate-none data-[state=closed]:animate-none",
          contentClassName,
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div role="listbox">
          {values.map((value) => {
            const checked = selectedItems.includes(value.value);
            return (
              <button
                key={value.value}
                type="button"
                role="option"
                aria-selected={checked}
                className="flex w-full cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => handleSelectChange(value.value)}
              >
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  className="mt-0.5 shrink-0 pointer-events-none"
                  aria-readonly
                />
                <span className="min-w-0 flex-1 whitespace-normal break-words">{value.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DialogMultiSelect;
