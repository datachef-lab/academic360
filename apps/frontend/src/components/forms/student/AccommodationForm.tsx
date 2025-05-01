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
  IndianRupee, 
  MapPin, 
  User, 
  Phone,
  DoorOpen,
  Layers,
  Building
} from "lucide-react";
import { Accommodation } from "@/types/student";

interface AccommodationFormProps {
  onSubmit: (data: Accommodation) => void;
  initialData?: Partial<Accommodation>;
}

export default function AccommodationForm({ onSubmit, initialData = {} }: AccommodationFormProps) {
  const [formData, setFormData] = useState<Accommodation>({
    accommodationType: initialData.accommodationType || "",
    hostelName: initialData.hostelName || "",
    roomNumber: initialData.roomNumber || "",
    block: initialData.block || "",
    floor: initialData.floor || "",
    checkInDate: initialData.checkInDate || "",
    checkOutDate: initialData.checkOutDate || "",
    monthlyRent: initialData.monthlyRent || "",
    depositAmount: initialData.depositAmount || "",
    address: initialData.address || "",
    contactPerson: initialData.contactPerson || "",
    contactNumber: initialData.contactNumber || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.accommodationType) {
        throw new Error("Please select accommodation type");
      }

      if (formData.accommodationType === "Hostel" && !formData.hostelName) {
        throw new Error("Please enter hostel name");
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
     
  
      className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="accommodationType" className="flex items-center gap-2 text-gray-700">
            <Home className="w-4 h-4" />
            Accommodation Type *
          </Label>
          <Select
            value={formData.accommodationType}
            onValueChange={(value) => setFormData({ ...formData, accommodationType: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select accommodation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hostel">Hostel</SelectItem>
              <SelectItem value="PG">PG</SelectItem>
              <SelectItem value="Rental">Rental</SelectItem>
              <SelectItem value="Own House">Own House</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.accommodationType === "Hostel" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="hostelName" className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4" />
                Hostel Name *
              </Label>
              <Input
                id="hostelName"
                value={formData.hostelName}
                onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                placeholder="Enter hostel name"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="flex items-center gap-2 text-gray-700">
                <DoorOpen className="w-4 h-4" />
                Room Number
              </Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="Enter room number"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="block" className="flex items-center gap-2 text-gray-700">
                <Building className="w-4 h-4" />
                Block
              </Label>
              <Input
                id="block"
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                placeholder="Enter block"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor" className="flex items-center gap-2 text-gray-700">
                <Layers className="w-4 h-4" />
                Floor
              </Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="Enter floor"
                className="w-full"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="checkInDate" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Check-in Date
          </Label>
          <Input
            id="checkInDate"
            type="date"
            value={formData.checkInDate}
            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkOutDate" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Check-out Date
          </Label>
          <Input
            id="checkOutDate"
            type="date"
            value={formData.checkOutDate}
            onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyRent" className="flex items-center gap-2 text-gray-700">
            <IndianRupee className="w-4 h-4" />
            Monthly Rent
          </Label>
          <Input
            id="monthlyRent"
            type="number"
            value={formData.monthlyRent}
            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
            placeholder="Enter monthly rent"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="depositAmount" className="flex items-center gap-2 text-gray-700">
            <IndianRupee className="w-4 h-4" />
            Deposit Amount
          </Label>
          <Input
            id="depositAmount"
            type="number"
            value={formData.depositAmount}
            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
            placeholder="Enter deposit amount"
            className="w-full"
          />
        </div>

        <div className="col-span-2 lg:col-span-3 space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter accommodation address"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson" className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4" />
            Contact Person
          </Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Enter contact person name"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            Contact Number
          </Label>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            placeholder="Enter contact number"
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
} 