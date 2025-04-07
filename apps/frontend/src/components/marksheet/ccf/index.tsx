/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import Header from "./Header";
import { SubjectMetadata, SubjectType } from "@/types/academics/subject-metadata";
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
import { Stream } from "@/types/academics/stream";
import { InputBox } from "./InputBox";

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
          degreeProgramme: null,
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
  }, [framework, marksheetId, rollNumber, student, user]);

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

  function getLetterGrade(subject: Subject) {
    if (subject.totalMarks === null) {
      return null;
    }

    const foundSubjectMetadata = subject.subjectMetadata;

    if (!foundSubjectMetadata) {
      return null;
    }

    if (
      subject.internalMarks &&
      foundSubjectMetadata.fullMarksInternal &&
      calculatePercentage(Number(subject.internalMarks), foundSubjectMetadata.fullMarksInternal) < 30
    ) {
      return "F(IN)";
    }
    if (
      subject.practicalMarks &&
      foundSubjectMetadata.fullMarksPractical &&
      calculatePercentage(Number(subject.practicalMarks), foundSubjectMetadata.fullMarksPractical) < 30
    ) {
      return "F(PR)";
    }
    if (
      subject.theoryMarks &&
      foundSubjectMetadata.fullMarksTheory &&
      calculatePercentage(Number(subject.theoryMarks), foundSubjectMetadata.fullMarksTheory) < 30
    ) {
      return "F(TH)";
    }
    if (
      subject.tutorialMarks &&
      foundSubjectMetadata.fullMarksTutorial &&
      calculatePercentage(Number(subject.tutorialMarks), foundSubjectMetadata.fullMarksTutorial) < 30
    ) {
      return "F(TU)";
    }

    const subjectPercent = calculatePercentage(subject.totalMarks as number, foundSubjectMetadata?.fullMarks as number);

    if (subjectPercent >= 90 && subjectPercent <= 100) {
      return "A++";
    }
    if (subjectPercent >= 80 && subjectPercent < 90) {
      return "A+";
    }
    if (subjectPercent >= 70 && subjectPercent < 80) {
      return "A";
    }
    if (subjectPercent >= 60 && subjectPercent < 70) {
      return "B+";
    }
    if (subjectPercent >= 50 && subjectPercent < 60) {
      return "B";
    }
    if (subjectPercent >= 40 && subjectPercent < 50) {
      return "C+";
    }
    if (subjectPercent >= 30 && subjectPercent < 40) {
      return "C";
    }
    if (subjectPercent >= 0 && subjectPercent < 30) {
      return "F";
    }
  }

  //   async function getClassification(cgpa: number, studentId: number) {
  //     const marksheetList: MarksheetType[] = await findMarksheetsByStudentId(studentId);

  //     let isClearedSemester = false;
  //     for (let i = 0; i < 6; i++) {
  //       const marksheetObj = marksheetList.find((marksheet) => marksheet.semester == i + 1);
  //       if (!marksheetObj || !marksheetObj.sgpa) {
  //         isClearedSemester = false;
  //         break;
  //       }
  //       isClearedSemester = true;
  //     }

  //     if (!isClearedSemester) {
  //       return "Previous Semester not cleared";
  //     } else {
  //       if (cgpa >= 9 && cgpa <= 10) {
  //         return "Outstanding";
  //       } else if (cgpa >= 8 && cgpa < 9) {
  //         return "Excellent";
  //       } else if (cgpa >= 7 && cgpa < 8) {
  //         return "Very Good";
  //       } else if (cgpa >= 6 && cgpa < 7) {
  //         return "Good";
  //       } else if (cgpa >= 5 && cgpa < 6) {
  //         return "Average";
  //       } else if (cgpa >= 4 && cgpa < 5) {
  //         return "Fair";
  //       } else if (cgpa >= 3 && cgpa < 4) {
  //         return "Satisfactory";
  //       } else if (cgpa >= 0 && cgpa < 3) {
  //         return "Fail";
  //       }
  //     }
  //   }

  function getRemarks(
    marksheetPercent: number,
    stream: Stream,
    course: "HONOURS" | "GENERAL",
    semester: number,
    subjects: Subject[],
  ) {
    // Firstly check if all the subjects are got cleared, if not then return "Semester not cleared."
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      const subjectMetadata = subjects[i].subjectMetadata;

      if (
        subject.internalMarks &&
        subjectMetadata.fullMarksInternal &&
        calculatePercentage(Number(subject.internalMarks), subjectMetadata.fullMarksInternal) < 30
      ) {
        return "Semester not cleared.";
      }
      if (
        subject.practicalMarks &&
        subjectMetadata.fullMarksPractical &&
        calculatePercentage(Number(subject.practicalMarks), subjectMetadata.fullMarksPractical) < 30
      ) {
        return "Semester not cleared.";
      }
      if (
        subject.theoryMarks &&
        subjectMetadata.fullMarksTheory &&
        calculatePercentage(Number(subject.theoryMarks), subjectMetadata.fullMarksTheory) < 30
      ) {
        return "Semester not cleared.";
      }
      if (
        subject.tutorialMarks &&
        subjectMetadata.fullMarksTutorial &&
        calculatePercentage(Number(subject.tutorialMarks), subjectMetadata.fullMarksTutorial) < 30
      ) {
        return "Semester not cleared.";
      }
      if (subjects[i].totalMarks === null || subjects[i].totalMarks === -1) {
        return "Semester not cleared.";
      }

      const percentMarks = ((subjects[i].totalMarks as number) * 100) / subjects[i].subjectMetadata.fullMarks;

      if (percentMarks < 30) {
        return "Semester not cleared.";
      }
    }

    // Get the remarks by total_marks percentage
    if (marksheetPercent < 30) {
      // For failed marksheet
      return "Semester not cleared.";
    } else {
      // For passed marksheet
      if (semester != 6) {
        // For semester: 1, 2, 3, 4, 5
        return "Semester Cleared.";
      } else {
        // For semester: 6
        if (stream.degree.name.toUpperCase() !== "BCOM") {
          // For BA & BSC
          return "Qualified with Honours.";
        } else {
          // For BCOM
          if (course.toUpperCase() === "HONOURS") {
            // For honours
            return "Semester cleared with honours.";
          } else {
            // For general
            return "Semester cleared with general.";
          }
        }
      }
    }
  }

  function calculatePercentage(totalMarks: number, fullMarks: number) {
    return (totalMarks * 100) / fullMarks;
  }

  function calculateSGPA(marksheet: Marksheet) {
    let totalMarksObtained = 0,
      fullMarksSum = 0,
      ngp_credit = 0,
      creditSum = 0;
    for (let i = 0; i < marksheet.subjects.length; i++) {
      if (!marksheet.subjects[i].totalMarks) {
        continue; // If totalMarks is not present, then continue to the next subject
      }

      const subject = marksheet.subjects[i];

      const subjectMetadata = marksheet.subjects[i].subjectMetadata;

      if (
        subject.internalMarks &&
        subjectMetadata.fullMarksInternal &&
        calculatePercentage(Number(subject.internalMarks), subjectMetadata.fullMarksInternal) < 30
      ) {
        return null;
      }
      if (
        subject.practicalMarks &&
        subjectMetadata.fullMarksPractical &&
        calculatePercentage(Number(subject.practicalMarks), subjectMetadata.fullMarksPractical) < 30
      ) {
        return null;
      }
      if (
        subject.theoryMarks &&
        subjectMetadata.fullMarksTheory &&
        calculatePercentage(Number(subject.theoryMarks), subjectMetadata.fullMarksTheory) < 30
      ) {
        return null;
      }
      if (
        subject.tutorialMarks &&
        subjectMetadata.fullMarksTutorial &&
        calculatePercentage(Number(subject.tutorialMarks), subjectMetadata.fullMarksTutorial) < 30
      ) {
        return null;
      }

      const subjectPercent = ((subject.totalMarks as number) * 100) / subject.subjectMetadata.fullMarks;

      if (subjectPercent < 30) {
        console.log(`Subject Percentage: ${subjectPercent}`);
        return null; // If any subject is failed, return null immediately
      }

      if (marksheet.subjects[i].totalMarks) {
        totalMarksObtained += marksheet.subjects[i].totalMarks as number;
      }
      fullMarksSum += marksheet.subjects[i].subjectMetadata.fullMarks;

      if (!marksheet.subjects[i].subjectMetadata.credit || !marksheet.subjects[i].ngp) {
        continue;
      }
      ngp_credit += Number(marksheet.subjects[i].ngp) * (marksheet.subjects[i].subjectMetadata.credit as number);
      creditSum += marksheet.subjects[i].subjectMetadata.credit as number;
    }
    const marksheetPercent = (totalMarksObtained * 100) / fullMarksSum;
    if (marksheetPercent < 30) {
      return null;
    }
    console.log("Calculating SGPA...");
    return (ngp_credit / creditSum).toFixed(3);
  }

  //   async function calculateCGPA(studentId: number): Promise<number | null> {
  //     const marksheetList = await findMarksheetsByStudentId(studentId);

  //     const updatedMarksheetList: MarksheetType[] = [];

  //     // Step 1: Select and update all the passed marksheets
  //     for (let semester = 1; semester <= 6; semester++) {
  //       // Filter marksheets for the current semester
  //       const semesterWiseArr = marksheetList.filter((mks) => mks.semester === semester);

  //       if (semesterWiseArr.length === 0) {
  //         return null;
  //       }

  //       // Sort all the filtered marksheets by createdAt (assuming createdAt is a Date object)
  //       semesterWiseArr.sort((a, b) => new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime());

  //       let updatedSemesterMarksheet: MarksheetType = semesterWiseArr[0];

  //       for (let i = 0; i < semesterWiseArr.length; i++) {
  //         if (semesterWiseArr[i].sgpa) {
  //           // Student had cleared the semester
  //           updatedSemesterMarksheet = semesterWiseArr[i];
  //           continue;
  //         }
  //         // If student has not cleared the semester, then do go on updating the subjects upto recent status.
  //         const { subjects } = semesterWiseArr[i];
  //         for (let j = 0; j < subjects.length; j++) {
  //           updatedSemesterMarksheet.subjects = updatedSemesterMarksheet.subjects.map((sbj) => {
  //             if (subjects[j].subjectMetadata.id === sbj.subjectMetadata.id) {
  //               return subjects[j]; // Return the recent changes for the subject
  //             }
  //             return sbj; // Otherwise, return the existing state which are not changed
  //           });
  //         }
  //       }

  //       updatedMarksheetList.push(updatedSemesterMarksheet);
  //     }

  //     let sgpa_totalcredit = 0,
  //       creditSumAllSem = 0;

  //     for (let i = 1; i <= 6; i++) {
  //       const marksheet = marksheetList.find((obj) => obj.semester == i);
  //       if (!marksheet) {
  //         return null;
  //       }
  //       const sgpa = formatMarks(marksheet.sgpa as string) as number;
  //       const totalCredit = calculateTotalCredit(marksheet);
  //       sgpa_totalcredit += sgpa * totalCredit;
  //       creditSumAllSem += totalCredit;
  //     }

  //     // Return the cgpa
  //     return parseFloat((sgpa_totalcredit / creditSumAllSem).toFixed(3));
  //   }

  function formatMarks(marks: string | null): number | null {
    console.log(marks);
    if (!marks) {
      return null;
    }

    if (marks.toString().trim() === "") {
      return null;
    }

    if (marks.toString().toUpperCase() === "AB") {
      return -1;
    }

    const tmpMarks = Number(marks);
    return isNaN(tmpMarks) ? null : tmpMarks;
  }

  function calculateTotalCredit(marksheet: Marksheet) {
    let totalCredit = 0;
    for (let i = 0; i < marksheet.subjects.length; i++) {
      if (!marksheet.subjects[i].subjectMetadata.credit) {
        continue;
      }

      totalCredit += marksheet.subjects[i].subjectMetadata.credit as number;
    }

    return totalCredit;
  }

  return (
    <div className=" w-full h-full overflow-auto text-xs">
      <Header />
      <div className="w-[1000px]">
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
                    {subject.subjectMetadata.fullMarksTutorial && (
                      <p className="flex items-center px-2 h-1/3 border-t border-b border-gray-300">Tutorial</p>
                    )}
                    {subject.subjectMetadata.fullMarksPractical && (
                      <p className="flex items-center px-2 h-1/3 border-t border-b border-gray-300">Practical</p>
                    )}
                    <p className="flex items-center justify-end px-2 h-1/3 font-semibold uppercase text-right">Total</p>
                  </div>
                </div>

                {/* Full Marks */}
                <div className="border-r border-gray-300">
                  <div className="h-full">
                    {subject.subjectMetadata.fullMarksTheory && (
                      <p className="flex justify-center items-center px-2 h-1/3">
                        {subject.subjectMetadata.fullMarksTheory}
                      </p>
                    )}
                    {subject.subjectMetadata.fullMarksTutorial && (
                      <p className="flex justify-center items-center px-2 h-1/3 border-t border-b border-gray-300">
                        {subject.subjectMetadata.fullMarksTutorial}
                      </p>
                    )}
                    {subject.subjectMetadata.fullMarksPractical && (
                      <p className="flex justify-center items-center px-2 h-1/3 border-t border-b border-gray-300">
                        {subject.subjectMetadata.fullMarksPractical}
                      </p>
                    )}
                    <p className="flex items-center justify-center font-semibold px-2 h-1/3 text-right">
                      {subject.subjectMetadata.fullMarks}
                    </p>
                  </div>
                </div>

                {/* Marks Obtained */}
                <div className="border-r border-gray-300">
                  {subject.subjectMetadata.fullMarksTheory && (
                    <div className="h-1/3">
                      <InputBox fullMarks={subject.subjectMetadata.fullMarksTheory} />
                    </div>
                  )}
                  {subject.subjectMetadata.fullMarksTutorial && (
                    <div className="border-t border-b h-1/3 w-full">
                      <InputBox fullMarks={subject.subjectMetadata.fullMarksTutorial} />
                    </div>
                  )}
                  {subject.subjectMetadata.fullMarksPractical && (
                    <div className="border-t border-b h-1/3 w-full">
                      <InputBox fullMarks={subject.subjectMetadata.fullMarksPractical} />
                    </div>
                  )}
                  {/* <Input
                    className="rounded w-full text-center border-none border-b"
                    value={subject.theoryMarks as string}
                  />
                  <Input
                    className="rounded w-full text-center border-r-0 border-l-0"
                    value={subject.practicalMarks as string}
                  /> */}
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
