import React from "react";
import { BookOpen, Layers, FileText, GraduationCap, Lightbulb, Info, AlertTriangle } from "lucide-react";

export default function Instructions({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`h-full w-full flex flex-col ${compact ? "" : ""}`}>
      {/* Fixed Header - Even Smaller Height */}
      <div className="bg-white rounded-xl w-full shadow-lg border border-gray-100 mb-3 flex-shrink-0">
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
              <Lightbulb className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Important Notes & Guide</h3>
              <p className="text-xs text-gray-500">Essential information for subject selection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - Cleaner Design */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-4">
            <div className="space-y-4 text-sm text-gray-700">
              {/* Before You Begin */}
              <div className="border border-blue-200 rounded-lg p-3 transition-all duration-300 hover:border-blue-400">
                <h4 className="font-bold text-blue-800 mb-2 text-sm bg-blue-50 px-2 py-1 rounded inline-block">
                  Before You Begin
                </h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Please read all guidelines carefully before selecting your subjects. These selections will determine
                  your academic path for the upcoming semesters.
                </p>
              </div>

              {/* Introduction */}
              {/* <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-gray-700 leading-relaxed text-sm">
                  Before selecting your subjects, please read the following notes carefully to ensure clarity on the
                  selection process. These notes are provided here for your reference and guidance.
                </p>
              </div> */}

              {/* Subject Categories - Clean Ordered Lists */}
              <div className="space-y-4">
                {/* Minor Subjects */}
                <div
                  id="minor-subjects"
                  className="border border-blue-200 rounded-lg p-3 transition-all duration-300 hover:border-blue-400"
                >
                  <h4 className="font-bold text-blue-800 mb-2 text-sm bg-blue-50 px-2 py-1 rounded inline-block">
                    Minor Subjects
                  </h4>
                  <ol className="text-blue-700 text-sm leading-relaxed list-decimal list-inside space-y-1">
                    <li>You will have to choose 2 (two) subjects to be studied as Minor I and Minor II.</li>
                    <li>
                      The subject you opt in Semester I will be your Minor I subject and will be studied by you in
                      Semesters I & II.
                    </li>
                    <li>
                      The subject you select in Semester III will be treated as your Minor II subject and will be
                      studied by you in Semesters III & IV.
                    </li>
                    <li>
                      From the two subjects opted as Minor I and Minor II, you will have to opt for either of these
                      subjects in Semesters V & VI respectively.
                    </li>
                  </ol>
                </div>

                {/* IDC Subjects */}
                <div
                  id="idc-subjects"
                  className="border border-green-200 rounded-lg p-3 transition-all duration-300 hover:border-green-400"
                >
                  <h4 className="font-bold text-green-800 mb-2 text-sm bg-green-50 px-2 py-1 rounded inline-block">
                    Interdisciplinary Course (IDC)
                  </h4>
                  <ol className="text-green-700 text-sm leading-relaxed list-decimal list-inside space-y-1">
                    <li>You have to select an IDC subject for each semester from I to III.</li>
                    <li>IDC subjects cannot be same as your Minor subjects.</li>
                    <li>IDC subjects also cannot be repeated in any other semester.</li>
                  </ol>
                </div>

                {/* AEC Subjects */}
                <div
                  id="aec-subjects"
                  className="border border-purple-200 rounded-lg p-3 transition-all duration-300 hover:border-purple-400"
                >
                  <h4 className="font-bold text-purple-800 mb-2 text-sm bg-purple-50 px-2 py-1 rounded inline-block">
                    Ability Enhancement Compulsory Course (AEC)
                  </h4>
                  <ol className="text-purple-700 text-sm leading-relaxed list-decimal list-inside space-y-1">
                    <li>You will have to study 1 (One) AEC subject in each semester from I to IV.</li>
                    <li>
                      Compulsory English is mandatory named as AEC 1 and AEC 2 for Semesters I and II respectively.
                    </li>
                    <li>
                      For AEC 3 and AEC 4, you will have to choose 1 (one) subject which will be studied in Semesters
                      III and IV respectively.
                    </li>
                  </ol>
                </div>

                {/* CVAC Subjects */}
                <div
                  id="cvac-subjects"
                  className="border border-orange-200 rounded-lg p-3 transition-all duration-300 hover:border-orange-400"
                >
                  <h4 className="font-bold text-orange-800 mb-2 text-sm bg-orange-50 px-2 py-1 rounded inline-block">
                    CVAC Subjects
                  </h4>
                  <ol className="text-orange-700 text-sm leading-relaxed list-decimal list-inside space-y-1">
                    <li>
                      ENVS is mandatory to be studied for all courses named as CVAC 1 and CVAC 3 in Semesters I & II
                      respectively.
                    </li>
                    <li>Constitutional Values is mandatory for all courses as CVAC 2 in Semester I.</li>
                    <li>
                      Value-Oriented Life Skill Education is mandatory to be studied by B.A. students as CVAC 4 in
                      Semester II.
                    </li>
                    <li>B.Sc. students get to choose from 2 (two) CVAC options in Semester II.</li>
                  </ol>
                </div>
              </div>

              {/* Warning Section */}
              <div className="border border-amber-200 rounded-lg p-3">
                <h4 className="font-bold text-amber-800 mb-2 text-sm bg-amber-50 px-2 py-1 rounded inline-block">
                  Important Warnings
                </h4>
                <ol className="text-amber-700 space-y-1 text-sm list-decimal list-inside">
                  <li>Ensure all required fields are completed before submission</li>
                  <li>Subject selections cannot be changed after final submission</li>
                  <li>Verify that IDC subjects are different from Minor subjects</li>
                  <li>Check that no IDC subject is repeated across semesters</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
