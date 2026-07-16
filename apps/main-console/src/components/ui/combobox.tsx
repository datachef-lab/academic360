"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from "lucide-react";
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
  /** When provided, dataArr is treated as already filtered and onSearch is called
   *  with the debounced search term — use this for server-side typeahead. */
  onSearch?: (term: string) => void;
  isSearching?: boolean;
  searchDebounceMs?: number;
  /** Optional label shown when the selected value isn't present in dataArr
   *  (common with async search where the catalogue is paged). */
  selectedLabel?: string;
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
  onSearch,
  isSearching = false,
  searchDebounceMs = 250,
  selectedLabel: selectedLabelProp,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const isAsync = typeof onSearch === "function";

  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  React.useEffect(() => {
    if (!isAsync) return;
    const trimmed = search.trim();
    if (!trimmed) {
      onSearchRef.current?.("");
      return;
    }
    const handle = window.setTimeout(() => {
      onSearchRef.current?.(trimmed);
    }, searchDebounceMs);
    return () => window.clearTimeout(handle);
  }, [isAsync, search, searchDebounceMs]);

  React.useEffect(() => {
    if (!open && search) setSearch("");
  }, [open, search]);

  const filtered = isAsync
    ? search.trim()
      ? dataArr
      : []
    : search
      ? dataArr.filter((item) =>
          (item.label || "").toLowerCase().trim().includes(search.toLowerCase().trim()),
        )
      : dataArr;

  const selectedLabel =
    selectedLabelProp ?? (value ? dataArr.find((item) => item.value === value)?.label : "");

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
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 px-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching...
              </div>
            ) : (
              <CommandEmpty>
                {isAsync && !search ? "Start typing to search." : "No options found."}
              </CommandEmpty>
            )}
            {filtered.length > 0 && !isSearching && (
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
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
                      className="mr-2 h-7 w-6 shrink-0 rounded border object-cover"
                    />
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
