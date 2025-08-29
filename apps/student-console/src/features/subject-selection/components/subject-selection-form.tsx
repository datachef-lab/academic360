"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";

export default function SubjectSelectionForm() {
  const { user } = useAuth();
  const { student } = useStudent();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state - matching the documented workflow
  const [minor1, setMinor1] = useState(""); // Minor I (Semester I & II)
  const [minor2, setMinor2] = useState(""); // Minor II (Semester III & IV) - auto-assigned
  const [idc1, setIdc1] = useState(""); // IDC 1 (Semester I)
  const [idc2, setIdc2] = useState(""); // IDC 2 (Semester II)
  const [idc3, setIdc3] = useState(""); // IDC 3 (Semester III)
  const [aec3, setAec3] = useState(""); // AEC 3 (Semester III)
  const [cvac2, setCvac2] = useState(""); // CVAC 2 (Semester I)
  const [cvac4, setCvac4] = useState(""); // CVAC 4 (Semester II)

  // Mock data - in real implementation, this would come from backend
  const [admissionMinorSubjects] = useState(["History", "Geography"]); // Pre-admission choices
  const [availableIdcSubjects] = useState([
    "Philosophy",
    "Sociology",
    "Psychology",
    "Economics",
    "Anthropology",
    "Political Science",
    "Mathematics",
    "Statistics",
  ]);
  const [availableAecSubjects] = useState(["Alternative English", "Hindi", "Bengali", "Sanskrit"]);
  const [availableCvac4Options] = useState([
    "Value-Oriented Life Skill Education",
    "Environmental Science",
    "Computer Science",
  ]);

  // Auto-assign Minor II when Minor I is selected
  useEffect(() => {
    if (minor1 && admissionMinorSubjects.includes(minor1)) {
      const remainingSubject = admissionMinorSubjects.find((subject) => subject !== minor1);
      setMinor2(remainingSubject || "");
    } else {
      setMinor2("");
    }
  }, [minor1, admissionMinorSubjects]);

  // Highlight document section when field is focused
  const handleFieldFocus = (fieldType: string) => {
    // Scroll to and highlight the corresponding document section
    const sectionId = `${fieldType}-subjects`;
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" });
      section.classList.add("ring-4", "ring-blue-500", "border-blue-500");

      // Remove highlight after 3 seconds
      setTimeout(() => {
        section.classList.remove("ring-4", "ring-blue-500", "border-blue-500");
      }, 3000);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: string[] = [];

    // Required field validation
    if (!minor1) newErrors.push("Minor I subject is required");
    if (!idc1) newErrors.push("IDC 1 subject is required");
    if (!idc2) newErrors.push("IDC 2 subject is required");
    if (!idc3) newErrors.push("IDC 3 subject is required");
    if (!aec3) newErrors.push("AEC 3 subject is required");
    if (!cvac2) newErrors.push("CVAC 2 subject is required");
    if (!cvac4) newErrors.push("CVAC 4 subject is required");

    // Business rule validation
    if (minor1 && idc1 && minor1 === idc1) {
      newErrors.push("Minor I cannot be the same as IDC 1");
    }
    if (minor1 && idc2 && minor1 === idc2) {
      newErrors.push("Minor I cannot be the same as IDC 2");
    }
    if (minor1 && idc3 && minor1 === idc3) {
      newErrors.push("Minor I cannot be the same as IDC 3");
    }
    if (minor2 && idc1 && minor2 === idc1) {
      newErrors.push("Minor II cannot be the same as IDC 1");
    }
    if (minor2 && idc2 && minor2 === idc2) {
      newErrors.push("Minor II cannot be the same as IDC 2");
    }
    if (minor2 && idc3 && minor2 === idc3) {
      newErrors.push("Minor II cannot be the same as IDC 3");
    }

    // IDC uniqueness validation
    if (idc1 && idc2 && idc1 === idc2) {
      newErrors.push("IDC 1 and IDC 2 cannot be the same");
    }
    if (idc1 && idc3 && idc1 === idc3) {
      newErrors.push("IDC 1 and IDC 3 cannot be the same");
    }
    if (idc2 && idc3 && idc2 === idc3) {
      newErrors.push("IDC 2 and IDC 3 cannot be the same");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setOpen(true);
    }
  };

  // Filter out Minor subjects from IDC options
  const getFilteredIdcOptions = (currentIdcValue: string) => {
    return availableIdcSubjects.filter(
      (subject) =>
        subject !== minor1 &&
        subject !== minor2 &&
        (subject === currentIdcValue || (subject !== idc1 && subject !== idc2 && subject !== idc3)),
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Student Information Section - Fixed */}
      {/* <div className="bg-blue-800 shadow-2xl rounded-2xl border-0 p-8 mb-6 flex-shrink-0">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-7 h-7 text-w hite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-white">Student Information</div>
            <div className="text-blue-100 text-sm font-normal">Academic Year 2024-25</div>
          </div>
        </h3>
        <div className="grid grid-cols-5 gap-8">
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Name</label>
            <p className="text-base font-bold text-white">Dipanwita Sarkar</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">UID</label>
            <p className="text-base font-bold text-white">0101255656</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Roll Number</label>
            <p className="text-base font-bold text-white">251000</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Program Course</label>
            <p className="text-base font-bold text-white">B.A. English (H)</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Shift</label>
            <p className="text-base font-bold text-white">Day</p>
          </div>
        </div>
      </div> */}

      <div className="bg-blue-600 mt-2 mb-4 text-white font-bold p-2 rounded-lg">
        <div className="flex items-center gap-2 justify-between py-2 mb-3 text-xl border-b">
          <div className="text-white">Student Information</div>
          <div className="text-blue-100 text-sm font-normal">Academic Year 2024-25</div>
        </div>
        <div className="grid grid-cols-5 gap-8">
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Name</label>
            <p className="text-base font-bold text-white">{user?.name}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">UID</label>
            <p className="text-base font-bold text-white">{student?.academicIdentifier?.uid}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Roll Number</label>
            <p className="text-base font-bold text-white">{student?.academicIdentifier?.rollNumber}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Program Course</label>
            <p className="text-base font-bold text-white">
              {student?.admissionCourseDetails?.programCourse?.course?.name} ({student?.admissionCourseDetails?.programCourse?.courseType?.shortName})
            </p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Shift</label>
            <p className="text-base font-bold text-white">{student?.admissionCourseDetails?.shift?.name}</p>
          </div>
        </div>
      </div>

      {/* Form Section - No Scrolling */}
      <div className="flex-1">
        <div className="shadow-lg rounded-xl bg-white p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Semester-wise Subject Selection for Calcutta University Registration
            </h2>
            <p className="text-gray-600 text-sm">Please select your subjects according to the guidelines</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Minor Subjects */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Minor I (Semester I & II)</label>
              <select
                value={minor1}
                onChange={(e) => setMinor1(e.target.value)}
                onFocus={() => handleFieldFocus("minor")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select Minor I</option>
                {admissionMinorSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Minor II (Semester III & IV)</label>
              <select
                value={minor2}
                disabled
                className="w-full p-2.5 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed shadow-sm"
              >
                <option value="">{minor2 || "Auto-assigned"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">AEC 3 (Semester III)</label>
              <select
                value={aec3}
                onChange={(e) => setAec3(e.target.value)}
                onFocus={() => handleFieldFocus("aec")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select AEC 3</option>
                {availableAecSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* IDC Subjects */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">IDC 1 (Semester I)</label>
              <select
                value={idc1}
                onChange={(e) => setIdc1(e.target.value)}
                onFocus={() => handleFieldFocus("idc")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select IDC 1</option>
                {getFilteredIdcOptions(idc1).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">IDC 2 (Semester II)</label>
              <select
                value={idc2}
                onChange={(e) => setIdc2(e.target.value)}
                onFocus={() => handleFieldFocus("idc")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select IDC 2</option>
                {getFilteredIdcOptions(idc2).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">IDC 3 (Semester III)</label>
              <select
                value={idc3}
                onChange={(e) => setIdc3(e.target.value)}
                onFocus={() => handleFieldFocus("idc")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select IDC 3</option>
                {getFilteredIdcOptions(idc3).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* CVAC Subjects */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">CVAC 2 (Semester I)</label>
              <select
                value={cvac2}
                onChange={(e) => setCvac2(e.target.value)}
                onFocus={() => handleFieldFocus("cvac")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select CVAC 2</option>
                <option value="constitutional-values">Constitutional Values</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">CVAC 4 (Semester II)</label>
              <select
                value={cvac4}
                onChange={(e) => setCvac4(e.target.value)}
                onFocus={() => handleFieldFocus("cvac")}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="">Select CVAC 4</option>
                {availableCvac4Options.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">{/* Empty space for grid alignment */}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
            >
              Preview & Save
            </button>
          </div>
        </div>
      </div>

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <h2 className="text-xl font-bold text-gray-800">
              {errors.length > 0 ? "Validation Errors" : "Preview Your Selections"}
            </h2>
            <p className="text-gray-600 text-sm">
              {errors.length > 0
                ? "Please fix the following errors before proceeding"
                : "Please review your subject selections before proceeding"}
            </p>
          </DialogHeader>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <p className="font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table - Only show if no errors */}
          {errors.length === 0 && (
            <div className="overflow-x-auto my-4">
              <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border p-2 text-left font-semibold text-gray-700">Subject Category</th>
                    <th className="border p-2 text-left font-semibold text-gray-700">Selection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">Minor I (Semester I & II)</td>
                    <td className="border p-2 text-gray-800">{minor1 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">Minor II (Semester III & IV)</td>
                    <td className="border p-2 text-gray-800">{minor2 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">IDC 1 (Semester I)</td>
                    <td className="border p-2 text-gray-800">{idc1 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">IDC 2 (Semester II)</td>
                    <td className="border p-2 text-gray-800">{idc2 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">IDC 3 (Semester III)</td>
                    <td className="border p-2 text-gray-800">{idc3 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">AEC 3 (Semester III)</td>
                    <td className="border p-2 text-gray-800">{aec3 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">CVAC 2 (Semester I)</td>
                    <td className="border p-2 text-gray-800">{cvac2 || "-"}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 font-medium text-gray-700">CVAC 4 (Semester II)</td>
                    <td className="border p-2 text-gray-800">{cvac4 || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Declarations - Only show if no errors */}
          {errors.length === 0 && (
            <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Declarations</h4>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded" required />
                <span>I confirm that I have read the semester-wise subject selection guidelines given above.</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded" required />
                <span>
                  I understand that once submitted, I will not be allowed to change the selected subjects in the future.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded" required />
                <span>
                  In the event of violation of subject selection rules, I will abide by the final decision taken by the
                  Vice-Principal/Course Coordinator/Calcutta University.
                </span>
              </label>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              {errors.length > 0 ? "Close" : "Go Back to Edit"}
            </button>
            {errors.length === 0 && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm">
                Continue to Save
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
