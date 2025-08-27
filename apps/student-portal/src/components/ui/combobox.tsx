"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxProps = {
  dataArr: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  dataArr,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Filter options by label (case-insensitive, robust)
  const filtered = search
    ? dataArr.filter((item) =>
        (item.label || "")
          .toLowerCase()
          .trim()
          .includes(search.toLowerCase().trim())
      )
    : dataArr

  console.log("Filtered options:", filtered, "Search:", search)

  const selectedLabel = value
    ? dataArr.find((item) => item.value === value)?.label
    : ""

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
          {selectedLabel || placeholder}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width,240px)] p-0 max-h-96 overflow-y-auto">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder ? `Search ${placeholder.toLowerCase()}` : "Search..."}
          />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={(currentValue) => {
                    onChange(item.value)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}