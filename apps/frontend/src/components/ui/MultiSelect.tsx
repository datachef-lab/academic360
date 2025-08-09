import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Option = { label: string; value: string };

interface ISelectProps {
  placeholder: string;
  options: Option[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}
const MultiSelect = ({
  placeholder,
  options: values,
  selectedOptions: selectedItems,
  onChange,
}: ISelectProps) => {

  const handleSelectChange = (value: string) => {
    let updated: string[];
    if (!selectedItems.includes(value)) {
      updated = [...selectedItems, value];
    } else {
      updated = selectedItems.filter((item) => item !== value);
    }
    onChange(updated);
  };

  const isOptionSelected = (value: string): boolean => {
    return selectedItems.includes(value) ? true : false;
  };

  // Compute selected labels for display
  const selectedLabels = values
    .filter((v) => selectedItems.includes(v.value))
    .map((v) => v.label);
  const display = selectedLabels.join(", ");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between min-w-0"
          >
            <div className="truncate text-left w-full">
              {selectedItems.length === 0 ? placeholder : display}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {values.map((value: ISelectProps["options"][0], index: number) => (
            <DropdownMenuItem
              key={index}
              className="flex items-center gap-2 whitespace-normal pr-2 cursor-pointer"
              onSelect={e => {
                e.preventDefault();
                handleSelectChange(value.value);
              }}
            >
              <Checkbox
                checked={isOptionSelected(value.value)}
                tabIndex={-1}
                className="mr-2"
                aria-readonly
              />
              <span className="truncate max-w-[140px]">{value.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MultiSelect;