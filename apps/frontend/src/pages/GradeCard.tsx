
// // import React, { useState } from 'react';
// // type StudentDetails = {
// //   name: string;
// //   registrationNo: string;
// //   rollNo: string;
// // };
// // type StudentMarks = {
// //     theoretical:number ;
// //     practical:number;
// //     sum:number;
// // };

// // const GradeCard: React.FC = () => {

// //   const [studentDetails, setStudentDetails] = useState<StudentDetails>({
// //       name: 'ADITYA RAJ',
// //       registrationNo: '017-1111-0673-23',
// //       rollNo: '233017-21-0003',
// //   });

// //   const [studentMarks, setStudentMarks] = useState<StudentMarks[]>([
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //     {theoretical: 0, practical: 0, sum: 0},
// //   ]);

// //   const handleSum =(index:number, marksField:keyof StudentMarks,value:number )=>{
// //       setStudentMarks((prev)=>{
// //         const updatedCourses = [...prev];
// //       const updatedCourse = updatedCourses[index];

// //       const newMark = Number(value);
// //       updatedCourse[marksField] = newMark;
// //       updatedCourse.sum = updatedCourse.theoretical + updatedCourse.practical;

// //       return updatedCourses;

// //       })
// //   };

// //   const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
// //     const {name,value}=e.target;
// //     setStudentDetails((prev)=>({
// //       ...prev,
// //       [name]:value,
// //     }))

// //   };

// //   return (
// //     <div className="p-4 bg-white font-sans">
// //       {/* Header Section */}
// //       <div className="text-center mb-4">
// //         <h1 className="font-bold text-blue-700 font-serif text-3xl ">UNIVERSITY OF CALCUTTA</h1>
// //         <h2 className="font-bold text-blue-700 font-serif text-lg">Grade Card</h2>
// //         <div className="text-md font-sans">
// //           Four Year B.Sc. Semester - I Examination, 2023 (Under CCF, 2022)

// //         </div>
// //       </div>

