


import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
  return (
    <div className="flex flex-col items-start space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[240px] pl-3 text-left font-normal"
          >
            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
