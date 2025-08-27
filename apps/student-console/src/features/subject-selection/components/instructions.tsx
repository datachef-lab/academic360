import React from "react";
import { BookOpen, Layers, FileText, GraduationCap, Lightbulb } from "lucide-react";

export default function Instructions() {
  return (
    <div className="w-full h-full">
      <h1 className="flex px-3 border-b pb-5 gap-3 items-center scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        <Lightbulb className="w-8 h-8 text-yellow-500" />
        Important Notes and Guide
      </h1>

      {/* Apply justify on parent container */}
      <div className="my-4 p-4 space-y-4" style={{ textAlign: "justify" }}>
        <p className="text-gray-600">
          Before selecting your subjects, please read the following notes carefully to ensure clarity on the selection
          process. These notes are provided here for your reference and guidance.
        </p>

        <ol type="1" className="list-decimal list-inside space-y-4">
          <li className="flex items-start gap-3">
            <BookOpen className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
            <span>
              <span className="font-bold">Minor Subjects:</span> You will have to choose 2 (two) subjects to be studied
              as Minor I and Minor II. The subject you opt in Semester I will be your Minor I subject and will be
              studied by you in Semesters I & II. The subject you select in Semester III will be treated as your Minor
              II subject and will be studied by you in Semesters III & IV. From the two subjects opted as Minor I and
              Minor II, you will have to opt for either of these subjects in Semesters V & VI respectively.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <Layers className="w-6 h-6 text-green-600 mt-1 shrink-0" />
            <span>
              <span className="font-bold">Interdisciplinary Course (IDC):</span> You have to select an IDC subject for
              each semester from I to III. IDC subjects cannot be same as your Minor subjects and also cannot be
              repeated in any other semester.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-orange-600 mt-1 shrink-0" />
            <span>
              <span className="font-bold">Ability Enhancement Compulsory Course (AEC):</span> You will have to study 1
              (One) AEC subject in each semester from I to IV. Compulsory English is mandatory named as AEC 1 and AEC 2
              for Semesters I and II respectively. For AEC 3 and AEC 4, you will have to choose 1 (one) subject which
              will be studied in Semesters III and IV respectively.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <GraduationCap className="w-6 h-6 text-purple-600 mt-1 shrink-0" />
            <span>
              <span className="font-bold">CVAC Subjects:</span> ENVS is mandatory to be studied for all courses named as
              CVAC 1 and CVAC 3 in Semesters I & II respectively. Constitutional Values is mandatory for all courses as
              CVAC 2 in Semester I. Value-Oriented Life Skill Education is mandatory to be studied by B.A. students as
              CVAC 4 in Semester II. B.Sc. students get to choose from 2 (two) CVAC options in Semester II.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
