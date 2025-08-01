import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Marksheet } from "@/types/academics/marksheet";
import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { DegreeLevel } from "@/types/resources/degree.types";
// import { Subject } from "@/types/academics/subject";

// const ROWS_PER_PAGE = 10;

// Dummy mock data

function downloadCSV(rows: Record<string, unknown>[]) {
  const columns = [
    "ID", "Registration No.", "Name", "Subject", "Paper Code", "Semester", "Degree", "Course", "Academic Year", "Year 1", "Year 2", "Roll No.", "UID", "Framework", "Specialization", "Shift", "Section", "SGPA", "CGPA", "Classification", "Status", "Grade", "Remarks", "Internal (Obtained/Full)", "Practical (Obtained/Full)", "Theory (Obtained/Full)", "Viva (Obtained/Full)", "Project (Obtained/Full)", "Total (Obtained/Full)"
  ];
  const csvRows = [
    columns.join(","),
    ...rows.map((row) => [
      row.id,
      row.registration_no,
      row.name,
      row.subject,
      row.paperCode,
      row.semester,
      row.degree,
      row.course,
      row.academic_year,
      row.year1,
      row.year2,
      row.roll_no,
      row.uid,
      row.framework,
      row.specialization,
      row.shift,
      row.section,
      row.sgpa,
      row.cgpa,
      row.classification,
      row.status,
      row.grade,
      row.remarks,
      row.internal,
      row.practical,
      row.theory,
      row.viva,
      row.project,
      row.total,
    ].join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "marksheets.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Dummy API response for demonstration
const dummyApiResponse: ApiResonse<PaginatedResponse<Marksheet>> = {
  httpStatusCode: 200,
  httpStatus: "OK",
  message: "Success",
  payload: {
    content: [
      {
        id: 1,
        studentId: 1,
        semester: 1,
        academicYear: {
          id: 1,
          year: "2023-2024",
          isCurrentYear: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        sgpa: 8.5,
        cgpa: 8.2,
        classification: "First Class",
        remarks: "Excellent",
        createdAt: new Date(),
        updatedAt: new Date(),
        source: "ADDED",
        file: null,
        createdByUser: {
          id: 1,
          name: "Admin",
          email: "admin@example.com",
          phone: "1234567890",
          whatsappNumber: undefined,
          image: undefined,
          type: "ADMIN",
          disabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        updatedByUser: {
          id: 1,
          name: "Admin",
          email: "admin@example.com",
          phone: "1234567890",
          whatsappNumber: undefined,
          image: undefined,
          type: "ADMIN",
          disabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        name: "Amit Kumar",
        academicIdentifier: {
          id: 1,
          studentId: 1,
          framework: "CCF",
          shift: null,
          rfid: null,
          course: null,
          cuFormNumber: null,
          uid: "UID2023001",
          oldUid: null,
          registrationNumber: "REG2023001",
          rollNumber: "R2023001",
          section: null,
          classRollNumber: null,
          apaarId: null,
          abcId: null,
          apprid: null,
          checkRepeat: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        subjects: [
          {
            id: 1,
            marksheetId: 1,
            subjectMetadata: {
              id: 1,
              name: "Physics",
              marksheetCode: "PHY101",
              degree: {
                id: 1,
                name: "BSc Physics",
                level: DegreeLevel.UNDER_GRADUATE,
                sequence: 1,
                disabled: false,
              },
              programmeType: "HONOURS",
              framework: "CCF",
              class: null,
              specialization: null,
              category: "HONOURS",
              subjectType: null,
              irpName: null,
              irpCode: null,
              isOptional: false,
              credit: 4,
              theoryCredit: 4,
              fullMarksTheory: 50,
              practicalCredit: 4,
              fullMarksPractical: 30,
              internalCredit: 4,
              fullMarksInternal: 20,
              projectCredit: 2,
              fullMarksProject: 20,
              vivalCredit: 2,
              fullMarksViva: 10,
              fullMarks: 100,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            year1: 2023,
            year2: 2024,
            internalMarks: "18",
            practicalMarks: "28",
            tutorialMarks: null,
            theoryMarks: "45",
            totalMarks: 91,
            status: "PASS",
            ngp: 8,
            tgp: 8,
            letterGrade: "A",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      // Add more Marksheet objects as needed for demo
    ],
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalElements: 1,
  },
};

// Helper to get unique values from marksheetRows
const getUnique = (arr: Record<string, unknown>[], key: string) => {
  return Array.from(new Set(arr.map((row) => (row[key] as string | number) ?? "").filter(Boolean)));
};

export default function HomePage() {
  // Simulate API state
  const [apiData, setApiData] = useState<ApiResonse<PaginatedResponse<Marksheet>> | null>(null);
  const [page, setPage] = useState(1);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterProgramme, setFilterProgramme] = useState<string>("all");

  useEffect(() => {
    // Simulate API fetch
    setApiData(dummyApiResponse);
  }, [page]);

  // Flatten marksheet/subject for table rows
  const marksheetRows = (apiData?.payload.content ?? []).flatMap((m) =>
    m.subjects.map((s) => ({
      id: m.id,
      registration_no: m.academicIdentifier.registrationNumber,
      name: m.name,
      subject: s.subjectMetadata.name,
      paperCode: s.subjectMetadata.marksheetCode,
      semester: m.semester,
      degree: s.subjectMetadata.degree?.name,
      course: s.subjectMetadata.degree?.name,
      academic_year: m.academicYear.year,
      year1: s.year1,
      year2: s.year2,
      roll_no: m.academicIdentifier.rollNumber,
      uid: m.academicIdentifier.uid,
      framework: s.subjectMetadata.framework,
      specialization: s.subjectMetadata.specialization?.name,
      shift: "Morning",
      section: "A",
      sgpa: m.sgpa,
      cgpa: m.cgpa,
      classification: m.classification,
      status: s.status,
      grade: s.letterGrade,
      remarks: m.remarks,
      internal: `${s.internalMarks ?? "-"}/${s.subjectMetadata.fullMarksInternal ?? "-"}`,
      practical: `${s.practicalMarks ?? "-"}/${s.subjectMetadata.fullMarksPractical ?? "-"}`,
      theory: `${s.theoryMarks ?? "-"}/${s.subjectMetadata.fullMarksTheory ?? "-"}`,
      viva: `-/-`,
      project: `-/-`,
      total: `${s.totalMarks ?? "-"}/${s.subjectMetadata.fullMarks ?? "-"}`,
    }))
  );

  // Filtering logic for dropdowns
  const filteredRows = marksheetRows.filter((row) => {
    return (
      (filterYear === "all" || row.academic_year === filterYear) &&
      (filterCourse === "all" || row.course === filterCourse) &&
      (filterProgramme === "all" || row.framework === filterProgramme)
    );
  });

  const totalPages = apiData?.payload.totalPages ?? 1;
//   const currentPage = apiData?.payload.page ?? 1;

  // Grouped columns
  const columns = [
    { key: "id", label: "ID" },
    { key: "registration_no", label: "Reg No." },
    { key: "name", label: "Name" },
    { key: "subjectName", label: "Subject" },
    { key: "paperCode", label: "Paper Code" },
    { key: "semester", label: "Semester" },
    { key: "stream", label: "Degree" },
    { key: "course", label: "Course" },
    { key: "academic_year", label: "Academic Year" },
    { key: "year1", label: "Year-1" },
    { key: "year2", label: "Year-2" },
    { key: "roll_no", label: "Roll No." },
    { key: "uid", label: "UID" },
    { key: "framework", label: "Framework" },
    { key: "specialization", label: "Specialization" },
    { key: "shift", label: "Shift" },
    { key: "section", label: "Section" },
    { key: "sgpa", label: "SGPA" },
    { key: "cgpa", label: "CGPA" },
    { key: "classification", label: "Classification" },
    { key: "status", label: "Status" },
    { key: "grade", label: "Grade" },
    { key: "remarks", label: "Remarks" },
    // { key: "errorMessage", label: "Error" },
    // Grouped fields:
    { key: "internal", label: "Internal" },
    { key: "practical", label: "Practical" },
    { key: "theory", label: "Theory" },
    { key: "viva", label: "Viva" },
    { key: "project", label: "Project" },
    { key: "total", label: "Total" },
  ];

  // Dropdown options
  const academicYears = getUnique(marksheetRows, "academic_year");
  const courses = getUnique(marksheetRows, "course");
  const programmeTypes = ["CCF", "CBCS"];
    
  return (
    <div className="p-6">
      {/* Heading and Filters Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mr-4">Marksheet List</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterYear} onValueChange={v => { setFilterYear(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={String(course)}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProgramme} onValueChange={v => { setFilterProgramme(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Programme Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {programmeTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="ml-auto" onClick={() => downloadCSV(marksheetRows)}>
          Download CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg text-base">
          <thead className="bg-gradient-to-r from-violet-100 to-purple-100">
            <tr>
              {columns.map((col) => {
                // Sticky styles for Reg No. and Roll No.
                let stickyStyle = {};
                if (col.key === "registration_no") {
                  stickyStyle = {
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    background: "#f8f6ff",
                  };
                } else if (col.key === "roll_no") {
                  stickyStyle = {
                    position: "sticky",
                    left: 150, // min-w-[150px] for Reg No.
                    zIndex: 3,
                    background: "#f8f6ff",
                  };
                }
                return (
                  <th
                    key={col.key}
                    className="px-4 py-2 border border-gray-300 font-semibold text-gray-700 whitespace-nowrap min-w-[150px]"
                    style={stickyStyle}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-400">No marksheets found.</td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-50 transition`}
                >
                  {columns.map((col) => {
                    // Sticky styles for Reg No. and Roll No. cells
                    let stickyStyle = {};
                    if (col.key === "registration_no") {
                      stickyStyle = {
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        background: idx % 2 === 0 ? "#fff" : "#f6f6fa",
                      };
                    } else if (col.key === "roll_no") {
                      stickyStyle = {
                        position: "sticky",
                        left: 150, // min-w-[150px] for Reg No.
                        zIndex: 2,
                        background: idx % 2 === 0 ? "#fff" : "#f6f6fa",
                      };
                    }
                    if (col.key === "internal") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.internal ?? "-"}
                        </td>
                      );
                    }
                    if (col.key === "practical") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.practical ?? "-"}
                        </td>
                      );
                    }
                    if (col.key === "theory") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.theory ?? "-"}
                        </td>
                      );
                    }
                    if (col.key === "viva") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.viva ?? "-"}
                        </td>
                      );
                    }
                    if (col.key === "project") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.project ?? "-"}
                        </td>
                      );
                    }
                    if (col.key === "total") {
                      return (
                        <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                          {row.total ?? "-"}
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="px-4 py-2 border border-gray-200 whitespace-nowrap min-w-[150px] truncate" style={stickyStyle}>
                        {(row as Record<string, string | number>)[col.key] ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