// //       {/* Input Fields for Name, Registration No., and Roll No. */}
// //       <div className="my-2 p-2">
// //         <div className="flex items-center justify-between mb-2">
// //           <label className="flex items-center gap-2">
// //             <span className="font-semibold">Name:</span>
// //             <input
// //               type="text"
// //               className="border border-gray-300 p-1 rounded w-40"
// //               value={studentDetails.name}
// //               onChange={handleChange}
// //             />
// //           </label>
// //           <div className="flex gap-4">
// //             <label className="flex items-center gap-2">
// //               <span className="font-semibold">Registration No.:</span>
// //               <input
// //                 type="text"
// //                 className="border border-gray-300 p-1 rounded w-40"
// //                 value={studentDetails.registrationNo}
// //                 onChange={handleChange}
// //               />
// //             </label>
// //             <label className="flex items-center gap-2">
// //               <span className="font-semibold">Roll No.:</span>
// //               <input
// //                 type="text"
// //                 className="border border-gray-300 p-1 rounded w-40"
// //                 value={studentDetails.rollNo}
// //                 onChange={handleChange}
// //               />
// //             </label>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Table Section */}
// //       <table className="w-full  border-collapse border border-gray-400 text-sm">
// //         <thead>
// //           <tr className="">
// //             <th className="border border-gray-400 w-[20%] p-2" >Course Code (Course Type)</th>
// //             <th className="border border-gray-400 w-[20%] p-2">Course Name</th>
// //             <th className="border border-gray-400 p-2">Year</th>
// //             <th className="border border-gray-400 p-2">Course Component</th>
// //             <th className="border border-gray-400 p-2">Full Marks</th>
// //             <th className="border border-gray-400 w-[7%] p-2">Marks Obtained</th>
// //             <th className="border border-gray-400 p-2">Credit</th>
// //             <th className="border border-gray-400 p-2">Credit Points Obtained</th>
// //             <th className="border border-gray-400 p-2">Grade</th>
// //             <th className="border border-gray-400 p-2">Status</th>
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {/* Chemistry Course */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={3}>CEMM-DSCC-1 (Discipline Specific Core Course)</td>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={3}>FUNDAMENTALS OF CHEMISTRY-I</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">75</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-"
// //                 value={studentMarks[0].theoretical} 
// //                 onChange={(e)=>handleSum(0,"theoretical",Number(e.target.value))}
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">3</td>
// //             <td className="border border-gray-400 p-2">12,000</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>C+</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>P</td>
// //           </tr>
// //           <tr className='text-center'>


// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Practical</td>
// //             <td className="border border-gray-400 p-2">25</td>
// //             <td className="border border-gray-400 p-0 ">
// //               <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //                 value={studentMarks[0].practical} 
// //                 onChange={(e)=>{handleSum(0,"practical",Number(e.target.value))}}
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">1</td>
// //             <td className="border border-gray-400 p-2">7,600</td>

// //           </tr>
// //           <tr className='font-semibold text-center'>


// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>

// //             <td className="border border-gray-400 p-2">100</td>
// //             <td className="border border-gray-400 p-2">{studentMarks[0].sum}</td>
// //             <td className="border border-gray-400 p-2">4</td>
// //             <td className="border border-gray-400 p-2">19,600</td>

// //           </tr>

// //           {/* Quantitative Analysis Course */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={3}>CEMM-SEC-1 (Skill Enhancement Course)</td>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={3}>QUANTITATIVE ANALYSIS AND BASIC LABORATORY PRACTICES</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">75</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">3</td>
// //             <td className="border border-gray-400 p-2">13,599</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>B</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>P</td>
// //           </tr>
// //           <tr className='text-center'>

// //             <td className="border border-gray-400 p-2" >2023</td>
// //             <td className="border border-gray-400 p-2">Tutorial</td>
// //             <td className="border border-gray-400 p-2">25</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">1</td>
// //             <td className="border border-gray-400 p-2">8,000</td>

// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">100</td>
// //             <td className="border border-gray-400 p-2">54</td>
// //             <td className="border border-gray-400 p-2">4</td>
// //             <td className="border border-gray-400 p-2">21,599</td>

// //           </tr>
// //           {/* <!-- MMTH-MN-1 (Minor Course) --> */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={3}>MMTH-MN-1 (Minor Course)</td>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={3}>CALCULAS, GEOMETRY AND VECTOR ANALYSIS</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">75</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">3</td>
// //             <td className="border border-gray-400 p-2">15.999</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>B</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>P</td>
// //           </tr>
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Tutorial</td>
// //             <td className="border border-gray-400 p-2">25</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">1</td>
// //             <td className="border border-gray-400 p-2">6.400</td>

// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">100</td>
// //             <td className="border border-gray-400 p-2">56</td>
// //             <td className="border border-gray-400 p-2">4</td>
// //             <td className="border border-gray-400 p-2">22.399</td>

// //           </tr>
// //           {/* <!-- CMSD-IDC-1 (Inter Disciplinary Course) --> */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={3}>CMSD-IDC-1 (Inter Disciplinary Course)</td>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={3}>FUNDAMENTALS OF COMPUTER SCIENCE AND ITS APPLICATIONS</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">12.000</td>
// //             <td className="border border-gray-400 p-2 text-center font-semibold" rowSpan={3}>B+</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>P</td>
// //           </tr>
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Practical</td>
// //             <td className="border border-gray-400 p-2">25</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">1</td>
// //             <td className="border border-gray-400 p-2">6.000</td>

// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">75</td>
// //             <td className="border border-gray-400 p-2">45</td>
// //             <td className="border border-gray-400 p-2">3</td>
// //             <td className="border border-gray-400 p-2">18.000</td>

// //           </tr>
// //           {/* <!-- ENGC-AEC-1 (Ability Enhancement Course) --> */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={2}>ENGC-AEC-1 (Ability Enhancement Course)</td>
// //             <td className="border border-gray-400 text-left  p-2" rowSpan={2}>COMPULSORY ENGLISH</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">20.000</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>A++</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>P</td>
// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">20.000</td>

// //           </tr>
// //           {/* <!-- ENVS-CVAC-1.1 (Common Value Added Course) --> */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={2}>ENVS-CVAC-1.1 (Common Value Added Course)</td>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={2}>FUNDAMENTALS OF ENVIRONMENT</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">9.200</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>C+</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>P</td>
// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-2">23</td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">9.200</td>

// //           </tr>
// //           {/* <!-- CONS-CVAC-1.2 (Common Value Added Course) --> */}
// //           <tr className='text-center'>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={2}>CONS-CVAC-1.2 (Common Value Added Course)</td>
// //             <td className="border border-gray-400 text-left p-2" rowSpan={2}>CONSTITUTIONAL VALUES AND FUNDAMENTAL DUTIES</td>
// //             <td className="border border-gray-400 p-2">2023</td>
// //             <td className="border border-gray-400 p-2">Theoretical</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-0 ">
// //             <input className=" text-center border-2 border-white  hover:border-black rounded-sm  pl-4 pr-1 py-2 w-full" 
// //                 type="number" 
// //                 placeholder="-" 
// //               />
// //             </td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">7.600</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>C</td>
// //             <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={2}>P</td>
// //           </tr>
// //           <tr className='font-semibold text-center'>
// //             <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
// //             <td className="border border-gray-400 p-2">50</td>
// //             <td className="border border-gray-400 p-2">19</td>
// //             <td className="border border-gray-400 p-2">2</td>
// //             <td className="border border-gray-400 p-2">7.600</td>


// //           </tr>

// //           {/* Grand Total Row */}
// //           <tr className='text-center font-bold'>
// //             <td className="border border-gray-400 p-2" colSpan={4}>Grand Total</td>
// //             <td className="border border-gray-400 p-2">525</td>
// //             <td className="border border-gray-400 p-2">296</td>
// //             <td className="border border-gray-400 p-2">21</td>
// //             <td className="border border-gray-400 p-2">118,398</td>
// //             <td className="border border-gray-400 p-2"></td>
// //             <td className="border border-gray-400 p-2"></td>
// //           </tr>
// //           <tr>
// //             <td className="border border-gray-400 p-2 text-center font-semibold " colSpan={10}>Semester Grade Point Average (SGPA) : 5,638</td>



// //           </tr>
// //           <tr>
// //             <td className="border border-gray-400 text-left font-semibold p-2" colSpan={10}>  Remarks : Semester Cleared</td>
// //           </tr>
// //         </tbody>
// //       </table>

//       // {/* Footer Section */}

//       // <div className="text-sm w-[45%] pl-5 border py-2 border-gray-400 rounded-sm mt-4">
//       //   <p className='font-semibold'>Abbreviations </p>

//       //   <p>  P : Passed in the Course, F : Failed in the Course,
//       //   </p>
//       //   <p>F(TH) : Failed in Theoretical, F(PR) : Failed in Practical, F(TU) : Failed in Tutorial,
//       //   </p>
//       //   <p>AB : Absent, +1 : Grace Mark, EC : Examination Cancelled,
//       //   </p>
//       //   <p>ECDB1 : Debarment for 1 year, ECDB2 : Debarment for 2 year,
//       //   </p>
//       //   <p>N.A. : Not Applicable</p>
//       // </div>
//       // <div className="p-1 mt-4">
//       //   <button className="print:hidden bg-black text-white px-4 py-2 rounded" onClick={() => { window.print() }}>Print</button>
//       // </div>
// //     </div>
// //   );
// // };

// // export default GradeCard;
// // // import React, { useState } from 'react';

// // // interface StudentDetails {
// // //   name: string;
// // //   registrationNo: string;
// // //   rollNo: string;
// // // }

// // // interface Marks {
// // //   theoretical: number;
// // //   practical: number;
// // //   sum: number;
// // // }

// // // interface Course {
// // //   courseCode: string;
// // //   courseName: string;
// // //   year: number;
// // //   courseComponent: string;
// // //   fullMarks: number;
// // //   marksObtained: number;
// // //   credit: number;
// // //   creditPointsObtained: number;
// // //   grade: string;
// // //   status: string;
// // // }

// // // const GradeCard = () => {
// // //   const [studentDetails, setStudentDetails] = useState<StudentDetails>({
// // //     name: '',
// // //     registrationNo: '',
// // //     rollNo: '',
// // //   });

// // //   const [studentMarks, setStudentMarks] = useState<Marks[]>([
// // //     { theoretical: 0, practical: 0, sum: 0 },
// // //     { theoretical: 0, practical: 0, sum: 0 },
// // //     { theoretical: 0, practical: 0, sum: 0 },
// // //   ]);

// // //   const [courses, setCourses] = useState<Course[]>([
// // //     {
// // //       courseCode: 'CEMM-DSCC-1',
// // //       courseName: 'FUNDAMENTALS OF CHEMISTRY-I',
// // //       year: 2023,
// // //       courseComponent: 'Theoretical',
// // //       fullMarks: 75,
// // //       marksObtained: 0,
// // //       credit: 3,
// // //       creditPointsObtained: 12000,
// // //       grade: 'C+',
// // //       status: 'P',
// // //     },
// // //     {
// // //       courseCode: 'CEMM-DSCC-2',
// // //       courseName: 'FUNDAMENTALS OF CHEMISTRY-II',
// // //       year: 2023,
// // //       courseComponent: 'Practical',
// // //       fullMarks: 25,
// // //       marksObtained: 0,
// // //       credit: 1,
// // //       creditPointsObtained: 7600,
// // //       grade: 'B',
// // //       status: 'P',
// // //     },
// // //     {
// // //       courseCode: 'CEMM-DSCC-3',
// // //       courseName: 'ADVANCED CHEMISTRY-I',
// // //       year: 2023,
// // //       courseComponent: 'Theoretical',
// // //       fullMarks: 75,
// // //       marksObtained: 0,
// // //       credit: 3,
// // //       creditPointsObtained: 12000,
// // //       grade: 'A',
// // //       status: 'P',
// // //     },
// // //   ]);

// // //   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const { name, value } = e.target;
// // //     setStudentDetails((prev) => ({
// // //       ...prev,
// // //       [name]: value,
// // //     }));
// // //   };

// // //   const handleSum = (index: number, component: string, value: number) => {
// // //     const newMarks = [...studentMarks];
// // //     newMarks[index] = {
// // //       ...newMarks[index],
// // //       [component]: value,
// // //       sum: newMarks[index].theoretical + newMarks[index].practical,
// // //     };
// // //     setStudentMarks(newMarks);
// // //   };

// // //   return (
// // //     <div className="p-4 bg-white font-sans">
// // //       {/* Header Section */}
// // //       <div className="text-center mb-4">
// // //         <h1 className="font-bold text-blue-700 font-serif text-3xl ">UNIVERSITY OF CALCUTTA</h1>
// // //         <h2 className="font-bold text-blue-700 font-serif text-lg">Grade Card</h2>
// // //         <div className="text-md font-sans">
// // //           Four Year B.Sc. Semester - I Examination, 2023 (Under CCF, 2022)
// // //         </div>
// // //       </div>

// // //       {/* Input Fields for Name, Registration No., and Roll No. */}
// // //       <div className="my-2 p-2">
// // //         <div className="flex items-center justify-between mb-2">
// // //           <label className="flex items-center gap-2">
// // //             <span className="font-semibold">Name:</span>
// // //             <input
// // //               type="text"
// // //               name="name"
// // //               className="border border-gray-300 p-1 rounded w-40"
// // //               value={studentDetails.name}
// // //               onChange={handleChange}
// // //             />
// // //           </label>
// // //           <div className="flex gap-4">
// // //             <label className="flex items-center gap-2">
// // //               <span className="font-semibold">Registration No.:</span>
// // //               <input
// // //                 type="text"
// // //                 name="registrationNo"
// // //                 className="border border-gray-300 p-1 rounded w-40"
// // //                 value={studentDetails.registrationNo}
// // //                 onChange={handleChange}
// // //               />
// // //             </label>
// // //             <label className="flex items-center gap-2">
// // //               <span className="font-semibold">Roll No.:</span>
// // //               <input
// // //                 type="text"
// // //                 name="rollNo"
// // //                 className="border border-gray-300 p-1 rounded w-40"
// // //                 value={studentDetails.rollNo}
// // //                 onChange={handleChange}
// // //               />
// // //             </label>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Table Section */}
// // //       <table className="w-full border-collapse border border-gray-400 text-sm">
// // //         <thead>
// // //           <tr>
// // //             <th className="border border-gray-400 w-[20%] p-2">Course Code (Course Type)</th>
// // //             <th className="border border-gray-400 w-[20%] p-2">Course Name</th>
// // //             <th className="border border-gray-400 p-2">Year</th>
// // //             <th className="border border-gray-400 p-2">Course Component</th>
// // //             <th className="border border-gray-400 p-2">Full Marks</th>
// // //             <th className="border border-gray-400 w-[7%] p-2">Marks Obtained</th>
// // //             <th className="border border-gray-400 p-2">Credit</th>
// // //             <th className="border border-gray-400 p-2">Credit Points Obtained</th>
// // //             <th className="border border-gray-400 p-2">Grade</th>
// // //             <th className="border border-gray-400 p-2">Status</th>
// // //           </tr>
// // //         </thead>
// // //         <tbody>
// // //           {courses.map((course, index) => (
// // //             <>
// // //               <tr key={course.courseCode} className="text-center">
// // //                 <td className="border border-gray-400 text-left p-2" rowSpan={3}>
// // //                   {course.courseCode} ({course.courseComponent})
// // //                 </td>
// // //                 <td className="border border-gray-400 text-left p-2" rowSpan={3}>
// // //                   {course.courseName}
// // //                 </td>
// // //                 <td className="border border-gray-400 p-2">{course.year}</td>
// // //                 <td className="border border-gray-400 p-2">{course.courseComponent}</td>
// // //                 <td className="border border-gray-400 p-2">{course.fullMarks}</td>
// // //                 <td className="border border-gray-400 p-0">
// // //                   <input
// // //                     className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
// // //                     type="number"
// // //                     placeholder="-"
// // //                     value={studentMarks[index].theoretical}
// // //                     onChange={(e) => handleSum(index, 'theoretical', Number(e.target.value))}
// // //                   />
// // //                 </td>
// // //                 <td className="border border-gray-400 p-2">{course.credit}</td>
// // //                 <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
// // //                 <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
// // //                   {course.grade}
// // //                 </td>
// // //                 <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
// // //                   {course.status}
// // //                 </td>
// // //               </tr>
// // //               <tr className="text-center">
// // //                 <td className="border border-gray-400 p-2">{course.year}</td>
// // //                 <td className="border border-gray-400 p-2">{course.courseComponent}</td>
// // //                 <td className="border border-gray-400 p-2">{course.fullMarks}</td>
// // //                 <td className="border border-gray-400 p-0">
// // //                   <input
// // //                     className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
// // //                     type="number"
// // //                     placeholder="-"
// // //                     value={studentMarks[index].practical}
// // //                     onChange={(e) => handleSum(index, 'practical', Number(e.target.value))}
// // //                   />
// // //                 </td>
// // //                 <td className="border border-gray-400 p-2">{course.credit}</td>
// // //                 <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
// // //               </tr>
// // //               <tr className="font-semibold text-center">
// // //                 <td className="border border-gray-400 p-2" colSpan={2}>
// // //                   Total
// // //                 </td>
// // //                 <td className="border border-gray-400 p-2">100</td>
// // //                 <td className="border border-gray-400 p-2">{studentMarks[index].sum}</td>
// // //                 <td className="border border-gray-400 p-2">{course.credit * 2}</td>
// // //                 <td className="border border-gray-400 p-2">{course.creditPointsObtained * 2}</td>
// // //               </tr>
// // //             </>
// // //           ))}
// // //         </tbody>
// // //       </table>
// // //     </div>
// // //   );
// // // };

// // // export default GradeCard;
// import React, { useState } from 'react';
// import { studentData, coursesData } from './dummyData'; // Import dummy data
// import { Plus } from 'lucide-react';

// interface Marks {
//   theoretical: number;
//   practical: number;
//   sum: number;
// }



// const GradeCard = () => {
//   const [studentDetails, setStudentDetails] = useState(studentData);
//   const [studentMarks, setStudentMarks] = useState<Marks[]>([
//     { theoretical: 0, practical: 0, sum: 0 },
//     { theoretical: 0, practical: 0, sum: 0 },
//     { theoretical: 0, practical: 0, sum: 0 },
//   ]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setStudentDetails((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSum = (index: number, component: string, value: number) => {
//     const newMarks = [...studentMarks];
//     newMarks[index] = {
//       ...newMarks[index],
//       [component]: value,
//       sum: newMarks[index].theoretical + newMarks[index].practical,
//     };
//     setStudentMarks(newMarks);
//   };


//   const handleAddRow =()=>{
//     console.log("clicked");
//       setStudentMarks([...studentMarks, { theoretical: 0, practical: 0, sum: 0 }]);
//    console.log(studentMarks);
//   };

//   return (
//     <div className="p-4 bg-white font-sans">
//       {/* Header Section */}
//       <div className="text-center mb-4">
//         <h1 className="font-bold text-blue-700 font-serif text-3xl ">UNIVERSITY OF CALCUTTA</h1>
//         <h2 className="font-bold text-blue-700 font-serif text-lg">Grade Card</h2>
//         <div className="text-md font-sans">
//           Four Year B.Sc. Semester - I Examination, 2023 (Under CCF, 2022)
//         </div>
//       </div>

//       {/* Input Fields for Name, Registration No., and Roll No. */}
//       <div className="my-2 p-2">
//         <div className="flex items-center justify-between mb-2">
//           <label className="flex items-center gap-2">
//             <span className="font-semibold">Name:</span>
//             <input
//               type="text"
//               name="name"
//               className="border border-gray-300 p-1 rounded w-40"
//               value={studentDetails.name}
//               onChange={handleChange}
//             />
//           </label>
//           <div className="flex w-full items-center justify-end gap-5">
//             <label className="flex items-center gap-2">
//               <span className="font-semibold">Registration No.:</span>
//               <input
//                 type="text"
//                 name="registrationNo"
//                 className="border border-gray-300 p-1 rounded w-40"
//                 value={studentDetails.registrationNo}
//                 onChange={handleChange}
//               />
//             </label>
//             <label className="flex items-center gap-2">
//               <span className="font-semibold">Roll No.:</span>
//               <input
//                 type="text"
//                 name="rollNo"
//                 className="border border-gray-300 p-1 rounded w-40"
//                 value={studentDetails.rollNo}
//                 onChange={handleChange}
//               />
//             </label>
//             <div className='pointer shadow-md p-2 rounded-md border '
//               onClick={handleAddRow}
//             >
//                <Plus size={18}/>
//             </div>

//           </div>

//         </div>
//       </div>

//       {/* Table Section */}
//       <table className="w-full border-collapse border border-gray-400 text-sm">
//         <thead>
//           <tr>
//             <th className="border border-gray-400 w-[20%] p-2">Course Code (Course Type)</th>
//             <th className="border border-gray-400 w-[20%] p-2">Course Name</th>
//             <th className="border border-gray-400 p-2">Year</th>
//             <th className="border border-gray-400 p-2">Course Component</th>
//             <th className="border border-gray-400 p-2">Full Marks</th>
//             <th className="border border-gray-400 w-[7%] p-2">Marks Obtained</th>
//             <th className="border border-gray-400 p-2">Credit</th>
//             <th className="border border-gray-400 p-2">Credit Points Obtained</th>
//             <th className="border border-gray-400 p-2">Grade</th>
//             <th className="border border-gray-400 p-2">Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {coursesData.map((course, index) => (

//             <React.Fragment key={course.courseCode}>
//               <tr className="text-center " key={course.courseCode}>
//                 <td className="border border-gray-400 text-left p-2" rowSpan={3}>
//                   {course.courseCode} 
//                 </td>
//                 <td className="border border-gray-400 text-left p-2" rowSpan={3}>
//                   {course.courseName}
//                 </td>
//                 <td className="border border-gray-400 p-2">{course.year}</td>
//                 <td className="border border-gray-400 p-2">{course.courseComponent}</td>
//                 <td className="border border-gray-400 p-2">{course.fullMarks}</td>
//                 <td className="border border-gray-400 p-0">
//                   <input
//                     className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
//                     type="number"
//                     placeholder="-"
//                     value={studentMarks[index]?.theoretical || 0}
//                     onChange={(e) => handleSum(index, 'theoretical', Number(e.target.value))} />
//                 </td>
//                 <td className="border border-gray-400 p-2">{course.credit}</td>
//                 <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
//                 <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
//                   {course.grade}
//                 </td>
//                 <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
//                   {course.status}
//                 </td>
//               </tr><tr className="text-center">
//                 <td className="border border-gray-400 p-2">{course.year}</td>
//                 <td className="border border-gray-400 p-2">{course.courseComponent}</td>
//                 <td className="border border-gray-400 p-2">{course.fullMarks}</td>
//                 <td className="border border-gray-400 p-0">
//                   <input
//                     className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
//                     type="number"
//                     placeholder="-"
//                     value={studentMarks[index]?.practical || 0}
//                     onChange={(e) => handleSum(index, 'practical', Number(e.target.value))} />
//                 </td>
//                 <td className="border border-gray-400 p-2">{course.credit}</td>
//                 <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
//               </tr><tr className="font-semibold text-center">
//                 <td className="border border-gray-400 p-2" colSpan={2}>
//                   Total
//                 </td>
//                 <td className="border border-gray-400 p-2">100</td>
//                 <td className="border border-gray-400 p-2">{studentMarks[index]?.sum || 0}</td>
//                 <td className="border border-gray-400 p-2">{course.credit * 2}</td>
//                 <td className="border border-gray-400 p-2">{course.creditPointsObtained * 2}</td>
//               </tr>
//             </React.Fragment>

//           ))}

//            {/* Grand Total Row */}
//            <tr className='text-center font-bold'>
//             <td className="border border-gray-400 p-2" colSpan={4}>Grand Total</td>
//             <td className="border border-gray-400 p-2">525</td>
//             <td className="border border-gray-400 p-2">296</td>
//             <td className="border border-gray-400 p-2">21</td>
//             <td className="border border-gray-400 p-2">118,398</td>
//             <td className="border border-gray-400 p-2"></td>
//             <td className="border border-gray-400 p-2"></td>
//           </tr>
//           <tr>
//             <td className="border border-gray-400 p-2 text-center font-semibold " colSpan={10}>Semester Grade Point Average (SGPA) : 5,638</td>



//           </tr>
//           <tr>
//             <td className="border border-gray-400 text-left font-semibold p-2" colSpan={10}>  Remarks : Semester Cleared</td>
//           </tr>
//         </tbody>
//       </table>
//        {/* Footer Section */}

//        <div className="text-sm w-[45%] pl-5 border py-2 border-gray-400 rounded-sm mt-4">
//         <p className='font-semibold'>Abbreviations </p>

//         <p>  P : Passed in the Course, F : Failed in the Course,
//         </p>
//         <p>F(TH) : Failed in Theoretical, F(PR) : Failed in Practical, F(TU) : Failed in Tutorial,
//         </p>
//         <p>AB : Absent, +1 : Grace Mark, EC : Examination Cancelled,
//         </p>
//         <p>ECDB1 : Debarment for 1 year, ECDB2 : Debarment for 2 year,
//         </p>
//         <p>N.A. : Not Applicable</p>
//       </div>
//       <div className="p-1 mt-4">
//         <button className="print:hidden bg-black text-white px-4 py-2 rounded" onClick={() => { window.print() }}>Print</button>
//       </div>
//     </div>
//   );
// };

// export default GradeCard;
import React, { useRef, useState } from 'react';
import { studentData, coursesData as initialCoursesData } from './dummyData'; // Import dummy data
import { Plus } from 'lucide-react';

interface Marks {
  theoretical: number;
  practical: number;
  sum: number;
}

const GradeCard = () => {
  const [studentDetails, setStudentDetails] = useState(studentData);
  const [studentMarks, setStudentMarks] = useState<Marks[]>([
    { theoretical: 0, practical: 0, sum: 0 },
    { theoretical: 0, practical: 0, sum: 0 },
    { theoretical: 0, practical: 0, sum: 0 },
  ]);
  const [coursesData, setCoursesData] = useState(initialCoursesData); // State for courses data

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSum = (index: number, component: string, value: number) => {
    const newMarks = [...studentMarks];
    newMarks[index] = {
      ...newMarks[index],
      [component]: value,
      sum: newMarks[index].theoretical + newMarks[index].practical,
    };
    setStudentMarks(newMarks);
  };
  const [values, setValues] = useState<{ text1: string; text2: string }>({
    text1: "",
    text2: "",
  });

  const textAreaRefs = {
    text1: useRef<HTMLTextAreaElement>(null),
    text2: useRef<HTMLTextAreaElement>(null),
  };

  const handleText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (textAreaRefs[name as keyof typeof textAreaRefs]?.current) {
      const textArea = textAreaRefs[name as keyof typeof textAreaRefs].current!;
      textArea.style.height = "auto"; // Reset height
      textArea.style.height = `${textArea.scrollHeight}px`; // Expand dynamically
    }
  };

  const handleAddRow = () => {
    const newCourse = {
      courseCode: '', // New course code
      courseName: '', // New course name
      year: 0,
      courseComponent: '',
      marksObtained: 0,
      fullMarks: 100,
      credit: 3,
      creditPointsObtained: 0,
      grade: '',
      status: '',
    };

    const newMarks = [...studentMarks, { theoretical: 0, practical: 0, sum: 0 }];
    setCoursesData([...coursesData, newCourse]); // Add new course
    setStudentMarks(newMarks); // Add new marks
    console.log(newMarks);
    console.log(studentMarks);
    console.log(coursesData);
  };

  return (
    <div className="p-4 bg-white font-sans">
      {/* Header Section */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-blue-700 font-serif text-3xl ">UNIVERSITY OF CALCUTTA</h1>
        <h2 className="font-bold text-blue-700 font-serif text-lg">Grade Card</h2>
        <div className="text-md font-sans">
          Four Year B.Sc. Semester - I Examination, 2023 (Under CCF, 2022)
        </div>
      </div>

      {/* Input Fields for Name, Registration No., and Roll No. */}
      <div className="my-2 p-2">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2">
            <span className="font-semibold">Name:</span>
            <input
              type="text"
              name="name"
              className="border border-gray-300 p-1 rounded w-40"
              value={studentDetails.name}
              onChange={handleChange}
            />
          </label>
          <div className="flex w-full items-center justify-end gap-5">
            <label className="flex items-center gap-2">
              <span className="font-semibold">Registration No.:</span>
              <input
                type="text"
                name="registrationNo"
                className="border border-gray-300 p-1 rounded w-40"
                value={studentDetails.registrationNo}
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="font-semibold">Roll No.:</span>
              <input
                type="text"
                name="rollNo"
                className="border border-gray-300 p-1 rounded w-40"
                value={studentDetails.rollNo}
                onChange={handleChange}
              />
            </label>
            <div
              className="pointer shadow-md p-2 rounded-md border"
              onClick={handleAddRow}
            >
              <Plus size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead>
          <tr>
            <th className="border border-gray-400 w-[20%] p-2">Course Code (Course Type)</th>
            <th className="border border-gray-400 w-[20%] p-2">Course Name</th>
            <th className="border border-gray-400 p-2">Year</th>
            <th className="border border-gray-400 p-2">Course Component</th>
            <th className="border border-gray-400 p-2">Full Marks</th>
            <th className="border border-gray-400 w-[7%] p-2">Marks Obtained</th>
            <th className="border border-gray-400 p-2">Credit</th>
            <th className="border border-gray-400 p-2">Credit Points Obtained</th>
            <th className="border border-gray-400 p-2">Grade</th>
            <th className="border border-gray-400 p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {coursesData.map((course, index) => (
            <React.Fragment key={course.courseCode}>
              <tr className="text-center">
                <td className="border border-gray-400 text-left p-2" rowSpan={3}>
                  {course.courseCode}
                </td>
                <td className="border border-gray-400 text-left p-2" rowSpan={3}>
                  {course.courseName}
                </td>
                <td className="border border-gray-400 p-2">{course.year}</td>
                <td className="border border-gray-400 p-2">{course.courseComponent}</td>
                <td className="border border-gray-400 p-2">{course.fullMarks}</td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={studentMarks[index]?.theoretical || 0}
                    onChange={(e) => handleSum(index, 'theoretical', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 p-2">{course.credit}</td>
                <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
                <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
                  {course.grade}
                </td>
                <td className="border border-gray-400 text-center font-semibold p-2" rowSpan={3}>
                  {course.status}
                </td>
              </tr>
              <tr className="text-center">
                <td className="border border-gray-400 p-2">{course.year}</td>
                <td className="border border-gray-400 p-2">{course.courseComponent}</td>
                <td className="border border-gray-400 p-2">{course.fullMarks}</td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={studentMarks[index]?.practical || 0}
                    onChange={(e) => handleSum(index, 'practical', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 p-2">{course.credit}</td>
                <td className="border border-gray-400 p-2">{course.creditPointsObtained}</td>
              </tr>
              <tr className="font-semibold text-center">
                <td className="border border-gray-400 p-2" colSpan={2}>
                  Total
                </td>
                <td className="border border-gray-400 p-2">100</td>
                <td className="border border-gray-400 p-2">{studentMarks[index]?.sum || 0}</td>
                <td className="border border-gray-400 p-2">{course.credit * 2}</td>
                <td className="border border-gray-400 p-2">{course.creditPointsObtained * 2}</td>
              </tr>
            </React.Fragment>
          ))}

          <tr className="text-center">
            <td className=" border border-gray-400    p-[1px]" rowSpan={3}>
              <div className="flex items-center justify-center border-2 border-white hover:border-black rounded-sm py-3 h-[120px] w-full">
                <textarea
                  name="text1"
                  ref={textAreaRefs.text1}
                  value={values.text1}
                  onChange={handleText}
                  rows={1}
                  className=" w-full  text-left  outline-none  p-1 overflow-hidden  resize-none  rounded-sm "

                  placeholder="Type here..."
                />
              </div>
            </td>
             <td className=" border border-gray-400    p-[1px]" rowSpan={3}>
              <div className="flex items-center justify-center border-2 border-white hover:border-black rounded-sm py-3 h-[120px] w-full">
                <textarea
                 name="text2"
                  ref={textAreaRefs.text2}
                  value={values.text2}
                  rows={1}
                  className=" w-full  text-left  outline-none  p-1 overflow-hidden  resize-none  rounded-sm "

                  placeholder="Type here..."
                />
              </div>
            </td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0">
              <input
                className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                type="number"
                placeholder="-"

              />
            </td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 text-center font-semibold p-0" rowSpan={3}>
              <input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
              </input>
            </td>
            <td className="border border-gray-400 text-center font-semibold p-0" rowSpan={3}>
              <input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
              </input>
            </td>
          </tr>
          <tr className="text-center">
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0">
              <input
                className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                type="number"
                placeholder="-"

              />
            </td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
          </tr>
          <tr className="font-semibold text-center">
            <td className="border border-gray-400 p-0" colSpan={2}>
              Total
            </td>
            <td className="border border-gray-400 p-0">100</td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
            <td className="border border-gray-400 p-0"><input type='text' className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full">
            </input></td>
          </tr>

          {/* Grand Total Row */}
          <tr className="text-center font-bold">
            <td className="border border-gray-400 p--2" colSpan={4}>Grand Total</td>
            <td className="border border-gray-400 p-2">525</td>
            <td className="border border-gray-400 p-2">296</td>
            <td className="border border-gray-400 p-2">21</td>
            <td className="border border-gray-400 p-2">118,398</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center font-semibold" colSpan={10}>
              Semester Grade Point Average (SGPA) : 5,638
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 text-left font-semibold p-2" colSpan={10}>
              Remarks : Semester Cleared
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="text-sm w-[45%] pl-5 border py-2 border-gray-400 rounded-sm mt-4">
        <p className="font-semibold">Abbreviations</p>
        <p>P : Passed in the Course, F : Failed in the Course,</p>
        <p>F(TH) : Failed in Theoretical, F(PR) : Failed in Practical, F(TU) : Failed in Tutorial,</p>
        <p>AB : Absent, +1 : Grace Mark, EC : Examination Cancelled,</p>
        <p>ECDB1 : Debarment for 1 year, ECDB2 : Debarment for 2 year,</p>
        <p>N.A. : Not Applicable</p>
      </div>
      <div className="p-1 mt-4">
        <button
          className="print:hidden bg-black text-white px-4 py-2 rounded"
          onClick={() => {
            window.print();
          }}
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default GradeCard;
