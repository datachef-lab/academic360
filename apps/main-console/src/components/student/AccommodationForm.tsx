import { useEffect, useState } from "react";
import { Accommodation } from "@/types/user/accommodation";
import { PlaceOfStay } from "@/types/enums";
import { getAccommodationByStudentId, createAccommodation, updateAccommodation } from "@/services/accommodation.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { Country } from "@/types/resources/country.types";
import { State } from "@/types/resources/state.types";
import { City } from "@/types/resources/city.types";
import { getAllCountries } from "@/services/country.service";
import { getAllStates } from "@/services/state.service";
import { getAllCities } from "@/services/city.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccommodationFormProps {
  studentId: number;
}

const placeOfStayOptions: { value: PlaceOfStay; label: string }[] = [
  { value: "OWN", label: "Own" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "FAMILY_FRIENDS", label: "Family/Friends" },
  { value: "PAYING_GUEST", label: "Paying Guest" },
  { value: "RELATIVES", label: "Relatives" },
];

const localityTypeOptions = [
  { value: "RURAL", label: "Rural" },
  { value: "URBAN", label: "Urban" },
];

// Type for submission data with string dates
type AccommodationSubmissionData = Omit<Partial<Accommodation>, 'startDate' | 'endDate'> & {
  startDate?: string;
  endDate?: string;
};

// Utility to prepare data for backend submission
function prepareDataForSubmission(data: Partial<Accommodation>): AccommodationSubmissionData {
  const prepared = { ...data } as AccommodationSubmissionData;
  
  // Convert dates to strings for backend
  if (prepared.startDate) {
    prepared.startDate = new Date(prepared.startDate).toISOString().split('T')[0];
  }
  if (prepared.endDate) {
    prepared.endDate = new Date(prepared.endDate).toISOString().split('T')[0];
  }
  
  // Handle address data
  if (prepared.address) {
    const address = { ...prepared.address };
    
    // Remove nested objects and keep only IDs
    delete (address as Record<string, unknown>).country;
    delete (address as Record<string, unknown>).state;
    delete (address as Record<string, unknown>).city;
    delete (address as Record<string, unknown>).createdAt;
    delete (address as Record<string, unknown>).updatedAt;
    
    // Ensure we have the correct ID structure
    if (address.id === undefined) {
      delete (address as Record<string, unknown>).id;
    }
    
    prepared.address = address;
  }
  
  // Remove accommodation timestamps
  delete (prepared as Record<string, unknown>).createdAt;
  delete (prepared as Record<string, unknown>).updatedAt;
  
  return prepared;
}

// Utility to normalize accommodation data from backend
function normalizeAccommodationData(data: Partial<Accommodation>): Partial<Accommodation> {
  if (!data) return data;
  
  const normalized = { ...data };
  
  // Handle address normalization
  if (normalized.address) {
    const address = { ...normalized.address };
    
    // Extract IDs from nested objects if they exist
    if (address.country && typeof address.country === 'object') {
      address.countryId = (address.country as { id: number }).id;
    }
    if (address.state && typeof address.state === 'object') {
      address.stateId = (address.state as { id: number }).id;
    }
    if (address.city && typeof address.city === 'object') {
      address.cityId = (address.city as { id: number }).id;
    }
    
    normalized.address = address;
  }
  
  return normalized;
}

