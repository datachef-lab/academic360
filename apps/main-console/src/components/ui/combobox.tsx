"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ComboboxProps = {
  dataArr: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Combobox({
  dataArr,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Filter options by label (case-insensitive, robust)
  const filtered = search
    ? dataArr.filter((item) => (item.label || "").toLowerCase().trim().includes(search.toLowerCase().trim()))
    : dataArr;

  const selectedLabel = value ? dataArr.find((item) => item.value === value)?.label : "";

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between w-full", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <span>{selectedLabel || placeholder}</span>
            {!selectedLabel && dataArr.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({dataArr.length} option{dataArr.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width,240px)] p-0 z-50 max-h-72 overflow-auto"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col bg-white border border-gray-200 rounded-md shadow-lg">
          {/* search */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder ? `Search ${placeholder.toLowerCase()}` : "Search..."}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {filtered.length > 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b bg-background">
              {filtered.length} option{filtered.length !== 1 ? "s" : ""} available
            </div>
          )}

          {/* Items - PopoverContent handles scroll; avoid nested scrollers */}
          <div className="py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm">No options found.</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.value}
                  className="relative flex cursor-pointer gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground whitespace-nowrap overflow-hidden text-ellipsis"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <CheckIcon className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  <span className="block truncate">{item.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
