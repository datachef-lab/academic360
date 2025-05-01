import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, User, Phone, Mail, Home, Shield } from "lucide-react";
import { EmergencyContact } from "@/types/student";

interface EmergencyContactFormProps {
  onSubmit: (data: EmergencyContact) => void;
  initialData?: Partial<EmergencyContact>;
}

export default function EmergencyContactForm({ onSubmit, initialData = {} }: EmergencyContactFormProps) {
  const [formData, setFormData] = useState<EmergencyContact>({
    primaryContactName: initialData.primaryContactName || "",
    primaryContactRelationship: initialData.primaryContactRelationship || "",
    primaryContactPhone: initialData.primaryContactPhone || "",
    primaryContactEmail: initialData.primaryContactEmail || "",
    primaryContactAddress: initialData.primaryContactAddress || "",
    secondaryContactName: initialData.secondaryContactName || "",
    secondaryContactRelationship: initialData.secondaryContactRelationship || "",
    secondaryContactPhone: initialData.secondaryContactPhone || "",
    secondaryContactEmail: initialData.secondaryContactEmail || "",
    secondaryContactAddress: initialData.secondaryContactAddress || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.primaryContactName || !formData.primaryContactPhone) {
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
        {/* Primary Contact */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Primary Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primaryContactName" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                Name *
              </Label>
              <div className="relative">
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                  placeholder="Enter name"
                  required
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactRelationship" className="flex items-center gap-2 text-gray-700">
                <Shield className="w-4 h-4" />
                Relationship *
              </Label>
              <div className="relative">
                <Select
                  value={formData.primaryContactRelationship}
                  onValueChange={(value) => setFormData({ ...formData, primaryContactRelationship: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Relative">Relative</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactPhone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <div className="relative">
                <Input
                  id="primaryContactPhone"
                  value={formData.primaryContactPhone}
                  onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                  placeholder="Enter phone number"
                  type="tel"
                  required
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactEmail" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="relative">
                <Input
                  id="primaryContactEmail"
                  value={formData.primaryContactEmail}
                  onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="primaryContactAddress" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Address
              </Label>
              <div className="relative">
                <Input
                  id="primaryContactAddress"
                  value={formData.primaryContactAddress}
                  onChange={(e) => setFormData({ ...formData, primaryContactAddress: e.target.value })}
                  placeholder="Enter address"
                  className="pl-10"
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Contact */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Secondary Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="secondaryContactName" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                Name
              </Label>
              <div className="relative">
                <Input
                  id="secondaryContactName"
                  value={formData.secondaryContactName}
                  onChange={(e) => setFormData({ ...formData, secondaryContactName: e.target.value })}
                  placeholder="Enter name"
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryContactRelationship" className="flex items-center gap-2 text-gray-700">
                <Shield className="w-4 h-4" />
                Relationship
              </Label>
              <div className="relative">
                <Select
                  value={formData.secondaryContactRelationship}
                  onValueChange={(value) => setFormData({ ...formData, secondaryContactRelationship: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Relative">Relative</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryContactPhone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <div className="relative">
                <Input
                  id="secondaryContactPhone"
                  value={formData.secondaryContactPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryContactPhone: e.target.value })}
                  placeholder="Enter phone number"
                  type="tel"
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryContactEmail" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="relative">
                <Input
                  id="secondaryContactEmail"
                  value={formData.secondaryContactEmail}
                  onChange={(e) => setFormData({ ...formData, secondaryContactEmail: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="secondaryContactAddress" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Address
              </Label>
              <div className="relative">
                <Input
                  id="secondaryContactAddress"
                  value={formData.secondaryContactAddress}
                  onChange={(e) => setFormData({ ...formData, secondaryContactAddress: e.target.value })}
                  placeholder="Enter address"
                  className="pl-10"
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
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