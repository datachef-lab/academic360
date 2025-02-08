// // // import { useEffect } from "react";
// // // import { useParams } from "react-router-dom";

// // // export default function StudentPage() {
// // //   const { studentId } = useParams();
// // //   console.log(studentId);

// // //  useEffect(()=>{
  

// // //  },[studentId])
 

// // //   return (
// // //     <div className="flex h-full gap-2">
// // //       <div className="w-[80%] h-full border">
// // //         <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
// // //           ABC STUDENT - {studentId}
// // //         </h2>
// // //         <div className="flex border gap-4">
// // //           <div  className=" border border-red-600">
// // //          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoEAMYKHiwI5JH_IlxayW3-9UurHlASFy9A&s"/>
// // //          </div>
// // //          <div className="w-full border border-red-600">
// // //             <h2 className="text-2xl text-bold">Personal Details</h2>
          
// // //             <p>Reg Number: 123456</p>
// // //             <p>Name: ABC</p>
// // //             <p>Last Name: xyz</p>
// // //             <p>DOB: 12-12-1999</p>
         
// // //          </div>
// // //         </div>
// // //       </div>
// // //       <div className="w-[20%] h-full border">
// // //         <ul>
// // //             <li>Personal Details</li>
// // //             <li>Health Details</li>
// // //             <li>Parent Details</li>
// // //         </ul>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // import { useEffect } from "react";
// // import { useParams } from "react-router-dom";

// // export default function StudentPage() {
// //   const { studentId } = useParams();

// //   useEffect(() => {
// //     console.log(studentId);
// //   }, [studentId]);

// //   return (
// //     <div className="flex flex-col md:flex-row min-h-full p-4 gap-4 bg-gray-100">
// //       {/* Left Section - Main Student Details */}
// //       <div className="md:w-3/4 w-full p-6 bg-white shadow-md rounded-xl">
// //         <h2 className="text-3xl font-semibold text-gray-800 border-b pb-2">
// //           ABC STUDENT - {studentId}
// //         </h2>

// //         {/* Student Info Card */}
// //         <div className="flex flex-col md:flex-row gap-6 mt-4">
// //           {/* Student Image */}
// //           <div className="w-full md:w-1/3">
// //             <img
// //               src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoEAMYKHiwI5JH_IlxayW3-9UurHlASFy9A&s"
// //               alt="Student"
// //               className="w-full h-auto rounded-md shadow-md"
// //             />
// //           </div>

// //           {/* Personal Details */}
// //           <div className="w-full md:w-2/3 p-4 bg-gray-50 rounded-md shadow-md">
// //             <h2 className="text-2xl font-semibold text-gray-700">Personal Details</h2>
// //             <p className="text-gray-600"><span className="font-semibold">Reg Number:</span> {studentId}</p>
// //             <p className="text-gray-600"><span className="font-semibold">Name:</span> ABC</p>
// //             <p className="text-gray-600"><span className="font-semibold">Last Name:</span> XYZ</p>
// //             <p className="text-gray-600"><span className="font-semibold">DOB:</span> 12-12-1999</p>
// //           </div>
// //         </div>

// //         {/* Additional Student Information - Grid Layout */}
// //         <div className="grid md:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
// //           {/* Contact Info */}
// //           <div className="p-4 bg-white shadow-md rounded-md">
// //             <h3 className="text-md font-semibold text-gray-800">Contact Details</h3>
// //             <p className="text-gray-600"><span className="font-semibold">Phone:</span> +1234567890</p>
// //             <p className="text-gray-600"><span className="font-semibold">Email:</span> abc@student.com</p>
// //             <p className="text-gray-600"><span className="font-semibold">Address:</span> 123 Street, City</p>
// //           </div>

// //           {/* Academic Info */}
// //           <div className="p-4 bg-white shadow-md rounded-md">
// //             <h3 className="text-md font-semibold text-gray-800">Academic Details</h3>
// //             <p className="text-gray-600"><span className="font-semibold">Course:</span> B.Tech</p>
// //             <p className="text-gray-600"><span className="font-semibold">Specialization:</span> Computer Science</p>
// //             <p className="text-gray-600"><span className="font-semibold">Year:</span> 3rd</p>
// //           </div>

// //           {/* Fee Details */}
// //           <div className="p-4 bg-white shadow-md rounded-md">
// //             <h3 className="text-md font-semibold text-gray-800">Fee Details</h3>
// //             <p className="text-gray-600"><span className="font-semibold">Total Fee:</span> $5000</p>
// //             <p className="text-gray-600"><span className="font-semibold">Paid:</span> $4000</p>
// //             <p className="text-gray-600 text-red-500"><span className="font-semibold">Due:</span> $1000</p>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Right Sidebar - Navigation Menu */}
// //       <div className="md:w-1/4 w-full bg-white shadow-md rounded-xl p-6">
// //         <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Quick Links</h3>
// //         <ul className="mt-4 space-y-3">
// //           <li className="p-2 bg-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">Personal Details</li>
// //           <li className="p-2 bg-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">Health Details</li>
// //           <li className="p-2 bg-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">Parent Details</li>
// //           <li className="p-2 bg-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">Academic Records</li>
// //           <li className="p-2 bg-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">Fee Payments</li>
// //         </ul>
// //       </div>
// //     </div>
// //   );
// // }

// import { useEffect } from "react";
// import { useParams } from "react-router-dom";

// export default function StudentPage() {
//   const { studentId } = useParams();

//   useEffect(() => {
//     console.log(studentId);
//   }, [studentId]);

