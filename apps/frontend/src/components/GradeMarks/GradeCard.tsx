import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GradeCardData, Course, StudentInfo } from "../../types/gradeCard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { generateId } from "../../utils/gradeUtils";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CourseRow from "./CourseRow";
import { findMarksheetsByStudentId, updateMarksheetMarks } from "@/services/marksheet-apis";
import Header from "../marksheet/ccf/Header";
import { useMarksheetFilterStore } from "../globals/useMarksheetFilterStore";
import { Subject } from "@/types/academics/subject";
import { Marksheet } from "@/types/academics/marksheet";

interface GradeCardProps {
  initialData?: GradeCardData;

  marksheetId?: number;

  showActions?: boolean;
}

const GradeCard = ({ initialData, marksheetId,  showActions = false }: GradeCardProps) => {
  const navigate = useNavigate();
  const { studentId} = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const semester = searchParams.get("semester") ? Number(searchParams.get("semester")) : undefined;

  const { setCategory } = useMarksheetFilterStore();
  const [remarks, setRemarks] = useState<string>('');
  const [sgpa, setSgpa] = useState<number | null>();
  const [data, setData] = useState<GradeCardData | null>(initialData || null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(initialData?.studentInfo || null);

  const transformCourseToSubject = useCallback((course: Course) => {
    const theoretical = course.components.find(c => c.componentType === "Theoretical");
    const practical = course.components.find(c => c.componentType === "Practical");

    return {
      id: course.id,
      theoryMarks: theoretical?.marksObtained?.toString() || "0",
      practicalMarks: practical?.marksObtained?.toString() || "0",
      subjectMetadata: {
        id: course.id,
        fullMarks: theoretical?.fullMarks || 0,
        fullMarksPractical: practical?.fullMarks || 0,
        credit: theoretical?.credit || 0,
        practicalCredit: practical?.credit || 0,
        marksheetCode: course.courseCode,
        name: course.courseName,
        subjectType: {
          name: course.courseType
        }
      }
    };
  }, []);

  const handleUpdateMarks = () => {
    if (data && marksheetData?.id) {
      updateMarksMutation.mutate(data);
    }
  };

  const updateMarksMutation = useMutation({
    mutationFn: async (updatedData: GradeCardData) => {
      if (!marksheetData?.id) throw new Error("Marksheet ID is required");

      const updatedMarksheet = {
        ...marksheetData,
        subjects: updatedData.courses.map(transformCourseToSubject)
      };

      return updateMarksheetMarks(marksheetData.id, updatedMarksheet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marksheet", studentId, semester, marksheetId] });
      toast.success("Marks updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update marks");
      console.error("Error updating marks:", error);
    }
  });

  const { data: marksheetData, isLoading } = useQuery({
    queryKey: ["marksheet", studentId, semester, marksheetId],
    queryFn: async () => {
      if (!studentId || !semester) return null;
      const response = await findMarksheetsByStudentId(Number(studentId), Number(semester));
      if (marksheetId && Array.isArray(response.payload)) {
        const foundMarksheet = response.payload.find((m: Marksheet) => m.id === Number(marksheetId));
        return foundMarksheet || null;
      }
      return Array.isArray(response.payload) ? response.payload[0] : response.payload;
    },
    enabled: !!studentId && !!semester,
    staleTime: 10000,
  });

  const transformMarksheetData = useCallback((mks: Marksheet) => {
    const category = mks.subjects?.[0]?.subjectMetadata?.category;
    if (category) setCategory(category);
    setRemarks(mks.remarks || '');
    setSgpa(mks.sgpa);

    return {
      universityName: "Your University Name",
      studentInfo: {
        name: mks.name || "",
        registrationNo: mks.academicIdentifier?.registrationNumber || "",
        rollNo: mks.academicIdentifier?.rollNumber || "",
        semester: mks.semester?.toString() || "",
        examination: mks.year?.toString() || ""
      },
      courses: (mks.subjects || []).map((subject: Subject): Course => ({
        id: subject.id?.toString() || generateId(),
        courseCode: subject.subjectMetadata?.marksheetCode || "",
        courseType: subject.subjectMetadata?.subjectType?.name || "course",
        courseName: subject.subjectMetadata?.name || "",
        year: mks.year,
        components: [
          {
            id: generateId(),
            courseId: subject.id?.toString() || "",
            componentType: "Theoretical",
            fullMarks: subject.subjectMetadata?.fullMarks || 0,
            marksObtained: Number(subject.theoryMarks || 0),
            credit: subject.subjectMetadata?.credit || 0
          },
          {
            id: generateId(),
            courseId: subject.id?.toString() || "",
            componentType: "Practical",
            fullMarks: subject.subjectMetadata?.fullMarksPractical || 0,
            marksObtained: Number(subject.practicalMarks || 0),
            credit: subject.subjectMetadata?.practicalCredit || 0
          }
        ]
      }))
    };
  }, [setCategory]);

  useEffect(() => {
    if (marksheetData) {
      const transformedData = transformMarksheetData(marksheetData);
      setData(transformedData);
      setStudentInfo(transformedData.studentInfo);
    }
  }, [marksheetData, transformMarksheetData]);

  const handleStudentInfoChange = useCallback((field: keyof StudentInfo, value: string) => {
    if (!studentInfo) return;
    setStudentInfo(prev => ({
      ...prev!,
      [field]: value
    }));
  }, [studentInfo]);

  const handleCourseUpdate = useCallback((updatedCourse: Course) => {
    if (!data || !marksheetData?.id) return;
    setData(prev => ({
      ...prev!,
      courses: prev!.courses.map(course => 
        course.id === updatedCourse.id ? updatedCourse : course
      )
    }));
  }, [data, marksheetData?.id]);

  const handleAddCourse = useCallback(() => {
    if (!data) return;
    const newCourseId = generateId();
    const newCourse: Course = {
      id: newCourseId,
      courseCode: "NEW",
      courseType: "Course",
      courseName: "New Course",
      year: new Date().getFullYear().toString(),
      components: [
        {
          id: generateId(),
          courseId: newCourseId,
          componentType: "Theoretical",
          fullMarks: 0,
          marksObtained: 0,
          credit: 0
        },
        {
          id: generateId(),
          courseId: newCourseId,
          componentType: "Practical",
          fullMarks: 0,
          marksObtained: 0,
          credit: 0
        }
      ]
    };
    setData(prev => ({
      ...prev!,
      courses: [...prev!.courses, newCourse]
    }));
    toast.success("New course added successfully");
  }, [data]);

  const handleDeleteCourse = useCallback((courseId: string) => {
    if (!data) return;
    setData(prev => ({
      ...prev!,
      courses: prev!.courses.filter(course => course.id !== courseId)
    }));
    toast.success("Course deleted successfully");
  }, [data]);

  const handleBack = useCallback(() => {
    navigate(`/home/search-students/${studentId}`, { 
      state: { 
        activeTab: {
          label: "Marksheet",
          endpoint: "/marksheet"
        }
      } 
    });
  }, [navigate, studentId]);

  const { grandFullMarks, grandMarksObtained, grandCredits } = useMemo(() => {
    if (!data) return { grandFullMarks: 0, grandMarksObtained: 0, grandCredits: 0 };
    
    return {
      grandFullMarks: data.courses.reduce(
        (sum, course) => sum + course.components.reduce((s, comp) => s + comp.fullMarks, 0), 0
      ),
      grandMarksObtained: data.courses.reduce(
        (sum, course) => sum + course.components.reduce((s, comp) => s + comp.marksObtained, 0), 0
      ),
      grandCredits: data.courses.reduce(
        (sum, course) => sum + course.components.reduce((s, comp) => s + comp.credit, 0), 0
      )
    };
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading grade card...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-6 print:bg-white print:p-0 ">
      <div className="mb-4 no-print">
        <motion.div
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex drop-shadow-md items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full bg-white border border-purple-300 hover:bg-transparent "
          >
            <motion.div
              animate={{ x: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeft className="w-7 h-7 text-purple-700 font-extrabold" />
            </motion.div>
            <span className="font-medium text-purple-700">Back</span>
          </Button>
        </motion.div>
      </div>
      <div className="mx-auto w-full max-w-auto bg-white border border-gray-300/80 drop-shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 p-2 sm:p-6">
          <div className="mb-4">
            <Header selectedSemester={semester} hideSemesterDropdown={!!semester} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 ">
            <div className="flex sm:flex-row items-start sm:items-center">
              <span className="font-semibold mr-0 sm:mr-2 mb-1 sm:mb-0">Name :</span>
              <input
                type="text"
                value={studentInfo?.name || ""}
                onChange={(e) => handleStudentInfoChange("name", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 flex-1 w-full sm:w-44"
              />
            </div>
            <div className="flex  sm:flex-row items-start sm:items-center justify-center">
              <span className="font-semibold mr-0 sm:mr-2 mb-1 sm:mb-0">Registration No. :</span>
              <input
                type="text"
                value={studentInfo?.registrationNo || ""}
                onChange={(e) => handleStudentInfoChange("registrationNo", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 w-full sm:w-44"
              />
            </div>
            <div className="flex  sm:flex-row items-start sm:items-center justify-end">
              <span className="font-semibold mr-0 sm:mr-2 mb-1 sm:mb-0">Roll No. :</span>
              <input
                type="text"
                value={studentInfo?.rollNo || ""}
                onChange={(e) => handleStudentInfoChange("rollNo", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 w-full sm:w-40"
              />
            </div>
          </div>
          <div className="overflow-x-auto border rounded-md ">
            <Table className=" text-sm">
              <TableHeader>
                <TableRow className="bg-gray-200 hover:bg-gray-200">
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap">Course Code (Course Type)</TableHead>
                  <TableHead className="font-bold text-black border-r text-center">Course Name</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Year</TableHead>
                  <TableHead className="font-bold text-black border-r text-center">Course Component</TableHead>
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap w-24">Full Marks</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-32">Marks Obtained</TableHead>
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap w-24">Credit</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Grade</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Status</TableHead>
                  {showActions && <TableHead className="w-12 text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((course: Course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onCourseUpdate={handleCourseUpdate}
                    onCourseDelete={handleDeleteCourse}
                    showActions={showActions}
                  />
                ))}
                <TableRow className="bg-blue-100 border-t-2 border-b-2 border-blue-300 font-bold">
                  <TableCell colSpan={4} className="text-center border-r">Grand Total</TableCell>
                  <TableCell className="text-start border-r">{grandFullMarks}</TableCell>
                  <TableCell className="text-start border-r">{grandMarksObtained}</TableCell>
                  <TableCell className="text-start border-r">{grandCredits}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 border-t pt-4">
            <div className="text-center font-semibold text-lg">
              Semester Grade Point Average (SGPA): {sgpa !== null && sgpa !== undefined ? sgpa : "awaited"}
            </div>
            <div className="font-semibold">
              Remarks: {remarks}
            </div>
          </div>
          <div className="mt-2 border p-2 sm:p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Abbreviations</h3>
            <div className="grid grid-cols-1 gap-1 sm:gap-2 text-sm">
              <p>P: Passed in the Course, F: Failed in the Course</p>
              <p>F(TH): Failed in Theoretical, F(PR): Failed in Practical, F(TU): Failed in Tutorial</p>
              <p>AB: Absent, +1: Grace Mark, EC: Examination Cancelled</p>
              <p>ECDB1: Debarment for 1 year, ECDB2: Debarment for 2 year</p>
              <p>N.A.: Not Applicable</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 no-print">
            {showActions && (
              <div>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0"
                  onClick={handleAddCourse}
                >
                  <Plus size={16} />
                  Add Course
                </Button>
              </div>
            )}
            {/* dialog box for confirming the update  */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    disabled={!data || !marksheetData?.id}
                  >
                    <Save size={16} />
                    Update
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Update</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to update the marks? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleUpdateMarks}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Confirm Update
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;
