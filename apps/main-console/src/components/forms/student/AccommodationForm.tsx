import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  Home, 
  Building2, 
  Calendar, 
  MapPin, 
  Phone,
  Globe,
  Mailbox
} from "lucide-react";
import { Accommodation } from "@/types/user/accommodation";
import { PlaceOfStay } from "@/types/enums";


interface AccommodationFormProps {
  onSubmit: (data: Accommodation) => void;
  initialData?: Partial<Accommodation>;
}

export default function AccommodationForm({ onSubmit, initialData = {} }: AccommodationFormProps) {
  const [formData, setFormData] = useState<Accommodation>({
    studentId: initialData.studentId || 0,
    placeOfStay: initialData.placeOfStay || null,
    startDate: initialData.startDate || new Date(),
    endDate: initialData.endDate || new Date(),
    address: initialData.address || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.placeOfStay) {
        throw new Error("Please select accommodation type");
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="placeOfStay" className="flex items-center gap-2 text-gray-700">
            <Home className="w-4 h-4" />
            Accommodation Type *
          </Label>
          <Select
            value={formData.placeOfStay || ""}
            onValueChange={(value) => setFormData({ ...formData, placeOfStay: value as PlaceOfStay })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select accommodation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWN">Own House</SelectItem>
              <SelectItem value="HOSTEL">Hostel</SelectItem>
              <SelectItem value="FAMILY_FRIENDS">Family/Friends</SelectItem>
              <SelectItem value="PAYING_GUEST">Paying Guest</SelectItem>
              <SelectItem value="RELATIVES">Relatives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Start Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ""}
            onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ""}
            onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
            className="w-full"
          />
        </div>

        {formData.address && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Address Details</h3>
            <div className="col-span-2 lg:col-span-3 space-y-2">
              <Label htmlFor="addressLine" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                Address Line
              </Label>
              <Input
                id="addressLine"
                value={formData.address.addressLine || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address!, addressLine: e.target.value }
                })}
                placeholder="Enter address line"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4" />
                City
              </Label>
              <Input
                id="city"
                // value={formData.address.city || ""}
                // onChange={(e) => setFormData({
                //   ...formData,
                //   address: { ...formData.address!, city: e.target.value }
                // })}
                placeholder="Enter city"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                State
              </Label>
              <Input
                id="state"
                // value={formData.address.state || ""}
                // onChange={(e) => setFormData({
                //   ...formData,
                //   address: { ...formData.address!, state: e.target.value }
                // })}
                placeholder="Enter state"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2 text-gray-700">
                <Globe className="w-4 h-4" />
                Country
              </Label>
              <Input
                id="country"
                // value={formData.address.country || ""}
                // onChange={(e) => setFormData({
                //   ...formData,
                //   address: { ...formData.address!, country: e.target.value }
                // })}
                placeholder="Enter country"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode" className="flex items-center gap-2 text-gray-700">
                <Mailbox className="w-4 h-4" />
                Pincode
              </Label>
              <Input
                id="pincode"
                value={formData.address.pincode || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address!, pincode: e.target.value }
                })}
                placeholder="Enter pincode"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.address.phone || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address!, phone: e.target.value }
                })}
                placeholder="Enter phone number"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <CheckCircle2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 