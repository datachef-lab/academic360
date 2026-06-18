import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export interface DatePickerProps {
  value?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  displayFormat?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onSelect,
  className,
  displayFormat = "PPP",
  disabled = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full min-w-[10.5rem] justify-start gap-2 px-3 py-2 text-left text-sm font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
          <span className="whitespace-nowrap">
            {value ? format(value, displayFormat) : "Pick a date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
