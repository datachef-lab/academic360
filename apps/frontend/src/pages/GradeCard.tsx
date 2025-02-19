import React, { useState } from 'react';
import { studentData, coursesData as initialCoursesData } from './dummyData'; 
import { Delete, Plus } from 'lucide-react';

interface Marks {
  theoretical: number;
  practical: number;
  sum: number;
}

type Course = {
  courseCode: string;
  courseType: string;
  courseName: string;
  year: number;

  theoreticalType: string;
  theoreticalFullMarks: number;
  theoreticalMarksObtained: number;
  theoreticalCredit: number;
  theoreticalCreditPointsObtained: number;
  theoreticalGrade: string;
  theoreticalStatus: string;

  practicalType: string;
  practicalFullMarks: number;
  practicalMarksObtained: number;
  practicalCredit: number;
  practicalCreditPointsObtained: number;

  totalFullMarks: number;
  totalMarksObtained: number;
  totalCredit: number;
  totalCreditPointsObtained: number;
}

const GradeCard = () => {
  const [studentDetails, setStudentDetails] = useState(studentData);
  const [studentMarks, setStudentMarks] = useState<Marks[]>(
    initialCoursesData.map(() => ({ theoretical: 0, practical: 0, sum: 0 }))
  );
  const [coursesData, setCoursesData] = useState<Course[]>(initialCoursesData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseChange = (index: number, field: keyof Course, value: string | number) => {
    setCoursesData((prev) => {
      const updatedCourses = [...prev];
      updatedCourses[index] = { ...updatedCourses[index], [field]: value };
      return updatedCourses;
    });
  };

  const handleSum = (index: number, marksField: keyof Marks, value: number) => {
    setStudentMarks((prev) => {
      const updatedMarks = [...prev];
      updatedMarks[index] = { ...updatedMarks[index], [marksField]: value };
      updatedMarks[index].sum = updatedMarks[index].theoretical + updatedMarks[index].practical;
      return updatedMarks;
    });
  };

  const handleAddRow = () => {
    const newCourse: Course = {
      courseCode: '',
      courseType: '',
      courseName: '',
      year: 0,

      theoreticalType: '',
      theoreticalFullMarks: 0,
      theoreticalMarksObtained: 0,
      theoreticalCredit: 0,
      theoreticalCreditPointsObtained: 0,
      theoreticalGrade: '',
      theoreticalStatus: '',

      practicalType: '',
      practicalFullMarks: 0,
      practicalMarksObtained: 0,
      practicalCredit: 0,
      practicalCreditPointsObtained: 0,

      totalFullMarks: 0,
      totalMarksObtained: 0,
      totalCredit: 0,
      totalCreditPointsObtained: 0,
    };
    setCoursesData([...coursesData, newCourse]);
    setStudentMarks([...studentMarks, { theoretical: 0, practical: 0, sum: 0 }]);
  };

  const handleDeleteRow = (index: number) => {
    const updatedCoursesData = coursesData.filter((_, i) => i !== index);
    const updatedMarks = studentMarks.filter((_, i) => i !== index);
    setCoursesData(updatedCoursesData);
    setStudentMarks(updatedMarks);
  };

  const handleSave = () => {
    const formData = {
      studentDetails,
      studentMarks,
      coursesData,
    };
    console.log("Saved Data:", JSON.stringify(formData, null, 2));
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
              className="border border-gray-300 p-2 rounded w-40"
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
                className="border border-gray-300 p-2 rounded w-40"
                value={studentDetails.registrationNo}
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="font-semibold">Roll No.:</span>
              <input
                type="text"
                name="rollNo"
                className="border border-gray-300 p-2 rounded w-40"
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
            <th className="border border-gray-400 w-[15%] p-2">Course Code (Course Type)</th>
            <th className="border border-gray-400 w-[15%] p-2">Course Name</th>
            <th className="border border-gray-400  w-[8%] p-2">Year</th>
            <th className="border border-gray-400 p-2">Course Component</th>
            <th className="border border-gray-400 w-[8%] p-2">Full Marks</th>
            <th className="border border-gray-400 w-[7%] p-2">Marks Obtained</th>
            <th className="border border-gray-400 w-[7%] p-2">Credit</th>
            <th className="border border-gray-400 w-[9%] p-2">Credit Points Obtained</th>
            <th className="border border-gray-400 p-2 w-[5%]">Grade</th>
            <th className="border border-gray-400 p-2 w-[5%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {coursesData.map((course, index) => (
            <React.Fragment key={index}>
              <tr className="text-center ">
                <td className=" border border-gray-400    p-[1px]" rowSpan={3}>
                  <div className="flex items-center justify-center border-2 border-white hover:border-black rounded-sm py-3 h-[120px] w-full">
                    <textarea
                      name="courseCode"
                      value={course.courseCode}
                      onChange={(e) => handleCourseChange(index, 'courseCode', e.target.value)}
                      rows={4}
                      className=" w-full  text-left  outline-none  p-2 overflow-hidden  resize-none  rounded-sm "
                      placeholder="Type here..."
                    />
                  </div>
                </td>
                <td className=" border border-gray-400    p-[1px]" rowSpan={3}>
                  <div className="flex items-center justify-center border-2 border-white hover:border-black rounded-sm py-3 h-[120px] w-full">
                    <textarea
                      name="courseName"
                      value={course.courseName}
                      onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                      rows={4}
                      className=" w-full  text-left  outline-none  p-2 overflow-hidden  resize-none  rounded-sm "
                      placeholder="Type here..."
                    />
                  </div>
                </td>
                <td className="border border-gray-400 py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="year"
                    value={course.year}
                    onChange={(e) => handleCourseChange(index, 'year', Number(e.target.value))}
                  />
                </td>
                <td className="border text-center border-gray-400 py-0 px-[0.5px] ">
                  <input
                    className=" border-2 text-center border-white hover:border-black rounded-sm  py-2 w-full"
                    type="text"
                    placeholder="-"
                    value={course.theoreticalType}
                    onChange={(e) => handleCourseChange(index, 'theoreticalType', e.target.value)}
                  />
                </td>
                <td className="border border-gray-400 p-0 ">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.theoreticalFullMarks}
                    onChange={(e) => handleCourseChange(index, 'theoreticalFullMarks', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={studentMarks[index]?.theoretical || 0}
                    onChange={(e) => handleSum(index, 'theoretical', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.theoreticalCredit}
                    onChange={(e) => handleCourseChange(index, 'theoreticalCredit', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.theoreticalCreditPointsObtained}
                    onChange={(e) => handleCourseChange(index, 'theoreticalCreditPointsObtained', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  px-2" rowSpan={3}>
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm   py-2 w-full"
                    type="text"
                    placeholder="-"
                    value={course.theoreticalGrade}
                    onChange={(e) => handleCourseChange(index, 'theoreticalGrade', e.target.value)}
                  />
                </td>
                <td className="border border-gray-400  px-2" rowSpan={3}>
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm   py-2 w-full"
                    type="text"
                    placeholder="-"
                    value={course.theoreticalStatus}
                    onChange={(e) => handleCourseChange(index, 'theoreticalStatus', e.target.value)}
                  />
                </td>
                <td className="border border-gray-400  text-center p-3" rowSpan={3}>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteRow(index)}
                  >
                    <Delete></Delete>
                  </button>
                </td> {/* Delete button */}
              </tr>
              <tr className="text-center">
                <td className="border border-gray-400 py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="year"
                    value={course.year}
                    onChange={(e) => handleCourseChange(index, 'year', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  ">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm py-2 w-full"
                    type="text"
                    placeholder="-"
                    value={course.practicalType}
                    onChange={(e) => handleCourseChange(index, 'practicalType', e.target.value)}
                  />
                </td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.practicalFullMarks}
                    onChange={(e) => handleCourseChange(index, 'practicalFullMarks', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={studentMarks[index]?.practical || 0}
                    onChange={(e) => handleSum(index, 'practical', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.practicalCredit}
                    onChange={(e) => handleCourseChange(index, 'practicalCredit', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400  py-0 px-[0.5px]">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.practicalCreditPointsObtained}
                    onChange={(e) => handleCourseChange(index, 'practicalCreditPointsObtained', Number(e.target.value))}
                  />
                </td>
              </tr>
              <tr className="font-semibold text-center">
                <td className="border border-gray-400 p-0" colSpan={2}>
                  Total
                </td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.totalFullMarks}
                    onChange={(e) => handleCourseChange(index, 'totalFullMarks', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 p-0">{studentMarks[index].sum}</td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.totalCredit}
                    onChange={(e) => handleCourseChange(index, 'totalCredit', Number(e.target.value))}
                  />
                </td>
                <td className="border border-gray-400 p-0">
                  <input
                    className="text-center border-2 border-white hover:border-black rounded-sm pl-4 pr-1 py-2 w-full"
                    type="number"
                    placeholder="-"
                    value={course.totalCreditPointsObtained}
                    onChange={(e) => handleCourseChange(index, 'totalCreditPointsObtained', Number(e.target.value))}
                  />
                </td>
              </tr>
            </React.Fragment>
          ))}

          <tr className="text-center font-bold">
            <td className="border border-gray-400 p-2" colSpan={4}>Grand Total</td>
            <td className="border border-gray-400 p-2">525</td>
            <td className="border border-gray-400 p-2">296</td>
            <td className="border border-gray-400 p-2">21</td>
            <td className="border border-gray-400 p-2">118,398</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center font-semibold" colSpan={11}>
              Semester Grade Point Average (SGPA) : 5,638
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 text-left font-semibold p-2" colSpan={11}>
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
      <div className="p-0 mt-4">
        <button
          className="print:hidden bg-black text-white px-4 py-2 rounded"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default GradeCard;