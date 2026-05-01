"use client";

import * as React from "react";
import { BookOpen, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ComboboxProps = {
  dataArr: { value: string; label: string; imageUrl?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showOptionsHint?: boolean;
  contentClassName?: string;
};

export function Combobox({
  dataArr,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  showOptionsHint = true,
  contentClassName = "",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Filter options by label (case-insensitive, robust)
  const filtered = search
    ? dataArr.filter((item) =>
        (item.label || "").toLowerCase().trim().includes(search.toLowerCase().trim()),
      )
    : dataArr;

  const selectedLabel = value ? dataArr.find((item) => item.value === value)?.label : "";

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between overflow-hidden", className)}
          disabled={disabled}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <span className="truncate text-left">{selectedLabel || placeholder}</span>
            {showOptionsHint && !selectedLabel && dataArr.length > 0 && (
              <span className="hidden shrink-0 text-xs text-muted-foreground xl:inline">
                ({dataArr.filter((item) => item.value !== "").length} option
                {dataArr.filter((item) => item.value !== "").length !== 1 ? "s" : ""} available)
              </span>
            )}
          </div>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "z-[120] flex w-[min(var(--radix-popover-trigger-width,280px),calc(100vw-2rem))] max-h-[min(70vh,var(--radix-popover-content-available-height,80vh))] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0",
          contentClassName,
        )}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command
          shouldFilter={false}
          className="h-auto max-h-full min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
        >
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder ? `Search ${placeholder.toLowerCase()}` : "Search..."}
          />
          <CommandList className="min-h-0 max-h-[min(55vh,400px)] flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            <CommandEmpty>No options found.</CommandEmpty>
            {filtered.length > 0 && (
              <div className="border-b px-2 py-1.5 text-xs text-muted-foreground">
                {filtered.filter((item) => item.value !== "").length} option
                {filtered.filter((item) => item.value !== "").length !== 1 ? "s" : ""} available
              </div>
            )}
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  className="whitespace-normal break-words"
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="mr-2 h-7 w-6 shrink-0 rounded border object-cover"
                    />
                  ) : (
                    <span className="mr-2 inline-flex h-7 w-6 shrink-0 items-center justify-center rounded border bg-muted/40 text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
