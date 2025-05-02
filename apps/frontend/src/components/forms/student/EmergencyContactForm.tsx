import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, User, Phone, Mail, Shield } from "lucide-react";
import { EmergencyContact } from "@/types/user/emergency-contact";

interface EmergencyContactFormProps {
  onSubmit: (data: EmergencyContact) => void;
  initialData?: Partial<EmergencyContact>;
}

export default function EmergencyContactForm({ onSubmit, initialData = {} }: EmergencyContactFormProps) {
  const [formData, setFormData] = useState<EmergencyContact>({
    studentId: initialData.studentId || 0,
    personName: initialData.personName || "",
    relationToStudent: initialData.relationToStudent || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    officePhone: initialData.officePhone || "",
    residentialPhone: initialData.residentialPhone || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // if (!formData.personName || !formData.phone) {
      //   throw new Error("Please fill in all required fields");
      // }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          {/* <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Emergency Contact
          </h3> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="personName" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                Name *
              </Label>
              <div className="relative">
                <Input
                  id="personName"
                  value={formData.personName || ""}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  placeholder="Enter name"
                  required
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationToStudent" className="flex items-center gap-2 text-gray-700">
                <Shield className="w-4 h-4" />
                Relationship *
              </Label>
              <div className="relative">
                <Select
                  value={formData.relationToStudent || ""}
                  onValueChange={(value) => setFormData({ ...formData, relationToStudent: value })}
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
              <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  type="tel"
                  required
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
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="officePhone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Office Phone
              </Label>
              <div className="relative">
                <Input
                  id="officePhone"
                  value={formData.officePhone || ""}
                  onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })}
                  placeholder="Enter office phone"
                  type="tel"
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialPhone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Residential Phone
              </Label>
              <div className="relative">
                <Input
                  id="residentialPhone"
                  value={formData.residentialPhone || ""}
                  onChange={(e) => setFormData({ ...formData, residentialPhone: e.target.value })}
                  placeholder="Enter residential phone"
                  type="tel"
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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