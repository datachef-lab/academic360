import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlaceOfStay } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Country, CountryDropdown } from "../ui/country-dropdown";
import { StateDropdown } from "../ui/state-dropdown";
import { CityDropdown } from "../ui/city-dropdown";

// Define Address Schema
const addressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  addressLine: z.string().min(1, "Address is required"),
  landmark: z.string().optional(),
  locality: z.enum(["RURAL", "URBAN"], { required_error: "Select locality type" }),
  phone: z.string().min(10, "Enter a valid phone number").optional(),
  pincode: z.string().min(4, "Enter a valid pincode").optional(),
});

// Define Accommodation Schema with Address
const accommodationSchema = z.object({
  placeOfStay: z.nativeEnum(PlaceOfStay, { required_error: "Please select a place of stay" }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  address: addressSchema, // Embed Address schema
});

type AccommodationFormValues = z.infer<typeof accommodationSchema>;

export default function AccommodationForm() {
  const form = useForm<AccommodationFormValues>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      placeOfStay: undefined,
      startDate: "",
      endDate: "",
      address: {
        country: "",
        state: "",
        city: "",
        addressLine: "",
        landmark: "",
        locality: "RURAL",
        phone: "",
        pincode: "",
      },
    },
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);

  const onSubmit = (data: AccommodationFormValues) => {
    console.log("Form Submitted:", data);
  };

  const handleCountryChange = (country: Country) => {
    console.log(country);
    setSelectedCountry(country.name);
    form.setValue("address.state", "");
  };

  return (
    <div className="flex justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border-none md:max-w-[75%] space-y-6 bg-transparent shadow-none "
        >
          {/* Place of Stay */}
          <FormField
            control={form.control}
            name="placeOfStay"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Place of Stay</FormLabel>
                <FormControl className="w-full ">
                  <select {...field} className="w-full border p-2 rounded-md">
                    <option value="" disabled>
                      Select an option
                    </option>
                    {Object.values(PlaceOfStay).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date Picker */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full justify-start", !field.value && "text-gray-400")}>
                        {field.value ? field.value : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          field.onChange(date.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date Picker */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full justify-start", !field.value && "text-gray-400")}>
                        {field.value ? field.value : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          field.onChange(date.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address Fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="address.country"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <CountryDropdown
                      placeholder="Country"
                      defaultValue={field.value}
                      onChange={(country) => {
                        handleCountryChange(country);
                        field.onChange(country.name);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.state"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    {selectedCountry && (
                      <StateDropdown
                        selectedCountry={selectedCountry}
                        onChange={(state) => {
                          setSelectedState(state.name);
                          field.onChange(state.name);
                        }}
                        placeholder="Select a state"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.city"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    {selectedCountry && selectedState && (
                      <CityDropdown
                        selectedCountry={selectedCountry as string}
                        selectedState={selectedState as string}
                        onChange={(state) => field.onChange(state)}
                        placeholder="Select a state"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="address.addressLine"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Landmark, Locality, Phone, Pincode */}
          <FormField
            name="address.landmark"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Landmark</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.locality"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Locality</FormLabel>
                <FormControl>
                  <select {...field} className="w-full border p-2 rounded-md">
                    <option value="RURAL">Rural</option>
                    <option value="URBAN">Urban</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address.phone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}
