import React, { useCallback, useState, useEffect, forwardRef } from "react";

// shadcn
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandItem, CommandInput, CommandEmpty, CommandGroup } from "@/components/ui/command";

// utils
import { cn } from "@/lib/utils";

// assets
import { ChevronDown, CheckIcon, Globe } from "lucide-react";

// State-state-city package
import { City, State } from "country-state-city";
import { countries } from "country-data-list";

// City interface
interface City {
  name: string;
  stateCode: string;
  countryCode: string;
}

interface CityDropdownProps {
  selectedState: string; // The selected state name
  selectedCountry: string; // The selected country name
  onChange?: (city: City) => void;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
}

const CityDropdownComponent = (
  {
    selectedState,
    selectedCountry,
    onChange,
    disabled = false,
    placeholder = "Select a city",
    slim = false,
    ...props
  }: CityDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | undefined>(undefined);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (selectedState && selectedCountry) {
      // Fetch cities based on selected country and state
      console.log("city:", City.getAllCities()[0]);
      console.log(selectedState);

      const countryInfo = countries.all.find((country) => country.name === selectedCountry);
      console.log(countryInfo);

      const stateInfo = State.getAllStates().find((st) => st.name === selectedState);
      console.log(stateInfo);
      const fetchedCities =
        City.getAllCities().filter(
          (ele) => ele.countryCode === countryInfo?.alpha2 && ele.stateCode === stateInfo?.isoCode,
        ) || [];
      console.log(fetchedCities);
      setCities(fetchedCities);
      setSelectedCity(undefined); // Reset selected city when state changes
    }
  }, [selectedState, selectedCountry]);

  const handleSelect = useCallback(
    (city: City) => {
      console.log("🏙 CityDropdown value: ", city);
      setSelectedCity(city);
      onChange?.(city);
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
        {selectedCity ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedCity.name}</span>
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
              <CommandInput placeholder="Search city..." />
            </div>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {cities.map((city, key) => (
                <CommandItem className="flex items-center w-full gap-2" key={key} onSelect={() => handleSelect(city)}>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{city.name}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      city.name === selectedCity?.name ? "opacity-100" : "opacity-0",
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

CityDropdownComponent.displayName = "CityDropdownComponent";

export const CityDropdown = forwardRef(CityDropdownComponent);
