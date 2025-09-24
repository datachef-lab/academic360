import { User, Home, Heart, Phone, IdCard, Users, FilePenIcon, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { getStudentById, fetchStudentByUid } from "@/services/student";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentContent from "@/components/student/StudentContent";
import StudentPanel from "@/components/student/StudentPanel";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
// import { motion } from "framer-motion";
import { Tabs } from "@/components/ui/tabs";

const studentTabs = [
  { label: "Overview", icon: <User size={16} />, endpoint: "/overview" },
  { label: "Personal", icon: <IdCard size={16} />, endpoint: "/personal-details" },
  { label: "Family", icon: <Users size={16} />, endpoint: "/family-details" },
  { label: "Health", icon: <Heart size={16} />, endpoint: "/health" },
  { label: "Emergency", icon: <Phone size={16} />, endpoint: "/emergency-contact" },
  //   { label: "History", icon: <Book size={16} />, endpoint: "/academic-history" },
  //   { label: "Identifiers", icon: <GraduationCap size={16} />, endpoint: "/academic-identifier" },
  { label: "Accommodation", icon: <Home size={16} />, endpoint: "/accommodation" },
  { label: "Academic", icon: <BookOpen size={16} />, endpoint: "/academic-details" },
  { label: "Marksheet", icon: <FilePenIcon size={16} />, endpoint: "/marksheet" },
];

export default function StudentPage() {
  const { studentId: studentIdOrUid } = useParams();
  const location = useLocation();
  type StudentTab = (typeof studentTabs)[number];
  const [activeTab, setActiveTab] = useState<StudentTab>(() => {
    if (location.state?.activeTab) {
      const matchingTab = studentTabs.find((tab) => tab.label === location.state.activeTab.label);
      return matchingTab ?? studentTabs[0]!;
    }
    return studentTabs[0]!;
  });

  const { data } = useQuery({
    queryKey: ["student", studentIdOrUid],
    queryFn: async () => {
      if (!studentIdOrUid) return undefined;
      // If the param looks like a UID (typically long numeric string), fetch by UID first
      const isProbablyUid = String(studentIdOrUid).length >= 8;
      if (isProbablyUid) {
        const student = await fetchStudentByUid(String(studentIdOrUid));
        return student;
      }
      const student = await getStudentById(Number(studentIdOrUid));
      return student;
    },
  });

  return (
    <>
      {/* <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => document.getElementById('mobile-nav')?.classList.toggle('translate-x-full')}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
        >
          <Menu size={24} />
        </button>
      </div> */}

      <div className="w-full flex h-full  overflow-hidden">
        <Tabs defaultValue={activeTab?.label ?? ""} className="w-[80%]">
          <StudentPanel studentTabs={studentTabs} activeTab={activeTab!} setActiveTab={setActiveTab} />

          {/* Mobile Navigation Panel */}
          {/* <div
        id="mobile-nav"
        className="lg:hidden fixed inset-y-0 right-0 w-64 bg-white shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out z-40"
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700/90">
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-white rounded-xl">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Navigation</h3>
                <p className="text-sm text-gray-100">Quick access menu</p>
              </div>
            </div>
          </div>
          <StudentPanel studentTabs={studentTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div> */}

          <div className="lg:col-span-9 h-[calc(100vh-2rem)] px-2 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6 pb-6  drop-shadow-md">
              {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-gray-200 rounded-2xl overflow-hidden"
            >
              <div className="">
                <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-purple-800 h-24 sm:h-32 relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 8
                    }}
                  />

                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-wrap gap-2">
                    <Badge
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium drop-shadow-lg rounded-full ${data?.active
                        ? "bg-emerald-500/90 hover:bg-emerald-600 text-white backdrop-blur-sm"
                        : "bg-red-500/90 hover:bg-red-500 text-white backdrop-blur-sm"
                        }`}
                    >
                      {data?.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-white/20 drop-shadow-lg backdrop-blur-sm rounded-full text-white border-white/40 font-medium text-xs sm:text-sm"
                    >
                      UID: {data?.academicIdentifier?.uid}
                    </Badge>
                  </div>

                  <div className="absolute -bottom-9 sm:-bottom-14 left-4 sm:left-6">
                    <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-white shadow-xl">
                      <AvatarImage
                        className="object-cover"
                        src={`${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${data?.academicIdentifier?.uid}.jpg`}
                        alt={data?.name}
                      />
                      <AvatarFallback className="text-xl sm:text-2xl font-bold bg-purple-100 text-purple-600">
                        {data?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="pt-12 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-6 bg-white">
                  <div className="flex flex-wrap justify-between items-end mb-4">
                    <div>
                      <motion.h1
                        className="text-xl sm:text-2xl md:text-3xl font-bold ml-1 text-gray-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {data?.name}
                      </motion.h1>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-purple-100 drop-shadow-sm hover:bg-purple-200 text-purple-800 border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          {data?.academicIdentifier?.course?.degree?.name ?? ""}
                        </Badge>
                        <Badge className="bg-indigo-100 drop-shadow-sm hover:bg-indigo-200 text-indigo-800 border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          {data?.academicIdentifier?.frameworkType}
                        </Badge>
                        {data?.community && (
                          <Badge className="bg-pink-100 drop-shadow-sm hover:bg-pink-200 text-pink-800 border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                            {data.community}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                        <User size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">UID</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">{data?.academicIdentifier?.uid}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                        <IdCard size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Registration No.</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">{data?.academicIdentifier?.registrationNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                        <Calendar size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">D.O.B</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          {data?.personalDetails?.dateOfBirth
                            ? new Date(data.personalDetails.dateOfBirth).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div> */}

              <div className="bg-white/10 rounded-2xl">
                <StudentContent
                  activeTab={activeTab!}
                  studentId={Number(data?.id ?? 0)}
                  userId={Number(data?.userId ?? 0)}
                  personalEmail={data?.personalEmail ?? null}
                />
              </div>
            </div>
          </div>
        </Tabs>

        {/* Right Panel */}
        <div className="w-[20%] h-full flex flex-col items-center justify-start">
          <div className="w-full bg-gradient-to-br from-purple-600 to-violet-500 rounded-t-2xl p-4 flex flex-col items-center">
            <Avatar className="w-20 h-20 border-4 border-white shadow mb-2">
              <AvatarImage
                className="object-cover"
                src={`https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${data?.uid}.jpg`}
                alt={(() => {
                  const parts = [
                    data?.personalDetails?.firstName,
                    data?.personalDetails?.middleName,
                    data?.personalDetails?.lastName,
                  ].filter(Boolean);
                  return parts.length ? parts.join(" ") : "Student";
                })()}
              />
              <AvatarFallback className="text-2xl font-bold bg-purple-100 text-purple-600">
                {(() => {
                  const first = data?.personalDetails?.firstName || "?";
                  return first.charAt(0);
                })()}
              </AvatarFallback>
            </Avatar>
            <div className="text-lg font-bold text-white mb-1 text-center w-full truncate">
              {(() => {
                const parts = [
                  data?.personalDetails?.firstName,
                  data?.personalDetails?.middleName,
                  data?.personalDetails?.lastName,
                ].filter(Boolean);
                return parts.length ? parts.join(" ") : "Student";
              })()}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              <Badge
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  data?.active
                    ? "bg-emerald-500/90 hover:bg-emerald-600 text-white"
                    : "bg-red-500/90 hover:bg-red-500 text-white"
                }`}
              >
                {data?.active ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/20 rounded-full text-white border-white/40 font-medium text-xs"
              >
                UID: {data?.uid}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-white rounded-b-2xl shadow p-4 flex flex-col items-center">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full text-xs text-gray-700">
              <div className="font-semibold text-gray-500">UID:</div>
              <div>{data?.uid ?? "-"}</div>
              <div className="font-semibold text-gray-500">Roll No.:</div>
              <div>{"-"}</div>
              <div className="font-semibold text-gray-500">Reg. No.:</div>
              <div>{"-"}</div>
              <div className="font-semibold text-gray-500">Program Course:</div>
              <div>{data?.programCourse?.name || "-"}</div>
              <div className="font-semibold text-gray-500">Section:</div>
              <div>{data?.section?.name || "-"}</div>
              <div className="font-semibold text-gray-500">Shift:</div>
              <div>{data?.shift?.name || "-"}</div>
              <div className="font-semibold text-gray-500">Email:</div>
              <div>{data?.personalEmail || "-"}</div>
            </div>
          </div>
        </div>
        {/* <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-2rem)] sticky top-4">
        <div className="h-auto bg-white rounded-2xl drop-shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700/90">
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-white rounded-xl">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Navigation</h3>
                <p className="text-sm text-gray-100">Quick access menu</p>
              </div>
            </div>
          </div>
         </div>
      </div> */}
      </div>
    </>
  );
}
