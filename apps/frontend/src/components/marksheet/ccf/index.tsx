/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import Header from "./Header";
import { SubjectMetadata } from "@/types/academics/subject-metadata";
import { useQuery } from "@tanstack/react-query";
import { getSubjectMetadataByFilters } from "@/services/subject-metadata";
import { useParams } from "react-router-dom";
import Footer from "./Footer";
import { Input } from "@/components/ui/input";
import { Marksheet } from "@/types/academics/marksheet";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user/user";
import { Subject } from "@/types/academics/subject";
import InputInitials from "./InputInitials";
import { getSearchedStudentsByRollNumber } from "@/services/student";
import { Student } from "@/types/user/student";
import { Framework } from "@/types/enums";
import { previousDay } from "date-fns";

const columns = [
  "Course Code (Course Type)",
  "Year",
  "Course Component",
  "Full Marks",
  "Marks Obtained",
  "Credit",
  "Grade",
  "Status",
];

const MarksheetCCF = () => {
  const { user } = useAuth();
  const { framework, rollNumber, marksheetId } = useParams();

  const [subjectMetadataArr, setSubjectMetadataArr] = useState<SubjectMetadata[]>([]);
  const [marksheet, setMarksheet] = useState<Marksheet | null>();
  const [student, setStudent] = useState<Student | null>();

  useQuery({
    queryKey: ["rollNumber"],
    queryFn: async () => {
      const response = await getSearchedStudentsByRollNumber(1, 1, rollNumber as string);
      if (response.payload.content.length === 0) {
        setStudent(null);
      }
      setStudent(response.payload.content[0]);
      setMarksheet((prev) => {
        if (prev) {
          return { ...prev, name: student?.name as string };
        }
        return prev;
      });

      return response.payload;
    },
  });

  useEffect(() => {
    // Fetch marksheet data if marksheetId is present
    if (marksheetId && marksheetId !== "new") {
      // fetch marksheet data
    } else {
      // create new marksheet
      const newMarksheet: Marksheet = {
        studentId: 0,
        year: 0,
        cgpa: null,
        classification: null,
        semester: 1,
        sgpa: null,
        remarks: null,
        source: "ADDED",
        file: null,
        createdByUser: user as User,
        updatedByUser: user as User,
        createdAt: new Date(),
        updatedAt: new Date(),
        subjects: [],
        name: student?.name as string,
        academicIdentifier: {
          rollNumber: rollNumber as string,
          studentId: 0,
          frameworkType: framework as Framework,
          rfid: null,
          stream: null,
          course: null,
          section: "",
          classRollNumber: null,
          apaarId: null,
          abcId: null,
          apprid: null,
          checkRepeat: false,
          cuFormNumber: null,
          uid: null,
          oldUid: null,
          registrationNumber: "",
        },
      };

      setMarksheet((prev) => ({ ...prev, ...newMarksheet }));
    }
  }, []);

  useQuery({
    queryKey: ["subjectMetadata"],
    queryFn: async () => {
      const response = await getSubjectMetadataByFilters({
        streamId: 2,
        course: "HONOURS",
        semester: 1,
        framework: framework as "CCF" | "CBCS",
      });
      setSubjectMetadataArr(response.payload);

      const subjects = response.payload.map((sbj) => {
        return {
          subjectId: sbj.id,
          fullMarks: sbj.fullMarks,
          credit: sbj.credit,
          grade: null,
          status: null,
          marksObtained: 0,
          internalMarks: null,
          practicalMarks: null,
          marksheetId: null,
          subjectMetadata: sbj,
          year1: new Date().getFullYear(),
          year2: new Date().getFullYear(),
          tutorialMarks: null,
          theoryMarks: null,
          totalMarks: null,
          ngp: null,
          tgp: null,
          letterGrade: null,
        } as Subject;
      });

      setMarksheet((prev) => {
        if (prev) {
          return {
            ...prev,
            subjects,
          };
        }
        return prev;
      });

      return response.payload;
    },
  });

  return (
    <div className=" w-full h-full overflow-auto">
      <Header />
      <div className="w-[1240px]">
        <InputInitials marksheet={marksheet} />
        <div className="w-full border border-gray-300 shadow-sm rounded-lg">
          {/* Table Header */}
          <div className="grid grid-cols-8 bg-gray-100 text-gray-700 border-b border-gray-300 font-semibold">
            {columns.map((column, index) => (
              <div key={index} className="p-3 text-center border-r border-gray-300 last:border-r-0">
                {column}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-300">
            {marksheet?.subjects.map((subject, index) => (
              <div key={index} className="grid grid-cols-8 text-center ">
                {/* Course Code */}
                <div className="border-r border-gray-300 font-semibold">
                  <p>{subject.subjectMetadata.name}</p>
                  {subject.subjectMetadata.subjectType?.name && (
                    <p className="text-sm text-gray-500">({subject.subjectMetadata.subjectType?.name})</p>
                  )}
                </div>

                {/* Year Input Fields */}
                <div className="border-r border-gray-300">
                  <Input className="rounded w-full text-center border-none border-b" value={subject.year1} />
                  <Input
                    className="rounded w-full text-center border-t border-l-0 border-r-0 border-b "
                    value={subject.year2 as number}
                  />
                  <Input className="invisible rounded w-full border-gray-300" />
                </div>

                {/* Course Component */}
                <div className="border-r border-gray-300">
                  <div className="text-left h-full">
                    <p className="flex items-center px-2 h-1/3">Theory</p>
                    <p className="flex items-center px-2 h-1/3 border-t border-b border-gray-300">Practical</p>
                    <p className="flex items-center justify-end px-2 h-1/3 font-semibold uppercase text-right">Total</p>
                  </div>
                </div>

                {/* Full Marks */}
                <div className="border-r border-gray-300">
                  <div className="h-full">
                    <p className="flex justify-center items-center px-2 h-1/3">
                      {subject.subjectMetadata.fullMarksTheory}
                    </p>
                    <p className="flex justify-center items-center px-2 h-1/3 border-t border-b border-gray-300">
                      {subject.subjectMetadata.fullMarksPractical}
                    </p>
                    <p className="flex items-center justify-center font-semibold px-2 h-1/3 text-right">
                      {subject.subjectMetadata.fullMarks}
                    </p>
                  </div>
                </div>

                {/* Marks Obtained */}
                <div className="border-r border-gray-300">
                  <Input
                    className="rounded w-full text-center border-none border-b"
                    value={subject.theoryMarks as string}
                  />
                  <Input
                    className="rounded w-full text-center border-r-0 border-l-0"
                    value={subject.practicalMarks as string}
                  />
                  <p className="flex items-center justify-center font-semibold px-2 h-1/3 text-right">0</p>
                </div>

                {/* Credit */}
                <div className="border-r border-gray-300 flex justify-center items-center">
                  <p className="flex items-center justify-center font-semibold px-2 h-1/3 text-right">
                    {subject.subjectMetadata.credit}
                  </p>
                </div>

                {/* Grade */}
                <div className="border-r border-gray-300 flex justify-center items-center">{subject.letterGrade}</div>

                {/* Status */}
                <div className="border-r border-gray-300 flex justify-center items-center">{subject.status}</div>
              </div>
            ))}
            <div className="grid grid-cols-8 font-medium uppercase">
              <div className="flex items-center gap-2  justify-end border-r col-span-4">
                <p className="font-semibold text-right p-2">Grand Total:</p>
              </div>
              <div className="flex items-center justify-center border-r">
                <p className="p-2">{"TODO"}</p>
              </div>
              <div className="flex items-center justify-center gap-2 border-r">
                <p className="p-2">0</p>
              </div>
              <div className="flex items-center justify-center gap-2  border-r">
                <p className="p-2"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer onSave={() => {}} />
    </div>
  );
};

export default MarksheetCCF;
