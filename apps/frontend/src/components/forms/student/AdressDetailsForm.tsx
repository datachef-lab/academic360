import React, { useState } from "react";
import { Address } from "../../../types/resources/address";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { MapPin, Building2, Globe, Phone, Mailbox, CheckCircle2 } from "lucide-react";

interface AddressDetailsFormProps {
  onSubmit: (data: Address) => void;
  initialData?: Partial<Address>;
}

export const AddressDetailsForm: React.FC<AddressDetailsFormProps> = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState<Address>({
    // country: initialData.country || "",
    // state: initialData.state || "",
    // city: initialData.city || "",
    city: null,
    country: null,
    state: null,
    // addressLine: initialData.addressLine || "",
    addressLine: initialData.addressLine || "",
    landmark: initialData.landmark || "",
    localityType: initialData.localityType || null,
    phone: initialData.phone || "",
    pincode: initialData.pincode || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2 text-gray-700">
            <Globe className="w-4 h-4" />
            Country *
          </Label>
          <Input
            id="country"
            // value={formData.country || ""}
            // onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Enter country"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            State *
          </Label>
          <Input
            id="state"
            // value={formData.stateId || ""}
            // onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Enter state"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2 text-gray-700">
            <Building2 className="w-4 h-4" />
            City *
          </Label>
          <Input
            id="city"
            // value={formData.city || ""}
            // onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Enter city"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="localityType" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            Locality Type *
          </Label>
          <Select
            value={formData.localityType || ""}
            onValueChange={(value) => setFormData({ ...formData, localityType: value as "RURAL" | "URBAN" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select locality type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RURAL">Rural</SelectItem>
              <SelectItem value="URBAN">Urban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="addressLine" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            Address Line *
          </Label>
          <Textarea
            id="addressLine"
            value={formData.addressLine || ""}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
            placeholder="Enter full address"
            className="w-full"
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="landmark" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            Landmark
          </Label>
          <Input
            id="landmark"
            value={formData.landmark || ""}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            placeholder="Enter nearby landmark"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            Phone *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode" className="flex items-center gap-2 text-gray-700">
            <Mailbox className="w-4 h-4" />
            Pincode *
          </Label>
          <Input
            id="pincode"
            value={formData.pincode || ""}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="Enter pincode"
            className="w-full"
          />
        </div>
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
};
