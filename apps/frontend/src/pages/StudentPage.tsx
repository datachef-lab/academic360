import { User, Book, Home, Bus, Heart, Phone, GraduationCap, IdCard, Users, FilePenIcon, Calendar, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { getStudentById } from "@/services/student";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentContent from "@/components/student/StudentContent";
import StudentPanel from "@/components/student/StudentPanel";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";



const studentTabs = [
  { label: "Overview", icon: <User size={16} />, endpoint: "/overview" },
  { label: "Personal Details", icon: <IdCard size={16} />, endpoint: "/personal-details" },
  { label: "Family Details", icon: <Users size={16} />, endpoint: "/family-details" },
  { label: "Health Details", icon: <Heart size={16} />, endpoint: "/health" },
  { label: "Emergency Contact", icon: <Phone size={16} />, endpoint: "/emergency-contact" },
  { label: "Academic History", icon: <Book size={16} />, endpoint: "/academic-history" },
  { label: "Academic Identifiers", icon: <GraduationCap size={16} />, endpoint: "/academic-identifier" },
  { label: "Accommodation", icon: <Home size={16} />, endpoint: "/accommodation" },
  { label: "Transport Details", icon: <Bus size={16} />, endpoint: "transport-details" },
  { label: "Marksheet", icon: <FilePenIcon size={16} />, endpoint: "/marksheet" },
];

export default function StudentPage() {
  const { studentId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab) {
      const matchingTab = studentTabs.find(tab => tab.label === location.state.activeTab.label);
      return matchingTab || studentTabs[0];
    }
    return studentTabs[0];
  });

  const { data } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await getStudentById(Number(studentId));
      return response.payload;
    },
  });

  return (
    <div className="w-full h-screen grid grid-cols-12 gap-6 px-6 py-4  drop-shadow-xl  overflow-hidden">
    
      <div className="col-span-9 h-full overflow-y-auto  ">
        <div className="space-y-6 pb-6">

          {/* Student Details  */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl  overflow-hidden  border border-gray-200"
          >
            
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-purple-800 h-32 relative">
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
              
         
              <div className="absolute top-4 right-4 flex space-x-2">
                <Badge 
                  className={`px-3 py-1 text-sm font-medium drop-shadow-lg rounded-full ${
                    data?.active 
                      ? "bg-emerald-500/90 hover:bg-emerald-600 text-white backdrop-blur-sm" 
                      : "bg-red-500/90 hover:bg-red-500 text-white backdrop-blur-sm"
                  }`}
                >
                  {data?.active ? "Active" : "Inactive"}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-white/20 drop-shadow-lg backdrop-blur-sm rounded-full text-white border-white/40 font-medium"
                >
                  UID: {data?.academicIdentifier?.uid}
                </Badge>
              </div>
              
         
              <div className="absolute -bottom-14 left-6 ">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                  <AvatarImage
                    className="object-cover"
                    src={`${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${data?.academicIdentifier?.uid}.jpg`}
                    alt={data?.name}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-purple-100 text-purple-600">
                    {data?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
           
            <div className="pt-16 pb-6 px-6 bg-white">
              <div className="flex flex-wrap justify-between items-end mb-4">
                <div>
                  <motion.h1 
                    className="text-2xl md:text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {data?.name}
                  </motion.h1>
                 
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-purple-100 drop-shadow-sm hover:bg-purple-200 text-purple-800 border-0 rounded-full px-3 py-1">
                      {data?.academicIdentifier?.stream?.degree.name ?? "BCOM"}
                    </Badge>
                    <Badge className="bg-indigo-100 drop-shadow-sm hover:bg-indigo-200 text-indigo-800 border-0 rounded-full px-3 py-1">
                      {data?.academicIdentifier?.stream?.framework}
                    </Badge>
                    {data?.community && (
                      <Badge className="bg-pink-100 drop-shadow-sm hover:bg-pink-200 text-pink-800 border-0 rounded-full px-3 py-1">
                        {data.community}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">UID</p>
                    <p className="text-sm font-medium text-gray-700">{data?.academicIdentifier?.uid}</p>
                  </div>
                </div>
                
                <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                    <IdCard size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registration No.</p>
                    <p className="text-sm font-medium text-gray-700">{data?.academicIdentifier?.registrationNumber}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/90 to-purple-500/80 flex items-center justify-center mr-3 drop-shadow-lg">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">D.O.B</p>
                    <p className="text-sm font-medium text-gray-700">
                      {data?.personalDetails?.dateOfBirth 
                        ? new Date(data.personalDetails.dateOfBirth).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Student Content */}
          <div className="bg-white/40 rounded-2xl drop-shadow-sm ">
            <StudentContent activeTab={activeTab} studentId={Number(studentId)} />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="col-span-3 h-full">
        <div className="h-auto bg-white rounded-2xl  border border-gray-200 overflow-hidden">
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
      </div>
    </div>
  );
}
