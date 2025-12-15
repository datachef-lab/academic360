import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, selected, onChange, placeholder = "Select options" }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((x) => x !== option) : [...selected, option]);
  };

  return (
    <div className="relative">
      <Label className="block text-sm font-medium text-gray-900 mb-1.5">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between bg-white border-purple-200 text-left font-normal hover:bg-purple-100"
          >
            <span className={selected.length ? "text-gray-900" : "text-gray-600"}>
              {selected.length ? selected.join(", ") : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-purple-200 shadow-lg z-50"
          align="start"
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-purple-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.includes(option)}
                    className="border-purple-200 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  <span className="text-gray-900">{option}</span>
                </div>
                {selected.includes(option) && <Check className="w-4 h-4 text-purple-500" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