export default function AccommodationForm({ studentId }: AccommodationFormProps) {
  const [formData, setFormData] = useState<Partial<Accommodation>>({
    studentId: Number(studentId),
    placeOfStay: null,
    startDate: undefined,
    endDate: undefined,
    address: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch all data in parallel
        const [countriesData, statesData, citiesData, accommodationResponse] = await Promise.all([
          getAllCountries(),
          getAllStates(),
          getAllCities(),
          getAccommodationByStudentId(studentId).catch(() => ({ payload: null }))
        ]);

        setCountries(countriesData);
        setStates(statesData);
        setCities(citiesData);

        const accommodation = accommodationResponse?.payload;
        if (accommodation) {
          console.log('Loaded accommodation data:', accommodation);
          const normalized = normalizeAccommodationData(accommodation);
          console.log('Normalized accommodation data:', normalized);
          setFormData(normalized);
        }
      } catch (error) {
        console.error('Error loading accommodation data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [studentId]);

  const handleChange = (field: keyof Accommodation, value: string | number | null | object | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentIdNum = Number(formData.studentId);
      
      // Prepare data for submission
      const submissionData = prepareDataForSubmission({
        ...formData,
        studentId: studentIdNum,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      console.log('Sending accommodation data:', submissionData);
      
      const latest = (await getAccommodationByStudentId(studentId))?.payload;
      if (latest?.id) {
        const result = await updateAccommodation(latest.id, submissionData as Partial<Accommodation>);
        console.log('Update result:', result);
        toast.success("Accommodation updated!");
      } else {
        const result = await createAccommodation(submissionData as Partial<Accommodation>);
        console.log('Create result:', result);
        toast.success("Accommodation created!");
      }
      
      // Always refetch to get fresh data (including updated timestamps or IDs)
      const updated = (await getAccommodationByStudentId(studentId))?.payload;
      console.log('Refetched accommodation data:', updated);
      if (updated) {
        const normalized = normalizeAccommodationData(updated);
        setFormData(normalized);
      }
    } catch (error) {
      console.error('Accommodation save error:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { status?: number } }).response?.status === 409) {
        toast.error("Duplicate entry: A record already exists for this student.");
      } else {
        toast.error("Failed to save Accommodation.");
        console.error("Form submission error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current country, state, and city IDs for filtering
  const currentCountryId = formData.address?.countryId;
  const currentStateId = formData.address?.stateId;
  const currentCityId = formData.address?.cityId;

  // Filter states and cities based on selection
  const filteredStates = states.filter(state => 
    !currentCountryId || state.countryId === currentCountryId
  );
  
  const filteredCities = cities.filter(city => 
    !currentStateId || city.stateId === currentStateId
  );

  // Debug logging
  console.log('Current IDs:', { currentCountryId, currentStateId, currentCityId });
  console.log('Available states:', states.length, 'Filtered states:', filteredStates.length);
  console.log('Available cities:', cities.length, 'Filtered cities:', filteredCities.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800 justify-center">
            <CheckCircle2 className="w-5 h-5" />
            Accommodation Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="placeOfStay">Place of Stay</Label>
                <Select
                  value={formData.placeOfStay || ""}
                  onValueChange={(value: string) =>
                    handleChange("placeOfStay", value as PlaceOfStay)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of stay" />
                  </SelectTrigger>
                  <SelectContent>
                    {placeOfStayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handleChange("startDate", e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handleChange("endDate", e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Address Section (all fields) */}
            <div className="space-y-2 border rounded-lg p-4">
              <Label>Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Country Name</Label>
                  <Select
                    value={currentCountryId?.toString() || ""}
                    onValueChange={(value) => {
                      console.log('Country selected:', value);
                      const newAddress = { 
                        ...formData.address, 
                        countryId: Number(value), 
                        stateId: null, 
                        cityId: null 
                      };
                      handleChange("address", newAddress);
                    }}
                    disabled={isLoadingData}
                  >
                    <SelectTrigger><SelectValue placeholder={isLoadingData ? "Loading..." : "Select country"} /></SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id!.toString()}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State Name</Label>
                  <Select
                    value={currentStateId?.toString() || ""}
                    onValueChange={(value) => {
                      console.log('State selected:', value);
                      const newAddress = { 
                        ...formData.address, 
                        stateId: Number(value), 
                        cityId: null 
                      };
                      handleChange("address", newAddress);
                    }}
                    disabled={!currentCountryId || isLoadingData}
                  >
                    <SelectTrigger><SelectValue placeholder={!currentCountryId ? "Select country first" : isLoadingData ? "Loading..." : "Select state"} /></SelectTrigger>
                    <SelectContent>
                      {filteredStates.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City Name</Label>
                  <Select
                    value={currentCityId?.toString() || ""}
                    onValueChange={(value) => {
                      console.log('City selected:', value);
                      const newAddress = { 
                        ...formData.address, 
                        cityId: Number(value) 
                      };
                      handleChange("address", newAddress);
                    }}
                    disabled={!currentStateId || isLoadingData}
                  >
                    <SelectTrigger><SelectValue placeholder={!currentStateId ? "Select state first" : isLoadingData ? "Loading..." : "Select city"} /></SelectTrigger>
                    <SelectContent>
                      {filteredCities.map((city) => (
                        <SelectItem key={city.id} value={city.id!.toString()}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label>Address Line</Label>
                  <Input
                    value={formData.address?.addressLine || ""}
                    onChange={e => handleChange("address", { ...formData.address, addressLine: e.target.value })}
                    placeholder="Enter address line"
                  />
                </div>
                <div>
                  <Label>Landmark</Label>
                  <Input
                    value={formData.address?.landmark || ""}
                    onChange={e => handleChange("address", { ...formData.address, landmark: e.target.value })}
                    placeholder="Enter landmark"
                  />
                </div>
                <div>
                  <Label>Locality Type</Label>
                  <Select
                    value={formData.address?.localityType || ""}
                    onValueChange={value => handleChange("address", { ...formData.address, localityType: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select locality type" /></SelectTrigger>
                    <SelectContent>
                      {localityTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.address?.phone || ""}
                    onChange={e => handleChange("address", { ...formData.address, phone: e.target.value })}
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={formData.address?.pincode || ""}
                    onChange={e => handleChange("address", { ...formData.address, pincode: e.target.value })}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center mb-5 gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
