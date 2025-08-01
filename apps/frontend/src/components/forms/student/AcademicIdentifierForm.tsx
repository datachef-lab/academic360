import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  User, 
  Hash, 
  GraduationCap
} from "lucide-react";
import { AcademicIdentifier } from "@/types/user/academic-identifier";

interface AcademicIdentifierFormProps {
  onSubmit: (data: AcademicIdentifier) => void;
  initialData?: Partial<AcademicIdentifier>;
}

export default function AcademicIdentifierForm({ onSubmit, initialData = {} }: AcademicIdentifierFormProps) {
  const [formData, setFormData] = useState<AcademicIdentifier>({
    studentId: initialData.studentId || 0,
    framework: initialData.framework || null,
    rfid: initialData.rfid || null,
    course: initialData.course || null,
    shift: null,
    // pr: initialData.degreeProgramme || null,
    
    cuFormNumber: initialData.cuFormNumber || null,
    uid: initialData.uid || null,
    oldUid: initialData.oldUid || null,
    registrationNumber: initialData.registrationNumber || null,
    rollNumber: initialData.rollNumber || null,
    section: initialData.section || null,
    classRollNumber: initialData.classRollNumber || null,
    apaarId: initialData.apaarId || null,
    abcId: initialData.abcId || null,
    apprid: initialData.apprid || null,
    checkRepeat: initialData.checkRepeat || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // if (!formData.registrationNumber || !formData.rollNumber || !formData.uid) {
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
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="registrationNumber" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            Registration Number *
          </Label>
          <div className="relative">
            <Input
              id="registrationNumber"
              value={formData.registrationNumber || ""}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              placeholder="Enter registration number"
              required
              className="pl-10 w-full"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rollNumber" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            Roll Number *
          </Label>
          <div className="relative">
            <Input
              id="rollNumber"
              value={formData.rollNumber || ""}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              placeholder="Enter roll number"
              required
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uid" className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4" />
            UID *
          </Label>
          <div className="relative">
            <Input
              id="uid"
              value={formData.uid || ""}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              placeholder="Enter UID"
              required
              className="pl-10 w-full"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frameworkType" className="flex items-center gap-2 text-gray-700">
            <GraduationCap className="w-4 h-4" />
            Framework Type
          </Label>
          <Select
            value={formData.framework || ""}
            // onValueChange={(value) => setFormData({ ...formData, framework: value as Framework })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select framework type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CCF">CCF</SelectItem>
              <SelectItem value="CBCS">CBCS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rfid" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            RFID
          </Label>
          <div className="relative">
            <Input
              id="rfid"
              value={formData.rfid || ""}
              onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
              placeholder="Enter RFID"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cuFormNumber" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            CU Form Number
          </Label>
          <div className="relative">
            <Input
              id="cuFormNumber"
              value={formData.cuFormNumber || ""}
              onChange={(e) => setFormData({ ...formData, cuFormNumber: e.target.value })}
              placeholder="Enter CU Form Number"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="classRollNumber" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            Class Roll Number
          </Label>
          <div className="relative">
            <Input
              id="classRollNumber"
              value={formData.classRollNumber || ""}
              onChange={(e) => setFormData({ ...formData, classRollNumber: e.target.value })}
              placeholder="Enter Class Roll Number"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apaarId" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            APAAR ID
          </Label>
          <div className="relative">
            <Input
              id="apaarId"
              value={formData.apaarId || ""}
              onChange={(e) => setFormData({ ...formData, apaarId: e.target.value })}
              placeholder="Enter APAAR ID"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abcId" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            ABC ID
          </Label>
          <div className="relative">
            <Input
              id="abcId"
              value={formData.abcId || ""}
              onChange={(e) => setFormData({ ...formData, abcId: e.target.value })}
              placeholder="Enter ABC ID"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apprid" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            APPR ID
          </Label>
          <div className="relative">
            <Input
              id="apprid"
              value={formData.apprid || ""}
              onChange={(e) => setFormData({ ...formData, apprid: e.target.value })}
              placeholder="Enter APPR ID"
              className="pl-10 w-full"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkRepeat" className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4" />
            Check Repeat
          </Label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="checkRepeat"
              checked={formData.checkRepeat}
              onChange={(e) => setFormData({ ...formData, checkRepeat: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
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