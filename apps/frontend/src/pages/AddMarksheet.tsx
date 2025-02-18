import { useState } from "react";

export const AddMarksheet = () => {
  const [rows, setRows] = useState([
    {
      id: 1,
      paperCode: "CE1.1CH0",
      fullMarks: 100,
      year: "",
      internalMarks: "",
      Year: "",
      endSemesterMarks: "",
      totalMarks: "",
      letterGrade: "",
      gradePoint: "",
      credit: "",
      totalGradePoint: "",
    },
    {
      id: 2,
      paperCode: "CC1.1CH0",
      fullMarks: 100,
      year: "",
      internalMarks: "",
      Year: "",
      endSemesterMarks: "",
      totalMarks: "",
      letterGrade: "",
      gradePoint: "",
      credit: "",
      totalGradePoint: "",
    },
    {
      id: 3,
      paperCode: "CC1.2CH0",
      fullMarks: 100,
      year: "",
      internalMarks: "",
      Year: "",
      endSemesterMarks: "",
      totalMarks: "",
      letterGrade: "",
      gradePoint: "",
      credit: "",
      totalGradePoint: "",
    },
    {
      id: 4,
      paperCode: "CC1.1CH",
      fullMarks: 100,
      year: "",
      internalMarks: "",
      Year: "",
      endSemesterMarks: "",
      totalMarks: "",
      letterGrade: "",
      gradePoint: "",
      credit: "",
      totalGradePoint: "",
    },
  ]);

  // Function to add a new row
  const addRow = () => {
    const newRow = {
      id: rows.length + 1, // Unique ID for the new row
      paperCode: "",
      fullMarks: "",
      year: "",
      internalMarks: "",
      endSemesterMarks: "",
      totalMarks: "",
      letterGrade: "",
      gradePoint: "",
      credit: "",
      totalGradePoint: "",
    };
    setRows([...rows, newRow]);
  };

  // Function to delete a row
  const deleteRow = (id) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="p-4 font-sans">
      {/* Add Button */}
      <div className="mt-4 flex justify-end">
        <button onClick={addRow} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Add Row
        </button>
      </div>

      {/* Header Section */}
      <div className="border-2 border-black mt-4">
        <div className="grid grid-cols-1">
          <div className="p-1 border-black bg-gray-300">
            <h1 className="text-xl font-bold text-center">UNIVERSITY OF CALCUTTA</h1>
          </div>
          <div className="p-1 bg-gray-300">
            <h2 className="text-lg text-center">STATEMENT OF MARKS OBTAINED BY</h2>
          </div>
        </div>
      </div>

      {/* Student Info Section */}
      <div className="mt-1 border-2 border-black">
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm">
              <span className="font-bold">Name:</span> AAKANKSHA
            </p>
          </div>
          <div className="p-1">
            <p className="text-sm">
              <span className="font-bold">Roll No:</span> 171017-11-0001
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm">
              <span className="font-bold">Registration No:</span> 017-1211-1334-17
            </p>
          </div>
          <div className="p-1">{/* Empty cell */}</div>
        </div>

        <div className="grid grid-cols-2">
          <div className="p-1 border-r-2 border-black">
            <h3 className="font-bold text-sm">
              Examination: B.COM 1st SEMESTER (HONOURS) EXAMINATION UNDER CBCS)-2017
            </h3>
          </div>
          <div className="p-1">{/* Empty cell */}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="mt-4">
        <table className="border-collapse border border-black w-full">
          <thead>
            <tr className="bg-gray-200">
              {[
                "Paper Code",
                "Full Marks",
                "Year",
                "Internal Marks",
                "Year",
                "End Semester",
                "Total Marks",
                "Letter Grade",
                "Grade Point",
                "Credit",
                "Total Point",
                "Action", // New column for delete button
              ].map((header, idx) => (
                <th key={idx} className="border border-black p-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border border-black">
                <td className="border border-black p-2 w-[9%]">
                  <select
                    defaultValue={row.paperCode}
                    className="w-full text-center border-none bg-transparent outline-none"
                  >
                    <option value="CE1.1CH0">CE1.1CH0</option>
                    <option value="CE1.2CH1">CE1.2CH1</option>
                    <option value="CE1.3CH2">CE1.3CH2</option>
                    <option value="CE1.4CH3">CE1.4CH3</option>
                    <option value="CE1.5CH4">CE1.5CH4</option>
                  </select>
                </td>
                <td className="border border-black p-2">
                  <input type="number" defaultValue={row.fullMarks} className="w-full text-center" />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.year}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.internalMarks}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.Year}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.endSemesterMarks}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.totalMarks}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    defaultValue={row.letterGrade}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.gradePoint}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.credit}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                <td className="border border-black p-2">
                  <input
                    type="number"
                    defaultValue={row.totalGradePoint}
                    className="w-full text-center bg-transparent border-none outline-none p-1"
                  />
                </td>
                {/* Delete Button */}
                <td className="border border-black p-2">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="400" className="w-full text-center border-none" />
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="" className="w-full text-center" />
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="" className="w-full text-center" />
              </td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="" className="w-full text-center" />
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="" className="w-full text-center" />
              </td>
              <td className="border border-black p-2">
                <input type="number" defaultValue="" className="w-full text-center" />
              </td>
              <td className="border border-black p-2"></td> {/* Empty cell for delete button column */}
            </tr>
          </tbody>
        </table>
      </div>

      {/* SGPA Section */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-2">
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm font-bold text-center">SGPA:</p>
          </div>
          <div className="p-1">
            <p className="text-sm text-center">5.600</p>
          </div>
        </div>
      </div>

      {/* AECC Sections */}
      <div className="border-2 border-black">
        {/* AECC 1.1chg (Language) Section */}
        <div className="grid grid-cols-6 border-b-2 border-black">
          <div className="p-1 border-r-2 border-black">
            <h4 className="text-sm font-bold text-center">AECC 1.1chg (Language)</h4>
          </div>
          <div className="p-1 border-r-2 border-black">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm">50</p>
              <p className="text-sm">50</p>
            </div>
          </div>
          <div className="p-1 border-r-2 border-black">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm">2017</p>
              <p className="text-sm">2017</p>
            </div>
          </div>
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm text-center">Communicative English Indian Language (English)</p>
          </div>
          <div className="p-1 border-r-2 border-black">
            <div className="flex flex-col justify-center items-center">
              <p>Marks Obtained</p>
              <p className="text-sm">28</p>
              <p className="text-sm">23</p>
            </div>
          </div>
          <div className="p-1">
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm">Credit</p>
              <p className="text-sm">2</p>
            </div>
          </div>
        </div>

        {/* AECC 6.1chg Environmental Studies Section */}
        <div className="grid grid-cols-6">
          <div className="p-1 border-r-2 border-black">
            <h4 className="text-sm font-bold text-center">AECC 6.1chg Environmental Studies</h4>
          </div>
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm"></p>
          </div>
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm"></p>
          </div>
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm text-center">Environmental Studies</p>
          </div>
          <div className="p-1 border-r-2 border-black">
            <p className="text-sm"></p>
          </div>
          <div className="p-1">
            <p className="text-sm"></p>
          </div>
        </div>
      </div>

      {/* Semester Table */}
      <div>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              {[
                "Semester",
                "Year",
                "Full Marks",
                "Obtained Marks",
                "Semester Credit",
                "SGPA",
                "Cumulative Credit",
                "CGPA",
                "Letter Grade",
                "Remarks",
              ].map((header, idx) => (
                <th key={idx} className="border border-black p-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["I", "II", "III", "IV", "V", "VI"].map((semester) => (
              <tr key={semester}>
                <td className="border border-black p-2 text-center">{semester}</td>
                {Array(9)
                  .fill()
                  .map((_, idx) => (
                    <td key={idx} className="border border-black p-2 text-center">
                      <input type="number" className="w-full text-center bg-transparent border-none outline-none p-1" />
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remarks Section */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-2">
          <div className="p-1 border-r-2 border-black bg-gray-200">
            <p className="text-sm font-bold text-center">Remarks:</p>
          </div>
          <div className="p-1 bg-gray-200">
            <p className="text-sm text-center font-bold">Qualified & Promoted to Second Semester.</p>
          </div>
        </div>
      </div>

      {/* Save and Next Buttons */}
      <div className="flex justify-between mt-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save</button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Next</button>
      </div>
    </div>
  );
};

export default AddMarksheet;
