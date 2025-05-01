import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, User, Briefcase, Phone, Mail, Home, Shield } from "lucide-react";
import { GuardianDetails } from "@/types/student";

interface GuardianDetailsFormProps {
  onSubmit: (data: GuardianDetails) => void;
  initialData?: Partial<GuardianDetails>;
}

export default function GuardianDetailsForm({ onSubmit, initialData = {} }: GuardianDetailsFormProps) {
  const [formData, setFormData] = useState<GuardianDetails>({
    guardianName: initialData.guardianName || "",
    relationship: initialData.relationship || "",
    occupation: initialData.occupation || "",
    contactNumber: initialData.contactNumber || "",
    email: initialData.email || "",
    address: initialData.address || "",
    isLocalGuardian: initialData.isLocalGuardian || "No",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.guardianName || !formData.relationship) {
        throw new Error("Please fill in all required fields");
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

  
      className="space-y-6 bg-white rounded-xl shadow-sm p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="guardianName" className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4" />
            Guardian's Name *
          </Label>
          <div className="relative">
            <Input
              id="guardianName"
              value={formData.guardianName}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
              placeholder="Enter guardian's name"
              required
              className="pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship" className="flex items-center gap-2 text-gray-700">
            <Shield className="w-4 h-4" />
            Relationship *
          </Label>
          <div className="relative">
            <Select
              value={formData.relationship}
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Uncle">Uncle</SelectItem>
                <SelectItem value="Aunt">Aunt</SelectItem>
                <SelectItem value="Grandfather">Grandfather</SelectItem>
                <SelectItem value="Grandmother">Grandmother</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation" className="flex items-center gap-2 text-gray-700">
            <Briefcase className="w-4 h-4" />
            Occupation
          </Label>
          <div className="relative">
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="Enter occupation"
              className="pl-10"
            />
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            Contact Number
          </Label>
          <div className="relative">
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Enter contact number"
              type="tel"
              className="pl-10"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              type="email"
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isLocalGuardian" className="flex items-center gap-2 text-gray-700">
            <Shield className="w-4 h-4" />
            Is Local Guardian?
          </Label>
          <div className="relative">
            <Select
              value={formData.isLocalGuardian}
              onValueChange={(value) => setFormData({ ...formData, isLocalGuardian: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2 text-gray-700">
            <Home className="w-4 h-4" />
            Address
          </Label>
          <div className="relative">
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              className="pl-10"
            />
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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