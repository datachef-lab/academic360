import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GradeCardData, Course, StudentInfo, CourseComponent } from "../../types/gradeCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Toaster, toast } from "sonner";
import { generateId } from "../../utils/gradeUtils";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import CourseRow from "./CourseRow";
import { findMarksheetsByStudentId } from "@/services/marksheet-apis";
import Header from "../marksheet/ccf/Header";
import { useMarksheetFilterStore } from "../globals/useMarksheetFilterStore";
import { Subject } from "@/types/academics/subject";

interface GradeCardProps {
  initialData?: GradeCardData;
}

const GradeCard = ({ initialData }: GradeCardProps) => {
  const location = useLocation();
  const studentId = Number(location.pathname.split("/").pop());
  const { semester ,setCategory} = useMarksheetFilterStore();
  const [remarks,setRemarks]=useState<string>('');
  const [sgpa,setSgpa]=useState< number | null>();
  const [data, setData] = useState<GradeCardData | null>(initialData || null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(initialData?.studentInfo || null);

  const { data: marksheetData, isLoading } = useQuery({
    queryKey: ["marksheet", studentId, semester],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await findMarksheetsByStudentId(Number(studentId), Number(semester));
      return response.payload;
    },
    enabled: !!studentId,
    staleTime:10000,
  });

  useEffect(() => {
    if (marksheetData && Array.isArray(marksheetData) && marksheetData.length > 0) {
      const mks = marksheetData[0];
      // Get the category from the first subject's subjectMetadata
      const category = mks.subjects && mks.subjects.length > 0 ? mks.subjects[0]?.subjectMetadata?.category : null;
      if (category) setCategory(category);
  const remarks = mks.remarks;
  setRemarks(remarks);
  setSgpa(mks.sgpa);
  console.log("*******",remarks);
      const transformedData: GradeCardData = {
        universityName: "Your University Name", // Replace with actual university name
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
      setData(transformedData);
      setStudentInfo(transformedData.studentInfo);
    }
  }, [marksheetData, setCategory]);

  const handleStudentInfoChange = (field: keyof StudentInfo, value: string) => {
    if (!studentInfo) return;
    setStudentInfo({
      ...studentInfo,
      [field]: value
    });
  };

  const handleCourseUpdate = (updatedCourse: Course) => {
    if (!data) return;
    const updatedCourses = data.courses.map((course: Course) => {
      if (course.id === updatedCourse.id) {
        return updatedCourse;
      }
      return course;
    });
    
    setData({
      ...data,
      courses: updatedCourses
    });
  };

  const handleAddCourse = () => {
    if (!data) return;
    const newCourseId = generateId();
    const newComponentId = generateId();
    
    const newCourse: Course = {
      id: newCourseId,
      courseCode: "NEW",
      courseType: "Course",
      courseName: "New Course",
      year: new Date().getFullYear().toString(),
      components: [
        {
          id: newComponentId,
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
    
    setData({
      ...data,
      courses: [...data.courses, newCourse]
    });
    
    toast.success("New course added successfully");
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!data) return;
    setData({
      ...data,
      courses: data.courses.filter((course: Course) => course.id !== courseId)
    });
    
    toast.success("Course deleted successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading grade card...</div>
      </div>
    );
  }

  // Calculate grand totals
  const grandFullMarks = data.courses.reduce(
    (sum: number, course: Course) => sum + course.components.reduce((s: number, comp: CourseComponent) => s + comp.fullMarks, 0), 0
  );
  
  const grandMarksObtained = data.courses.reduce(
    (sum: number, course: Course) => sum + course.components.reduce((s: number, comp: CourseComponent) => s + comp.marksObtained, 0), 0
  );
  
  const grandCredits = data.courses.reduce(
    (sum: number, course: Course) => sum + course.components.reduce((s: number, comp: CourseComponent) => s + comp.credit, 0), 0
  );
  
  // const grandCreditPoints = data.courses.reduce(
  //   (sum: number, course: Course) => sum + course.components.reduce((s: number, comp: CourseComponent) => s + calculateCreditPoints(comp.marksObtained, comp.credit), 0
  //   ), 0
  // );

  // // // Calculate SGPA
  // const sgpa: number = 0;
  //   ? Math.round((grandCreditPoints / grandCredits) * 1000) / 1000 
  //   : 0;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 print:bg-white print:p-0">
      <Toaster />
      <div className="mx-auto max-w-7xl bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="px-4 py-5 sm:p-6">
          {/* Header */}
          {/* <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">
              {data.universityName}
            </h1>
            <h2 className="text-xl font-semibold mt-1">Grade Card</h2>
            <p className="text-gray-600">
              {studentInfo?.semester} {studentInfo?.examination}
            </p>
          </div> */}
          <Header></Header>
          
          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <span className="font-semibold mr-2">Name:</span>
              <input
                type="text"
                value={studentInfo?.name || ""}
                onChange={(e) => handleStudentInfoChange("name", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 flex-1"
              />
            </div>
            <div className="flex items-center justify-center">
              <span className="font-semibold mr-2">Registration No.:</span>
              <input
                type="text"
                value={studentInfo?.registrationNo || ""}
                onChange={(e) => handleStudentInfoChange("registrationNo", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 w-44"
              />
            </div>
            <div className="flex items-center justify-end">
              <span className="font-semibold mr-2">Roll No.:</span>
              <input
                type="text"
                value={studentInfo?.rollNo || ""}
                onChange={(e) => handleStudentInfoChange("rollNo", e.target.value)}
                className="border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1 w-40"
              />
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto border rounded-md mb-4">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-gray-200 hover:bg-gray-200">
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap">Course Code (Course Type)</TableHead>
                  <TableHead className="font-bold text-black border-r text-center">Course Name</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Year</TableHead>
                  <TableHead className="font-bold text-black border-r text-center">Course Component</TableHead>
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap w-24">Full Marks</TableHead>
                  <TableHead className="font-bold text-black border-r text-center  w-32">Marks Obtained</TableHead>
                  <TableHead className="font-bold text-black border-r text-center whitespace-nowrap w-24">Credit</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Grade</TableHead>
                  <TableHead className="font-bold text-black border-r text-center w-20">Status</TableHead>
                  <TableHead className="w-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((course: Course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onCourseUpdate={handleCourseUpdate}
                    onCourseDelete={handleDeleteCourse}
                  />
                ))}
                
                {/* Grand Total Row */}
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
          
          {/* SGPA */}
          <div className="mt-6 border-t pt-4">
            <div className="text-center font-semibold text-lg">
              Semester Grade Point Average (SGPA): {sgpa !== null && sgpa !== undefined ? sgpa : "awaited"}
            </div>
            
            <div className="mt-6">
              <div className="font-semibold">
                Remarks: {remarks}
              </div>
            </div>
          </div>
          
          {/* Abbreviations */}
          <div className="mt-4 border p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Abbreviations</h3>
            <div className="text-sm">
              <p>P: Passed in the Course, F: Failed in the Course</p>
              <p>F(TH): Failed in Theoretical, F(PR): Failed in Practical, F(TU): Failed in Tutorial</p>
              <p>AB: Absent, +1: Grace Mark, EC: Examination Cancelled</p>
              <p>ECDB1: Debarment for 1 year, ECDB2: Debarment for 2 year</p>
              <p>N.A.: Not Applicable</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex justify-between no-print">
            <div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleAddCourse}
              >
                <Plus size={16} />
                Add Course
              </Button>
            </div>
            <div>
              <Button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
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
