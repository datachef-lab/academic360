// import { BookUser, ContactRound, GraduationCapIcon,  Hospital, IndianRupee, User } from "lucide-react";
// import { useEffect } from "react";
// import { useParams } from "react-router-dom";

import StudentContent from "@/components/student/StudentContent";
import StudentPanel from "@/components/student/StudentPanel";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// export default function StudentPage() {
//   const { studentId } = useParams();

//   useEffect(() => {
//     console.log(studentId);
//   }, [studentId]);

//   return (
//     <div className="flex flex-col md:flex-row min-h-full p-6 gap-6 bg-gray-100 dark:bg-gray-900 transition-all duration-100">

//       <div className="md:w-3/4 w-full p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100">
//         <h2 className="text-3xl font-bold text-gray-800 dark:text-white border-b pb-3">
//           ABC STUDENT - {studentId}
//         </h2>

//         <div className="flex flex-col md:flex-row gap-6 mt-6">

//           <div className="w-full md:w-1/3">
//             <img
//               src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoEAMYKHiwI5JH_IlxayW3-9UurHlASFy9A&s"
//               alt="Student"
//               className="w-full border h-auto rounded-xl shadow-md"
//             />
//           </div>

//           <div className="border w-full md:w-2/3 p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-md transition-all duration-100">
//             <h2 className="text-2xl font-semibold text-gray-700 dark:text-white mb-3">Personal Details</h2>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Reg Number:</span> 123456</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Name:</span> ABC</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Last Name:</span> XYZ</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">DOB:</span> 12-12-1999</p>
//           </div>
//         </div>

//         <div className="grid md:grid-cols-3 gap-6 mt-6">
//           <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Contact Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Phone:</span> +1234567890</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Email:</span> abc@student.com</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Address:</span> 123 Street, City</p>
//           </div>

//            <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Academic Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Course:</span> B.Com</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Specialization:</span> Accounting</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Year:</span> 3rd</p>
//           </div>

//           <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Fee Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Total Fee:</span> ₹5000</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Paid:</span> ₹4000</p>
//             <p className="text-red-400 dark:text-red-400"><span className="font-semibold">Due:</span> ₹1000</p>
//           </div>
//         </div>
//       </div>

//       {/* Right Sidebar - Navigation Menu */}
//       <div className="md:w-1/4 w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 transition-all duration-100">
//       <h3 className="text-xl text-center font-semibold text-gray-800 dark:text-white border-b pb-2">Quick Links</h3>
//       <div className="flex flex-col items-center justify-center space-y-1">
//                <ul className="mt-4 ">
//           <div className="flex gap-2 p-2 ">
//            <User size={20}/> Personal Details
//           </div>
//           <div className="flex gap-2 p-2 ">
//           <Hospital size={20} />Health Details
//           </div>
//           <div className="flex gap-2 p-2 ">
//           <BookUser size={20} />Parent Details
//           </div>
//           <div className="flex gap-2 p-2 ">
//            <GraduationCapIcon size={20}></GraduationCapIcon> Academic Records
//           </div>
//           <div className="flex gap-2 p-2 ">
//           <IndianRupee size={20}/>Fee Payments
//           </div>
//           <div className="flex gap-2 p-2 ">
//           <ContactRound size={20}/>Contact Details
//           </div>
//         </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

import { User, Book, Home, Bus, Heart, Phone, GraduationCap, IdCard, Users } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState(studentTabs[0]);

  return (
    <div className="w-full h-full flex gap-5">
      {/* Left Content */}
      <div className="w-[80%] h-full">
        {/* Student Details Header */}
        <div className="border-b pb-2 space-y-2">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            <p>HARSH NILESH DESAI</p>
          </h2>
          <div className="space-x-2 flex flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              INDIA
            </Badge>
            <Badge className="bg-green-700 flex items-center gap-1">Graduated</Badge>
            <Badge className="bg-blue-500 flex items-center gap-1">BCOM</Badge>
            <Badge className="bg-red-500 flex items-center gap-1">GUJARATI</Badge>
            <Badge className="bg-violet-500 flex items-center gap-1">CBCF</Badge>
            <Badge className="bg-gray-500 flex items-center gap-1">GEN</Badge>
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
