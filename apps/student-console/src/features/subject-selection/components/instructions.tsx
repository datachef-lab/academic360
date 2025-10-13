import React from "react";
import { BookOpen, Layers, FileText, GraduationCap, Lightbulb, Info, AlertTriangle } from "lucide-react";

interface InstructionsProps {
  compact?: boolean;
  student?: any; // Using any to avoid complex type matching with StudentDto
  visibleCategories?: {
    minor?: boolean;
    idc?: boolean;
    aec?: boolean;
    cvac?: boolean;
  };
}

export default function Instructions({ compact = false, student, visibleCategories }: InstructionsProps) {
  // Determine student's program type
  const programCourseName =
    student?.currentPromotion?.programCourse?.name || student?.programCourse?.course?.name || "";

  const normalizedName = programCourseName.toLowerCase().replace(/[.\s]/g, "");
  const isBcomProgram = normalizedName.includes("bcom");
  const isBaProgram = normalizedName.includes("b.a") || normalizedName.includes("ba");
  const isBscProgram = normalizedName.includes("b.sc") || normalizedName.includes("bsc");
  return (
    <div className={`w-full flex flex-col ${compact ? "h-auto" : "h-full"}`}>
      {/* Fixed Header - Only show in non-compact mode */}
      {!compact && (
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
      )}

      {/* Scrollable Content - Cleaner Design */}
      <div className={`${compact ? "w-full" : "flex-1 overflow-y-auto no-scrollbar"}`}>
        <div
          className={`${compact ? "bg-transparent shadow-none border-0" : "bg-white rounded-xl shadow-lg border border-gray-100"}`}
        >
          <div className={`${compact ? "p-0" : "p-4"}`}>
            <div className={`space-y-4 text-sm text-gray-700 ${compact ? "space-y-3" : ""}`}>
              {/* Important Warnings - Moved to top */}
              <div className="border border-amber-200 rounded-lg p-3">
                <h4 className="font-bold text-amber-800 mb-2 text-sm bg-amber-50 px-2 py-1 rounded inline-block">
                  Important Warnings
                </h4>
                <ol className="text-amber-700 space-y-1 text-sm list-decimal list-inside">
                  <li>Ensure all required fields are completed before submission.</li>
                  <li>Subject selections cannot be changed after final submission.</li>
                  {!isBcomProgram && (
                    <>
                      <li>Verify that IDC subjects are different from Minor subjects.</li>
                      <li>Check that no IDC subject is repeated across semesters.</li>
                    </>
                  )}
                </ol>
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
                {/* Minor Subjects - Only show if visible */}
                {visibleCategories?.minor && (
                  <div
                    id="minor-subjects"
                    className="border border-blue-200 rounded-lg p-3 transition-all duration-300 hover:border-blue-400"
                  >
                    <h4 className="font-bold text-blue-800 mb-2 text-sm bg-blue-50 px-2 py-1 rounded inline-block">
                      Minor Subjects (MN)
                    </h4>
                    <div className="text-blue-700 text-sm leading-relaxed space-y-2">
                      {isBcomProgram ? (
                        <div>
                          <p className="font-semibold mb-2">For B.Com (H & G) Students:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              Choose one Minor subject from Semester III through Semester VI: E-Business or Marketing.
                            </li>
                            <li>
                              The corresponding papers for Semester III are Fundamentals of Information System
                              (E-Business) and Consumer Behaviour (Marketing).
                            </li>
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold mb-2">For B.A. & B.Sc. Students:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              Choose two distinct Minor subjects - Minor I (Studied in Semesters I & II) & Minor II
                              (Studied in Semesters III & IV).
                            </li>
                            <li>You will choose either Minor I or Minor II for Semesters V & VI respectively.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* IDC Subjects - Only show if visible */}
                {visibleCategories?.idc && (
                  <div
                    id="idc-subjects"
                    className="border border-green-200 rounded-lg p-3 transition-all duration-300 hover:border-green-400"
                  >
                    <h4 className="font-bold text-green-800 mb-2 text-sm bg-green-50 px-2 py-1 rounded inline-block">
                      Interdisciplinary Course (IDC) Subjects
                    </h4>
                    <div className="text-green-700 text-sm leading-relaxed space-y-2">
                      {isBcomProgram ? (
                        <div>
                          <p className="text-green-600 italic">IDC subjects are not applicable for B.Com students.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold mb-2">For B.A. & B.Sc. Students:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              You must select a different IDC subject for each of the three semesters (I, II, & III).
                            </li>
                            <li>The three IDC subjects chosen cannot be the same as your Major or Minor subjects.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AEC Subjects - Only show if visible */}
                {visibleCategories?.aec && (
                  <div
                    id="aec-subjects"
                    className="border border-purple-200 rounded-lg p-3 transition-all duration-300 hover:border-purple-400"
                  >
                    <h4 className="font-bold text-purple-800 mb-2 text-sm bg-purple-50 px-2 py-1 rounded inline-block">
                      Ability Enhancement Compulsory Course (AEC)
                    </h4>
                    <div className="text-purple-700 text-sm leading-relaxed space-y-2">
                      {isBcomProgram ? (
                        <div>
                          <p className="text-purple-600 italic">AEC subjects are not applicable for B.Com students.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold mb-2">For B.A. & B.Sc. (Hons.):</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              You'll study Compulsory English in Semesters I & II named as AEC 1 and AEC 2 respectively.
                            </li>
                            <li>For Semesters III & IV, you must choose one subject to study across both semesters.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CVAC Subjects - Only show if visible */}
                {visibleCategories?.cvac && (
                  <div
                    id="cvac-subjects"
                    className="border border-orange-200 rounded-lg p-3 transition-all duration-300 hover:border-orange-400"
                  >
                    <h4 className="font-bold text-orange-800 mb-2 text-sm bg-orange-50 px-2 py-1 rounded inline-block">
                      Common Value-Added Course (CVAC)
                    </h4>
                    <div className="text-orange-700 text-sm leading-relaxed space-y-3">
                      <div>
                        <p className="font-semibold mb-2">Semester I</p>
                        <p className="ml-2">B.Com/ B.A./B.Sc. students are required to study:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Environmental Studies (ENVS)</li>
                          <li>Constitutional Values</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">Semester II</p>
                        <p className="ml-2">
                          B.Com/ B.A./B.Sc. students will continue to study Environmental Studies (ENVS).
                        </p>
                        <p className="ml-2 mt-1">Additionally,</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>B.A. students must also study Value-Oriented Life Skill Education.</li>
                          <li>B.Sc. students must also choose one subject from two available CVAC options.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
