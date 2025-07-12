import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  CreditCard, 
  Hash, 
  User, 
  BookOpen, 
  FileText, 
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import { Course } from "@/types/academics/course";
import { Framework, Shift } from "@/types/enums";
import { getAllCourses } from "@/services/course-api";
import { ApiResonse } from "@/types/api-response";
import { getAcademicIdentifierByStudentId, createAcademicIdentifier, updateAcademicIdentifier } from "@/services/academic-identifiers.service";
import { toast } from "sonner";

interface AcademicIdentifierFormProps {
  onSubmit: (data: AcademicIdentifier) => void;
  initialData?: Partial<AcademicIdentifier>;
  studentId: number;
}

export default function AcademicIdentifierForm({  
  initialData = {}, 
  studentId 
}: AcademicIdentifierFormProps) {
  const [formData, setFormData] = useState<Partial<AcademicIdentifier>>({
    studentId,
    framework: null,
    rfid: null,
    course: null,
    cuFormNumber: null,
    uid: null,
    oldUid: null,
    registrationNumber: null,
    rollNumber: null,
    section: null,
    classRollNumber: null,
    apaarId: null,
    abcId: null,
    apprid: null,
    checkRepeat: false,
    shift: null,
    ...initialData
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch courses and academic identifier on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesResponse: ApiResonse<Course[]> = await getAllCourses();
        const coursesList = coursesResponse.payload || [];
        setCourses(coursesList);

        // Fetch academic identifier by studentId
        const identifier = await getAcademicIdentifierByStudentId(studentId);
        if (identifier) {
          setFormData(identifier);
        }
      } catch {
        // Optionally handle 404 (no record) gracefully
        // Form will remain empty for new records
      }
    };
    fetchData();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { ...rest } = formData;
      if (formData.id) {
        await updateAcademicIdentifier(formData.id, rest);
        toast.success("Academic Identifier updated!");
      } else {
        await createAcademicIdentifier(rest);
        toast.success("Academic Identifier created!");
      }
      // Refetch and update form state
      const latest = await getAcademicIdentifierByStudentId(studentId);
      if (latest) setFormData(latest);
    } catch {
      toast.error("Failed to save Academic Identifier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const frameworkOptions: { value: Framework; label: string }[] = [
    { value: "CCF", label: "CCF" },
    { value: "CBCS", label: "CBCS" }
  ];

  const shiftOptions: { value: Shift; label: string }[] = [
    { value: "MORNING", label: "Morning" },
    { value: "AFTERNOON", label: "Afternoon" },
    { value: "EVENING", label: "Evening" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <GraduationCap className="w-5 h-5" />
            Academic Identifier Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Framework and Course Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="framework" className="flex items-center gap-2 text-gray-700">
                  <BookOpen className="w-4 h-4" />
                  Framework Type
                </Label>
                <Select
                  value={formData.framework || ""}
                  onValueChange={(value: string) => 
                    setFormData({ ...formData, framework: value as Framework })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework type" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworkOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value || ""}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course" className="flex items-center gap-2 text-gray-700">
                  <GraduationCap className="w-4 h-4" />
                  Course
                </Label>
                <Select
                  value={formData.course?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedCourse = courses.find(course => course.id?.toString() === value);
                    setFormData({ ...formData, course: selectedCourse || null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id?.toString() || ""}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shift Section */}
            <div className="space-y-2">
              <Label htmlFor="shift" className="flex items-center gap-2 text-gray-700">
                <BookOpen className="w-4 h-4" />
                Shift
              </Label>
              <Select
                value={formData.shift || ""}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, shift: value as Shift })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* RFID and UID Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rfid" className="flex items-center gap-2 text-gray-700">
                  <CreditCard className="w-4 h-4" />
                  RFID Number
                </Label>
                <div className="relative">
                  <Input
                    id="rfid"
                    value={formData.rfid || ""}
                    onChange={(e) => setFormData({ ...formData, rfid: e.target.value || null })}
                    placeholder="Enter RFID number"
                    className="pl-10"
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uid" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" />
                  UID Number
                </Label>
                <div className="relative">
                  <Input
                    id="uid"
                    value={formData.uid || ""}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value || null })}
                    placeholder="Enter UID number"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Old UID and CU Form Number Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="oldUid" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" />
                  Old UID Number
                </Label>
                <div className="relative">
                  <Input
                    id="oldUid"
                    value={formData.oldUid || ""}
                    onChange={(e) => setFormData({ ...formData, oldUid: e.target.value || null })}
                    placeholder="Enter old UID number"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuFormNumber" className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  CU Form Number
                </Label>
                <div className="relative">
                  <Input
                    id="cuFormNumber"
                    value={formData.cuFormNumber || ""}
                    onChange={(e) => setFormData({ ...formData, cuFormNumber: e.target.value || null })}
                    placeholder="Enter CU form number"
                    className="pl-10"
                  />
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Registration and Roll Number Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  Registration Number
                </Label>
                <div className="relative">
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber || ""}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value || null })}
                    placeholder="Enter registration number"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" />
                  Roll Number
                </Label>
                <div className="relative">
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber || ""}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value || null })}
                    placeholder="Enter roll number"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Section and Class Roll Number Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="section" className="flex items-center gap-2 text-gray-700">
                  <BookOpen className="w-4 h-4" />
                  Section
                </Label>
                <div className="relative">
                  <Input
                    id="section"
                    value={formData.section || ""}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value || null })}
                    placeholder="Enter section (e.g., A, B, C)"
                    className="pl-10"
                  />
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    onChange={(e) => setFormData({ ...formData, classRollNumber: e.target.value || null })}
                    placeholder="Enter class roll number"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* APAAR, ABC, and APPR ID Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="apaarId" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" />
                  APAAR ID
                </Label>
                <div className="relative">
                  <Input
                    id="apaarId"
                    value={formData.apaarId || ""}
                    onChange={(e) => setFormData({ ...formData, apaarId: e.target.value || null })}
                    placeholder="Enter APAAR ID"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    onChange={(e) => setFormData({ ...formData, abcId: e.target.value || null })}
                    placeholder="Enter ABC ID"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    onChange={(e) => setFormData({ ...formData, apprid: e.target.value || null })}
                    placeholder="Enter APPR ID"
                    className="pl-10"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Check Repeat Section */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checkRepeat"
                  checked={formData.checkRepeat}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, checkRepeat: checked as boolean })
                  }
                />
                <Label htmlFor="checkRepeat" className="flex items-center gap-2 text-gray-700">
                  <RefreshCw className="w-4 h-4" />
                  Check Repeat
                </Label>
              </div>
              <p className="text-sm text-gray-500 ml-6">
                Check this if the student is repeating the course
              </p>
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
