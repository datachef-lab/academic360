import { useState } from "react";
import StudentContent from "@/components/student/StudentContent";
import StudentPanel from "@/components/student/StudentPanel";
import { Badge } from "@/components/ui/badge";
import { User, Book, Home, Bus, Heart, Phone, GraduationCap, IdCard, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStudentById } from "@/services/student";
import { StudentStatus } from "@/types/enums";
import { useDispatch, useSelector } from "react-redux";
import { selectStudent, setStudent } from "@/app/slices/studentSlice";

const studentTabs = [
  { label: "Overview", icon: <User size={16} />, endpoint: "/overview" },
  { label: "Personal Details", icon: <IdCard size={16} />, endpoint: "/personal-details" },
  { label: "Parent Details", icon: <Users size={16} />, endpoint: "/parent-details" },
  { label: "Guardian Details", icon: <Users size={16} />, endpoint: "/guardian" },
  { label: "Health Details", icon: <Heart size={16} />, endpoint: "/health" },
  { label: "Emergency Contact", icon: <Phone size={16} />, endpoint: "/emergency-contact" },
  { label: "Academic History", icon: <Book size={16} />, endpoint: "/academic-history" },
  { label: "Academic Identifiers", icon: <GraduationCap size={16} />, endpoint: "/academic-identifier" },
  { label: "Accommodation", icon: <Home size={16} />, endpoint: "/accommodation" },
  { label: "Transport Details", icon: <Bus size={16} />, endpoint: "transport-details" },
];

export default function StudentPage() {
  const { studentId } = useParams();

  const dispatch = useDispatch();

  const student = useSelector(selectStudent);

  const [activeTab, setActiveTab] = useState(studentTabs[0]);

  let status: StudentStatus | null = null;

  useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      if (!studentId) {
        return;
      }

      const response = await getStudentById(Number(studentId));
      dispatch(setStudent(response.payload));

      if (response.payload.leavingDate || (!response.payload.active && response.payload.alumni)) {
        status = "GRADUATED";
      } else if (response.payload.active == null || response.payload.alumni == null) {
        status = null;
      } else if (!response.payload.active && !response.payload.alumni) {
        status = "DROPPED_OUT";
      } else if (response.payload.active && !response.payload.alumni) {
        status = "ACTIVE";
      } else if (response.payload.active && response.payload.alumni) {
        status = "PENDING_CLEARANCE";
      }
    },
  });

  return (
    <div className="w-full h-full flex gap-5">
      {/* Left Content */}
      <div className="w-[80%] h-full">
        {/* Student Details Header */}
        <div className="border-b pb-2 space-y-2">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            <p>{student?.name}</p>
          </h2>
          <div className="space-x-2 flex flex-wrap">
            {student?.personalDetails?.nationality && (
              <Badge variant="outline" className="flex items-center gap-1">
                {student?.personalDetails?.nationality?.name}
              </Badge>
            )}
            {status && <Badge className="bg-green-700 flex items-center gap-1">{status}</Badge>}
            {student?.academicIdentifier?.stream && (
              <Badge className="bg-blue-500 flex items-center gap-1">{student?.academicIdentifier?.stream.name}</Badge>
            )}
            {student?.community && <Badge className="bg-red-500 flex items-center gap-1">{student.community}</Badge>}
            {student?.framework && <Badge className="bg-violet-500 flex items-center gap-1">{student.framework}</Badge>}
            {student?.personalDetails?.category && (
              <Badge className="bg-gray-500 flex items-center gap-1">{student?.personalDetails?.category.name}</Badge>
            )}
          </div>
        </div>
        {/* Student Content */}
        <StudentContent activeTab={activeTab} />
      </div>

      {/* Right Panel - Tabs */}
      <div className="w-[20%] h-full">
        <StudentPanel studentTabs={studentTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