//   return (
//     <div className="flex flex-col md:flex-row min-h-screen p-4 gap-4 bg-gray-100 dark:bg-gray-900 transition-colors">
//       {/* Left Section - Main Student Details */}
//       <div className="md:w-3/4 w-full p-6 bg-white dark:bg-gray-800 shadow-md rounded-xl transition-colors">
//         <h2 className="text-3xl font-semibold text-gray-800 dark:text-white border-b pb-2">
//           ABC STUDENT - {studentId}
//         </h2>

//         {/* Student Info Card */}
//         <div className="flex flex-col md:flex-row gap-6 mt-4">
//           {/* Student Image */}
//           <div className="w-full md:w-1/3">
//             <img
//               src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoEAMYKHiwI5JH_IlxayW3-9UurHlASFy9A&s"
//               alt="Student"
//               className="w-full h-auto rounded-md shadow-md"
//             />
//           </div>

//           {/* Personal Details */}
//           <div className="w-full md:w-2/3 p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-md transition-colors">
//             <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">Personal Details</h2>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Reg Number:</span> {studentId}</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Name:</span> ABC</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Last Name:</span> XYZ</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">DOB:</span> 12-12-1999</p>
//           </div>
//         </div>

//         {/* Additional Student Information - Grid Layout */}
//         <div className="grid md:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
//           {/* Contact Info */}
//           <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-md transition-colors">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Contact Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Phone:</span> +1234567890</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Email:</span> abc@student.com</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Address:</span> 123 Street, City</p>
//           </div>

//           {/* Academic Info */}
//           <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-md transition-colors">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Academic Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Course:</span> B.Tech</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Specialization:</span> Computer Science</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Year:</span> 3rd</p>
//           </div>

//           {/* Fee Details */}
//           <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-md transition-colors">
//             <h3 className="text-md font-semibold text-gray-800 dark:text-white">Fee Details</h3>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Total Fee:</span> $5000</p>
//             <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Paid:</span> $4000</p>
//             <p className="text-gray-600 dark:text-red-400"><span className="font-semibold">Due:</span> $1000</p>
//           </div>
//         </div>
//       </div>

//       {/* Right Sidebar - Navigation Menu */}
//       <div className="md:w-1/4 w-full bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 transition-colors">
//         <h3 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Quick Links</h3>
//         <ul className="mt-4 space-y-3">
//           <li className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
//             Personal Details
//           </li>
//           <li className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
//             Health Details
//           </li>
//           <li className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
//             Parent Details
//           </li>
//           <li className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
//             Academic Records
//           </li>
//           <li className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
//             Fee Payments
//           </li>
//         </ul>
//       </div>
//     </div>
//   );
// }

import { BookUser, ContactRound, GraduationCapIcon,  Hospital, IndianRupee, User } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function StudentPage() {
  const { studentId } = useParams();

  useEffect(() => {
    console.log(studentId);
  }, [studentId]);

  return (
    <div className="flex flex-col md:flex-row min-h-full p-6 gap-6 bg-gray-100 dark:bg-gray-900 transition-all duration-100">
      {/* Left Section - Main Student Details */}
      <div className="md:w-3/4 w-full p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white border-b pb-3">
          ABC STUDENT - {studentId}
        </h2>

        {/* Student Info Section */}
        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Student Image */}
          <div className="w-full md:w-1/3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoEAMYKHiwI5JH_IlxayW3-9UurHlASFy9A&s"
              alt="Student"
              className="w-full border h-auto rounded-xl shadow-md"
            />
          </div>

          {/* Personal Details Card */}
          <div className="border w-full md:w-2/3 p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-md transition-all duration-100">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-white mb-3">Personal Details</h2>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Reg Number:</span> 123456</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Name:</span> ABC</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Last Name:</span> XYZ</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">DOB:</span> 12-12-1999</p>
          </div>
        </div>

        {/* Additional Student Information - Grid Layout */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Contact Info */}
          <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white">Contact Details</h3>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Phone:</span> +1234567890</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Email:</span> abc@student.com</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Address:</span> 123 Street, City</p>
          </div>

          {/* Academic Info */}
          <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white">Academic Details</h3>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Course:</span> B.Com</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Specialization:</span> Accounting</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Year:</span> 3rd</p>
          </div>

          {/* Fee Details */}
          <div className="p-5 border bg-white dark:bg-gray-800 shadow-xl rounded-2xl transition-all duration-100 hover:shadow-2xl">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white">Fee Details</h3>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Total Fee:</span> ₹5000</p>
            <p className="text-gray-600 dark:text-gray-100"><span className="font-semibold">Paid:</span> ₹4000</p>
            <p className="text-red-400 dark:text-red-400"><span className="font-semibold">Due:</span> ₹1000</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Navigation Menu */}
      <div className="md:w-1/4 w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 transition-all duration-100">
    

        
        
        <h3 className="text-xl text-center font-semibold text-gray-800 dark:text-white border-b pb-2">Quick Links</h3>
      <div className="flex flex-col items-center justify-center space-y-1">
               <ul className="mt-4 ">
          <div className="flex gap-2 p-2 ">
           <User size={20}/> Personal Details
          </div>
          <div className="flex gap-2 p-2 ">
          <Hospital size={20} />Health Details
          </div>
          <div className="flex gap-2 p-2 ">
          <BookUser size={20} />Parent Details
          </div>
          <div className="flex gap-2 p-2 ">
           <GraduationCapIcon size={20}></GraduationCapIcon> Academic Records
          </div>
          <div className="flex gap-2 p-2 ">
          <IndianRupee size={20}/>Fee Payments
          </div>
          <div className="flex gap-2 p-2 ">
          <ContactRound size={20}/>Contact Details
          </div>
        </ul>
        </div>
      </div>
    </div>
  );
}

