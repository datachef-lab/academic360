import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  User, 
  Hash, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Clock, 
  Users, 
  Building2,

  Layers
} from "lucide-react";
import { AcademicIdentifier } from "@/types/student";

interface AcademicIdentifierFormProps {
  onSubmit: (data: AcademicIdentifier) => void;
  initialData?: Partial<AcademicIdentifier>;
}

export default function AcademicIdentifierForm({ onSubmit, initialData = {} }: AcademicIdentifierFormProps) {
  const [formData, setFormData] = useState({
    registrationNumber: initialData.registrationNumber || "",
    rollNumber: initialData.rollNumber || "",
    uid: initialData.uid || "",
    course: initialData.course || "",
    specialization: initialData.specialization || "",
    year: initialData.year || "",
    semester: initialData.semester || "",
    section: initialData.section || "",
    batch: initialData.batch || "",
    shift: initialData.shift || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.registrationNumber || !formData.rollNumber || !formData.uid || !formData.course) {
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
    
    
      className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="registrationNumber" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            Registration Number *
          </Label>
          <div className="relative">
            <Input
              id="registrationNumber"
              value={formData.registrationNumber}
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
              value={formData.rollNumber}
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
              value={formData.uid}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              placeholder="Enter UID"
              required
              className="pl-10 w-full"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="course" className="flex items-center gap-2 text-gray-700">
            <GraduationCap className="w-4 h-4" />
            Course *
          </Label>
          <Select
            value={formData.course}
            onValueChange={(value) => setFormData({ ...formData, course: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B.Sc.">B.Sc.</SelectItem>
              <SelectItem value="B.Com.">B.Com.</SelectItem>
              <SelectItem value="B.A.">B.A.</SelectItem>
              <SelectItem value="M.Sc.">M.Sc.</SelectItem>
              <SelectItem value="M.Com.">M.Com.</SelectItem>
              <SelectItem value="M.A.">M.A.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization" className="flex items-center gap-2 text-gray-700">
            <BookOpen className="w-4 h-4" />
            Specialization
          </Label>
          <div className="relative">
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="Enter specialization"
              className="pl-10 w-full"
            />
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Year
          </Label>
          <Select
            value={formData.year}
            onValueChange={(value) => setFormData({ ...formData, year: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st Year</SelectItem>
              <SelectItem value="2nd">2nd Year</SelectItem>
              <SelectItem value="3rd">3rd Year</SelectItem>
              <SelectItem value="4th">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester" className="flex items-center gap-2 text-gray-700">
            <Layers className="w-4 h-4" />
            Semester
          </Label>
          <Select
            value={formData.semester}
            onValueChange={(value) => setFormData({ ...formData, semester: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st Semester</SelectItem>
              <SelectItem value="2nd">2nd Semester</SelectItem>
              <SelectItem value="3rd">3rd Semester</SelectItem>
              <SelectItem value="4th">4th Semester</SelectItem>
              <SelectItem value="5th">5th Semester</SelectItem>
              <SelectItem value="6th">6th Semester</SelectItem>
              <SelectItem value="7th">7th Semester</SelectItem>
              <SelectItem value="8th">8th Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section" className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4" />
            Section
          </Label>
          <div className="relative">
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="Enter section"
              className="pl-10 w-full"
            />
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch" className="flex items-center gap-2 text-gray-700">
            <Building2 className="w-4 h-4" />
            Batch
          </Label>
          <div className="relative">
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="Enter batch"
              className="pl-10 w-full"
            />
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shift" className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4" />
            Shift
          </Label>
          <Select
            value={formData.shift}
            onValueChange={(value) => setFormData({ ...formData, shift: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
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