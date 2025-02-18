import React, { useState } from 'react';

const GradeCard: React.FC = () => {
  // State for user inputs
  const [name, setName] = useState<string>('ADITYA RAJ');
  const [registrationNo, setRegistrationNo] = useState<string>('017-1111-0673-23');
  const [rollNo, setRollNo] = useState<string>('233017-21-0003');

  return (
    <div className="p-4 bg-white font-sans">
      {/* Header Section */}
      <div className="text-center mb-4">
        <div className="font-bold text-lg">UNIVERSITY OF CALCUTTA</div>
        <div className="font-bold text-lg">Grade Card</div>
        <div className="text-sm">
          Four Year B.Sc. Semester - I Examination, 2023 (Under CCF, 2022)
          <br />
          (Vide CSR/05/2023 dt. 23/06/2023 & CSR/45/2023 dt. 18/12/2023)
        </div>
      </div>

      {/* Input Fields for Name, Registration No., and Roll No. */}
      <div className="mb-4">
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2">
            <span className="font-semibold">Name:</span>
            <input
              type="text"
              className="border border-gray-300 p-1 rounded w-40"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-semibold">Registration No.:</span>
            <input
              type="text"
              className="border border-gray-300 p-1 rounded w-40"
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-semibold">Roll No.:</span>
            <input
              type="text"
              className="border border-gray-300 p-1 rounded w-40"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Table Section */}
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2">Course Code (Course Type)</th>
            <th className="border border-gray-400 p-2">Course Name</th>
            <th className="border border-gray-400 p-2">Year</th>
            <th className="border border-gray-400 p-2">Course Component</th>
            <th className="border border-gray-400 p-2">Full Marks</th>
            <th className="border border-gray-400 p-2">Marks Obtained</th>
            <th className="border border-gray-400 p-2">Credit</th>
            <th className="border border-gray-400 p-2">Credit Points Obtained</th>
            <th className="border border-gray-400 p-2">Grade</th>
            <th className="border border-gray-400 p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {/* Chemistry Course */}
          <tr>
            <td className=" p-2">CEMM-DSCC-1 (Discipline Specific Core Course)</td>
            <td className="border border-b-0 border-r-gray-400 border-l-gray-400 p-2">FUNDAMENTALS OF CHEMISTRY-I</td>
            <td className="border border-gray-400 p-2">2023</td>
            <td className="border border-gray-400 p-2">Theoretical</td>
            <td className="border border-gray-400 p-2">75</td>
            <td className="border border-gray-400 p-2">30</td>
            <td className="border border-gray-400 p-2">3</td>
            <td className="border border-gray-400 p-2">12,000</td>
            <td className="border border-gray-400 p-2">C+</td>
            <td className="border border-gray-400 p-2">P</td>
          </tr>
          <tr>
            <td  colSpan={2}></td>

            <td className="border border-gray-400 p-2">2023</td>
            <td className="border border-gray-400 p-2">Practical</td>
            <td className="border border-gray-400 p-2">25</td>
            <td className="border border-gray-400 p-2">19</td>
            <td className="border border-gray-400 p-2">1</td>
            <td className="border border-gray-400 p-2">7,600</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>
          <tr>
            <td className="" colSpan={2}></td>

            <td className="border border-gray-400 p-2" colSpan={2}>Total</td>
           
            <td className="border border-gray-400 p-2">100</td>
            <td className="border border-gray-400 p-2">49</td>
            <td className="border border-gray-400 p-2">4</td>
            <td className="border border-gray-400 p-2">19,600</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>

          {/* Quantitative Analysis Course */}
          <tr>
            <td className="border border-gray-400 p-2">CEMM-SEC-1 (Skill Enhancement Course)</td>
            <td className="border border-gray-400 p-2">QUANTITATIVE ANALYSIS AND BASIC LABORATORY PRACTICES</td>
            <td className="border border-gray-400 p-2">2023</td>
            <td className="border border-gray-400 p-2">Theoretical</td>
            <td className="border border-gray-400 p-2">75</td>
            <td className="border border-gray-400 p-2">34</td>
            <td className="border border-gray-400 p-2">3</td>
            <td className="border border-gray-400 p-2">13,599</td>
            <td className="border border-gray-400 p-2">B</td>
            <td className="border border-gray-400 p-2">P</td>
          </tr>
          <tr>
            <td className="" colSpan={2}></td>
            <td className="border border-gray-400 p-2">2023</td>
            <td className="border border-gray-400 p-2">Tutorial</td>
            <td className="border border-gray-400 p-2">25</td>
            <td className="border border-gray-400 p-2">20</td>
            <td className="border border-gray-400 p-2">1</td>
            <td className="border border-gray-400 p-2">8,000</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>
          <tr>
          
          <td className=" p-2" colSpan={2}></td>
           <td className="border border-gray-400 p-2" colSpan={2}>Total</td>

            <td className="border border-gray-400 p-2">100</td>
            <td className="border border-gray-400 p-2">54</td>
            <td className="border border-gray-400 p-2">4</td>
            <td className="border border-gray-400 p-2">21,599</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>

          {/* Grand Total Row */}
          <tr>
            <td className="border border-gray-400 p-2" colSpan={4}>Grand Total</td>
            <td className="border border-gray-400 p-2">525</td>
            <td className="border border-gray-400 p-2">296</td>
            <td className="border border-gray-400 p-2">21</td>
            <td className="border border-gray-400 p-2">118,398</td>
            <td className="border border-gray-400 p-2"></td>
            <td className="border border-gray-400 p-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="text-sm mt-4">
        Semester Grade Point Average (SGPA) : 5,638
      </div>
      <div className="text-sm mt-2">
        Remarks : Semester Cleared
      </div>
      <div className="text-sm mt-4">
        Abbreviations
        <br />
        P : Passed in the Course, F : Failed in the Course,
        <br />
        F(TH) : Failed in Theoretical, F(PR) : Failed in Practical, F(TU) : Failed in Tutorial,
        <br />
        AB : Absent, +1 : Grace Mark, EC : Examination Cancelled,
        <br />
        ECDB1 : Debarment for 1 year, ECDB2 : Debarment for 2 year,
        <br />
        N.A. : Not Applicable
      </div>
      <div className="text-sm mt-4">
        SL No. CCF_UG(ASC) 024/0006592 CONTROLLER OF EXAMINATIONS
      </div>
    </div>
  );
};

export default GradeCard;