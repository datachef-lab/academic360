"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InputBox({ fullMarks }: { fullMarks: number }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const marksOptions = React.useMemo(() => {
    const options = [
      {
        value: "-1",
        label: "AB",
      },
    ];

    for (let i = 1; i <= fullMarks; i++) {
      options.push({
        value: i.toString(),
        label: i.toString(),
      });
    }

    return options;
  }, [fullMarks]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[95%] justify-between rounded-none h-[92%] border-slate-400 border-none"
        >
          <span className="text-slate-400 text-xs">
            {value ? marksOptions.find((marksOption) => marksOption.value === value)?.label : "type marks..."}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="type marks..." className="h-9" />
          <CommandList>
            <CommandEmpty>Invalid Input.</CommandEmpty>
            <CommandGroup>
              {marksOptions.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {framework.label}
                  <Check className={cn("ml-auto", value === framework.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
