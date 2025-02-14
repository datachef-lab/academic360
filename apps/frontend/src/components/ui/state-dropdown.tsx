import React, { useCallback, useState, useEffect, forwardRef } from "react";

// shadcn
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandItem, CommandInput, CommandEmpty, CommandGroup } from "@/components/ui/command";

// utils
import { cn } from "@/lib/utils";

// assets
import { ChevronDown, CheckIcon, Globe } from "lucide-react";

// data
import { countries } from "country-data-list";

// country-state-city package
import { State, Country } from "country-state-city";

// Country interface
export interface Country {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
}

// State interface
interface State {
  name: string;
  isoCode: string;
}

interface StateDropdownProps {
  selectedCountry: string; // Receive selected country
  onChange?: (state: State) => void;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
}

const StateDropdownComponent = (
  {
    selectedCountry,
    onChange,
    disabled = false,
    placeholder = "Select a state",
    slim = false,
    ...props
  }: StateDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<State | undefined>(undefined);
  const [states, setStates] = useState<State[]>([]);

  useEffect(() => {
    if (selectedCountry) {
      console.log(selectedCountry);
      // Get country alpha2 code based on country name
      const countryInfo = countries.all.find((country) => country.name === selectedCountry);
      console.log(countryInfo);

      if (countryInfo) {
        // Fetch the states using the country alpha2 code
        const fetchedStates = State.getAllStates().filter((st) => st.countryCode == countryInfo.alpha2);
        console.log(fetchedStates);
        setStates(fetchedStates);
        setSelectedState(undefined); // Reset selected state when country changes
      }
    }
  }, [selectedCountry]);

  const handleSelect = useCallback(
    (state: State) => {
      console.log("🌍 StateDropdown value: ", state);
      setSelectedState(state);
      onChange?.(state);
      setOpen(false);
    },
    [onChange],
  );

  const triggerClasses = cn(
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    slim === true && "w-20",
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={ref} className={triggerClasses} disabled={disabled} {...props}>
        {selectedState ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedState.name}</span>
          </div>
        ) : (
          <span>{slim === false ? placeholder : <Globe size={20} />}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent collisionPadding={10} side="bottom" className="min-w-[--radix-popper-anchor-width] p-0">
        <Command className="w-full max-h-[200px] sm:max-h-[500px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Search state..." />
            </div>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {states
                .filter((x) => x.name)
                .map((state, key) => (
                  <CommandItem
                    className="flex items-center w-full gap-2"
                    key={key}
                    onSelect={() => handleSelect(state)}
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{state.name}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        state.name === selectedState?.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

StateDropdownComponent.displayName = "StateDropdownComponent";

export const StateDropdown = forwardRef(StateDropdownComponent);
