import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { CheckCircle2, Calendar, User, Mail, MapPin, Globe, Cross, Fingerprint, Languages, Building2, Home, UserCog, Book, School, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { Student } from "@/types/user/student";
import { PersonalDetails } from "@/types/user/personal-details";
import { Gender, Disability, Community, Framework, Level, Shift } from "@/types/enums";
import { Address } from "@/types/resources/address";
import { Nationality } from "@/types/resources/nationality";
import { Religion } from "@/types/resources/religion";
import { Category } from "@/types/resources/category";
import { LanguageMedium } from "@/types/resources/language-medium";

interface StudentFormProps {
  onSubmit: (data: { student: Student; personalDetails: PersonalDetails }) => void;
  initialData?: {
    student?: Partial<Student>;
    personalDetails?: Partial<PersonalDetails>;
  };
}

export default function StudentForm({ onSubmit, initialData = {} }: StudentFormProps) {
  const [studentData, setStudentData] = useState<Partial<Student>>({
    name: initialData.student?.name || "",
    community: initialData.student?.community || null,
    handicapped: initialData.student?.handicapped || false,
    level: initialData.student?.level || null,
    framework: initialData.student?.framework || null,
    specializationId: initialData.student?.specializationId || 0,
    shift: initialData.student?.shift || null,
    lastPassedYear: initialData.student?.lastPassedYear || 0,
    notes: initialData.student?.notes || "",
    active: initialData.student?.active || true,
    alumni: initialData.student?.alumni || false,
    leavingDate: initialData.student?.leavingDate || new Date(),
    leavingReason: initialData.student?.leavingReason || "",
  });

  const [personalDetails, setPersonalDetails] = useState<Partial<PersonalDetails>>({
    aadhaarCardNumber: initialData.personalDetails?.aadhaarCardNumber || null,
    nationality: initialData.personalDetails?.nationality || null,
    otherNationality: initialData.personalDetails?.otherNationality || null,
    religion: initialData.personalDetails?.religion || null,
    category: initialData.personalDetails?.category || null,
    motherTongue: initialData.personalDetails?.motherTongue || null,
    mailingAddress: initialData.personalDetails?.mailingAddress || null,
    residentialAddress: initialData.personalDetails?.residentialAddress || null,
    dateOfBirth: initialData.personalDetails?.dateOfBirth || null,
    gender: initialData.personalDetails?.gender || null,
    email: initialData.personalDetails?.email || null,
    alternativeEmail: initialData.personalDetails?.alternativeEmail || null,
    disability: initialData.personalDetails?.disability || "OTHER",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sameAsMailing, setSameAsMailing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        student: studentData as Student,
        personalDetails: personalDetails as PersonalDetails,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAddress = (data: Partial<Address>): Address => ({
    addressLine: data.addressLine || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    landmark: data.landmark || null,
    localityType: data.localityType || null,
    phone: data.phone || null,
    pincode: data.pincode || null,
  });

  const createNationality = (name: string): Nationality => ({
    name,
    code: null,
    sequence: null,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createReligion = (name: string): Religion => ({
    name,
    sequence: null,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createCategory = (name: string): Category => ({
    name,
    code: null,
    documentRequired: false,
    sequence: null,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createLanguageMedium = (name: string): LanguageMedium => ({
    name,
    sequence: null,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (
    <div className="space-y-8 bg-white rounded-xl shadow-sm p-8">
      {/* Student Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Student Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Name *
            </Label>
            <div className="relative">
              <Input
                id="name"
                value={studentData.name || ""}
                onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                placeholder="Enter student name"
                required
                className="pl-10"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Community */}
          <div className="space-y-2">
            <Label htmlFor="community" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Community
            </Label>
            <div className="relative">
              <Select
                value={studentData.community || undefined}
                onValueChange={(value) => setStudentData({ ...studentData, community: value as Community })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUJARATI">Gujarati</SelectItem>
                  <SelectItem value="NON-GUJARATI">Non-Gujarati</SelectItem>
                </SelectContent>
              </Select>
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="level" className="flex items-center gap-2 text-gray-700">
              <School className="w-4 h-4" />
              Level
            </Label>
            <div className="relative">
              <Select
                value={studentData.level || undefined}
                onValueChange={(value) => setStudentData({ ...studentData, level: value as Level })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNDER_GRADUATE">Undergraduate</SelectItem>
                  <SelectItem value="POST_GRADUATE">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Framework */}
          <div className="space-y-2">
            <Label htmlFor="framework" className="flex items-center gap-2 text-gray-700">
              <Book className="w-4 h-4" />
              Framework
            </Label>
            <div className="relative">
              <Select
                value={studentData.framework || undefined}
                onValueChange={(value) => setStudentData({ ...studentData, framework: value as Framework })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CCF">CCF</SelectItem>
                  <SelectItem value="CBCS">CBCS</SelectItem>
                </SelectContent>
              </Select>
              <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Shift */}
          <div className="space-y-2">
            <Label htmlFor="shift" className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              Shift
            </Label>
            <div className="relative">
              <Select
                value={studentData.shift || undefined}
                onValueChange={(value) => setStudentData({ ...studentData, shift: value as Shift })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                </SelectContent>
              </Select>
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Last Passed Year */}
          <div className="space-y-2">
            <Label htmlFor="lastPassedYear" className="flex items-center gap-2 text-gray-700">
              <School className="w-4 h-4" />
              Last Passed Year
            </Label>
            <div className="relative">
              <Input
                id="lastPassedYear"
                type="number"
                value={studentData.lastPassedYear || ""}
                onChange={(e) => setStudentData({ ...studentData, lastPassedYear: parseInt(e.target.value) })}
                placeholder="Enter last passed year"
                className="pl-10"
              />
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-gray-700">
              <Book className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={studentData.notes || ""}
              onChange={(e) => setStudentData({ ...studentData, notes: e.target.value })}
              placeholder="Enter any additional notes"
              className="min-h-[100px]"
            />
          </div>

          {/* Handicapped */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="handicapped"
                checked={studentData.handicapped}
                onCheckedChange={(checked) => setStudentData({ ...studentData, handicapped: checked as boolean })}
              />
              <Label htmlFor="handicapped" className="text-gray-700">
                Handicapped
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aadhaar Card Number */}
          <div className="space-y-2">
            <Label htmlFor="aadhaarCardNumber" className="flex items-center gap-2 text-gray-700">
              <Fingerprint className="w-4 h-4" />
              Aadhaar Card Number
            </Label>
            <div className="relative">
              <Input
                id="aadhaarCardNumber"
                value={personalDetails.aadhaarCardNumber || ""}
                onChange={(e) => setPersonalDetails({ ...personalDetails, aadhaarCardNumber: e.target.value })}
                placeholder="Enter Aadhaar card number"
                className="pl-10"
              />
              <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <div className="relative">
              <DatePicker
                value={personalDetails.dateOfBirth || undefined}
                onSelect={(date) => setPersonalDetails({ ...personalDetails, dateOfBirth: date || null })}
                className="w-full pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Gender
            </Label>
            <div className="relative">
              <Select
                value={personalDetails.gender || undefined}
                onValueChange={(value) => setPersonalDetails({ ...personalDetails, gender: value as Gender })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="TRANSGENDER">Transgender</SelectItem>
                </SelectContent>
              </Select>
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label htmlFor="nationality" className="flex items-center gap-2 text-gray-700">
              <Globe className="w-4 h-4" />
              Nationality
            </Label>
            <div className="relative">
              <Input
                id="nationality"
                value={personalDetails.nationality?.name || ""}
                onChange={(e) => setPersonalDetails({ 
                  ...personalDetails, 
                  nationality: e.target.value ? createNationality(e.target.value) : null 
                })}
                placeholder="Enter nationality"
                className="pl-10"
              />
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Religion */}
          <div className="space-y-2">
            <Label htmlFor="religion" className="flex items-center gap-2 text-gray-700">
              <Cross className="w-4 h-4" />
              Religion
            </Label>
            <div className="relative">
              <Input
                id="religion"
                value={personalDetails.religion?.name || ""}
                onChange={(e) => setPersonalDetails({ 
                  ...personalDetails, 
                  religion: e.target.value ? createReligion(e.target.value) : null 
                })}
                placeholder="Enter religion"
                className="pl-10"
              />
              <Cross className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Category
            </Label>
            <div className="relative">
              <Input
                id="category"
                value={personalDetails.category?.name || ""}
                onChange={(e) => setPersonalDetails({ 
                  ...personalDetails, 
                  category: e.target.value ? createCategory(e.target.value) : null 
                })}
                placeholder="Enter category"
                className="pl-10"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Mother Tongue */}
          <div className="space-y-2">
            <Label htmlFor="motherTongue" className="flex items-center gap-2 text-gray-700">
              <Languages className="w-4 h-4" />
              Mother Tongue
            </Label>
            <div className="relative">
              <Input
                id="motherTongue"
                value={personalDetails.motherTongue?.name || ""}
                onChange={(e) => setPersonalDetails({ 
                  ...personalDetails, 
                  motherTongue: e.target.value ? createLanguageMedium(e.target.value) : null 
                })}
                placeholder="Enter mother tongue"
                className="pl-10"
              />
              <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={personalDetails.email || ""}
                onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                placeholder="Enter email"
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Alternative Email */}
          <div className="space-y-2">
            <Label htmlFor="alternativeEmail" className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4" />
              Alternative Email
            </Label>
            <div className="relative">
              <Input
                id="alternativeEmail"
                type="email"
                value={personalDetails.alternativeEmail || ""}
                onChange={(e) => setPersonalDetails({ ...personalDetails, alternativeEmail: e.target.value })}
                placeholder="Enter alternative email"
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Disability */}
          <div className="space-y-2">
            <Label htmlFor="disability" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Disability
            </Label>
            <div className="relative">
              <Select
                value={personalDetails.disability}
                onValueChange={(value: Disability) => setPersonalDetails({ ...personalDetails, disability: value })}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select disability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VISUAL">Visual</SelectItem>
                  <SelectItem value="HEARING_IMPAIRMENT">Hearing Impairment</SelectItem>
                  <SelectItem value="VISUAL_IMPAIRMENT">Visual Impairment</SelectItem>
                  <SelectItem value="ORTHOPEDIC">Orthopedic</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
          </div>

          {/* Mailing Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mailingAddress" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                Mailing Address
              </Label>
              <div className="relative">
                <Input
                  id="mailingAddress"
                  value={personalDetails.mailingAddress?.addressLine || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    mailingAddress: createAddress({ 
                      ...personalDetails.mailingAddress, 
                      addressLine: e.target.value 
                    }) 
                  })}
                  placeholder="Enter mailing address"
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailingCity" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                Mailing City
              </Label>
              <div className="relative">
                <Input
                  id="mailingCity"
                  value={personalDetails.mailingAddress?.city || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    mailingAddress: createAddress({ 
                      ...personalDetails.mailingAddress, 
                      city: e.target.value 
                    }) 
                  })}
                  placeholder="Enter mailing city"
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailingState" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                Mailing State
              </Label>
              <div className="relative">
                <Input
                  id="mailingState"
                  value={personalDetails.mailingAddress?.state || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    mailingAddress: createAddress({ 
                      ...personalDetails.mailingAddress, 
                      state: e.target.value 
                    }) 
                  })}
                  placeholder="Enter mailing state"
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailingPincode" className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                Mailing Pincode
              </Label>
              <div className="relative">
                <Input
                  id="mailingPincode"
                  value={personalDetails.mailingAddress?.pincode || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    mailingAddress: createAddress({ 
                      ...personalDetails.mailingAddress, 
                      pincode: e.target.value 
                    }) 
                  })}
                  placeholder="Enter mailing pincode"
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Same as Mailing Address Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsMailing"
              checked={sameAsMailing}
              onCheckedChange={(checked) => {
                setSameAsMailing(checked as boolean);
                if (checked && personalDetails.mailingAddress) {
                  setPersonalDetails({
                    ...personalDetails,
                    residentialAddress: personalDetails.mailingAddress,
                  });
                }
              }}
            />
            <Label htmlFor="sameAsMailing" className="text-gray-700">
              Residential address is same as mailing address
            </Label>
          </div>

          {/* Residential Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="residentialAddress" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Residential Address
              </Label>
              <div className="relative">
                <Input
                  id="residentialAddress"
                  value={personalDetails.residentialAddress?.addressLine || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    residentialAddress: createAddress({ 
                      ...personalDetails.residentialAddress, 
                      addressLine: e.target.value 
                    }) 
                  })}
                  placeholder="Enter residential address"
                  className="pl-10"
                  disabled={sameAsMailing}
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialCity" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Residential City
              </Label>
              <div className="relative">
                <Input
                  id="residentialCity"
                  value={personalDetails.residentialAddress?.city || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    residentialAddress: createAddress({ 
                      ...personalDetails.residentialAddress, 
                      city: e.target.value 
                    }) 
                  })}
                  placeholder="Enter residential city"
                  className="pl-10"
                  disabled={sameAsMailing}
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialState" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Residential State
              </Label>
              <div className="relative">
                <Input
                  id="residentialState"
                  value={personalDetails.residentialAddress?.state || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    residentialAddress: createAddress({ 
                      ...personalDetails.residentialAddress, 
                      state: e.target.value 
                    }) 
                  })}
                  placeholder="Enter residential state"
                  className="pl-10"
                  disabled={sameAsMailing}
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialPincode" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Residential Pincode
              </Label>
              <div className="relative">
                <Input
                  id="residentialPincode"
                  value={personalDetails.residentialAddress?.pincode || ""}
                  onChange={(e) => setPersonalDetails({ 
                    ...personalDetails, 
                    residentialAddress: createAddress({ 
                      ...personalDetails.residentialAddress, 
                      pincode: e.target.value 
                    }) 
                  })}
                  placeholder="Enter residential pincode"
                  className="pl-10"
                  disabled={sameAsMailing}
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSubmit}
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
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