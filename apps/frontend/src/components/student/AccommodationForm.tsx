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

// Utility to remove createdAt and updatedAt from object and nested
function stripDates<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripDates) as T;
  } else if (obj && typeof obj === "object") {
    const result = {} as { [K in keyof T]: T[K] };
    for (const key in obj) {
      if (key === "createdAt" || key === "updatedAt") continue;
      const value = obj[key];
      result[key] = (typeof value === "object" && value !== null)
        ? stripDates(value)
        : value;
    }
    return result as T;
  }
  return obj;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAccommodationByStudentId(studentId);
        const accommodation = response?.payload;
        if (accommodation) {
          setFormData(accommodation);
        }
      } catch {
        // Optionally handle 404 (no record) gracefully
      }
    };
    fetchData();
    // Fetch all countries, states, and cities on mount
    getAllCountries().then(setCountries);
    getAllStates().then(setStates);
    getAllCities().then(setCities);
  }, [studentId]);

  const handleChange = (field: keyof Accommodation, value: string | number | null | object | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentIdNum = Number(formData.studentId);
      const cleaned = stripDates({ ...formData, studentId: studentIdNum });
      const latest = (await getAccommodationByStudentId(studentId))?.payload;
      if (latest?.id) {
        await updateAccommodation(latest.id, cleaned);
        toast.success("Accommodation updated!");
      } else {
        await createAccommodation(cleaned);
        toast.success("Accommodation created!");
      }
      // Always refetch to get fresh data (including updated timestamps or IDs)
      const updated = (await getAccommodationByStudentId(studentId))?.payload;
      if (updated) setFormData(updated);
    } catch (error) {
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
                  <Label>Country</Label>
                  <Select
                    value={formData.address?.countryId?.toString() || ""}
                    onValueChange={(value) => {
                      handleChange("address", { ...formData.address, countryId: Number(value), stateId: null, cityId: null });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id!.toString()}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State</Label>
                  <Select
                    value={formData.address?.stateId?.toString() || ""}
                    onValueChange={(value) => {
                      handleChange("address", { ...formData.address, stateId: Number(value), cityId: null });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {states
                        .filter(state =>
                          !formData.address?.countryId || state.countryId === formData.address?.countryId
                        )
                        .map((state) => (
                          <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Select
                    value={formData.address?.cityId?.toString() || ""}
                    onValueChange={(value) => {
                      handleChange("address", { ...formData.address, cityId: Number(value) });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {cities
                        .filter(city =>
                          !formData.address?.stateId || city.stateId === formData.address?.stateId
                        )
                        .map((city) => (
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
