"use client";

import { Fragment, useEffect, useState } from "react";
import { FileText, CheckCircle2, UploadCloud, FileSearch2, ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/utils";
import { useStudent } from "@/providers/student-provider";

const SEMESTER_ONE_CLASS_ID = 1;

const fetchPromotionByStudentIdAndClassId = async (studentId: number, classId: number) => {
  const response = await axiosInstance.get(`/api/promotions/student/${studentId}/class/${classId}`);
  return response;
};

export default function CUFormUploadPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { student } = useStudent();

  useEffect(() => {
    const checkExamFormStatus = async () => {
      if (!student?.id) {
        return;
      }

      try {
        const promotionResponse = await fetchPromotionByStudentIdAndClassId(student.id, SEMESTER_ONE_CLASS_ID);
        const promotion = promotionResponse.data?.payload;

        if (promotion?.isExamFormSubmitted === true) {
          setSubmitted(true);
        }
      } catch (error) {
        // console.error("Failed to check exam form submission status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkExamFormStatus();
  }, [student?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      e.target.value = "";
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      return;
    }

    if (droppedFile) {
      toast.error("Please upload a PDF file only.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please upload your examination form before submitting.");
      return;
    }

    if (!student || !student.id) {
      toast.error("Unable to identify logged-in student. Please re-login and try again.");
      return;
    }

    try {
      setIsSubmitting(true);

      // console.log("Submitting CU exam form for student ID:", student.id);
      const promotionResponse = await fetchPromotionByStudentIdAndClassId(student.id!, SEMESTER_ONE_CLASS_ID);

      const promotion = promotionResponse.data?.payload;

      if (!promotion || !promotion.id) {
        toast.error("No promotion record found for Semester I. Please contact the college office.");
        return;
      }

      const formData = new FormData();
      formData.append("examForm", file);

      await axiosInstance.post(`/api/promotions/${promotion.id}/mark-exam-form-submitted`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitted(true);
      toast.success("Semester I CU Examination Form uploaded successfully.");
    } catch (error: any) {
      // console.error("Failed to submit CU exam form:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "An unexpected error occurred while submitting your form.";

      toast.error(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1 = upload, 2 = preview, 3 = submitted
  const progressStep = submitted ? 3 : file ? 2 : 1;

  // Create and cleanup object URL for PDF preview
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // ─── Loading state ───────────────────────────────────────────────────────────
  // Show a neutral loader while we wait for the student context AND the status
  // API call to resolve. This prevents a flash of the upload UI for students
  // who have already submitted.
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Keep the same header so the page doesn't jump on load */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-8 mb-6 shadow-md relative overflow-hidden rounded-b-3xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-blue-400 blur-2xl" />
            <div className="absolute right-32 top-10 w-28 h-28 rounded-full bg-purple-400 blur-xl" />
            <div className="absolute left-10 bottom-4 w-40 h-40 rounded-full bg-indigo-300 blur-2xl" />
          </div>
          <div className="relative max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">Exams</p>
                <h1 className="text-2xl md:text-3xl font-semibold leading-snug">
                  CU Semester I Examination Form Upload
                </h1>
                <p className="mt-1 text-xs md:text-sm text-blue-100/90 max-w-xl">
                  Upload your Calcutta University Semester I examination form and verify every page before final
                  submission.
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-blue-100/90">
              <FileText className="w-4 h-4" />
              <span>PDF only • 1 file • Max 2 MB</span>
            </div>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <svg
              className="animate-spin h-7 w-7 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Checking submission status…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen  flex flex-col">
      {/* Header – aligned with Exams page style */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-8  mb-6 shadow-md relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-blue-400 blur-2xl" />
          <div className="absolute right-32 top-10 w-28 h-28 rounded-full bg-purple-400 blur-xl" />
          <div className="absolute left-10 bottom-4 w-40 h-40 rounded-full bg-indigo-300 blur-2xl" />
        </div>
        <div className="relative max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">Exams</p>
              <h1 className="text-2xl md:text-3xl font-semibold leading-snug">CU Semester I Examination Form Upload</h1>
              <p className="mt-1 text-xs md:text-sm text-blue-100/90 max-w-xl">
                Upload your Calcutta University Semester I examination form and verify every page before final
                submission.
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-blue-100/90">
            <FileText className="w-4 h-4" />
            <span>PDF only • 1 file • Max 2 MB</span>
          </div>
        </div>
      </div>

      {/* Main content when not submitted */}
      {!submitted && (
        <main className="flex-1">
          <div className="max-w-5xl mx-auto border bg-slate-50 rounded-xl shadow-sm p-4 md:p-6 space-y-6">
            {/* Steps – inline, no container box */}
            <div className="flex items-center w-full  text-[11px] text-slate-500">
              {[
                { key: 1, label: "Upload", icon: UploadCloud },
                { key: 2, label: "Preview", icon: FileSearch2 },
                { key: 3, label: "Submit", icon: ShieldCheck },
              ].map((step, index) => {
                const isCompleted = progressStep > step.key;
                const isActive = progressStep === step.key;
                const Icon = step.icon;

                const circleClasses = isCompleted
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isActive
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white text-slate-400";

                return (
                  <Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium border-2 transition-all ${circleClasses}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span
                        className={`text-[10px] whitespace-nowrap ${
                          isCompleted || isActive ? "text-slate-900 font-medium" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className="flex-1 h-0.5 mx-3 bg-slate-200 relative overflow-hidden">
                        <div
                          className={`absolute inset-0 transition-all duration-300 ${
                            progressStep > step.key ? "bg-emerald-500 w-full" : "bg-transparent w-0"
                          }`}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* Instructions */}
            <section className="space-y-2 text-xs md:text-sm  text-slate-700">
              <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                <h2 className="text-sm md:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                    i
                  </span>
                  Important Instructions: -
                </h2>
                <ul className="mt-3 list-disc pl-5 space-y-1.5">
                  <li>Exam form must be downloaded from the Calcutta University website.</li>
                  <li>
                    Please verify that all details mentioned in your examination form are correct. In case of any
                    discrepancy, kindly fill out the Google Form provided here with to notify us. It is advised to
                    submit the form using your institutional email ID only.
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLScwVkcMABpAExw-6TZwtMfdKycygF9DzCJhX1GAkum3ajoP7w/viewform?pli=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-700 underline hover:text-blue-900 font-semibold  cursor-pointer"
                    >
                      Click here to fill the google form
                    </a>
                  </li>
                  {/* <li className="text-red-600 font-semibold">
                    It is mandatory to complete the enrolment process along with the payment of fees to be a bonafide
                    student of the college.
                  </li> */}
                </ul>
              </div>
            </section>

            {/* Upload + Preview row (preview only after upload) */}
            <section className="space-y-3 text-sm text-slate-800">
              <h3 className="font-semibold">Upload &amp; Preview</h3>

              <div className={`grid gap-4 items-start ${file ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                {/* Upload */}
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`relative rounded-2xl border-2 border-dashed px-4 py-6 text-center overflow-hidden ${
                    !file ? "mx-auto max-w-md" : "min-h-[18rem] md:min-h-[20rem]"
                  } ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50/80 shadow-[0_0_0_1px_rgba(79,70,229,0.15)]"
                      : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <motion.div
                    className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm"
                    animate={isDragOver ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <UploadCloud className="w-5 h-5" />
                  </motion.div>
                  <p className="text-xs text-slate-700">
                    Drag and drop your PDF here, or <span className="font-semibold text-indigo-600">browse</span> from
                    your device.
                  </p>
                  <label className="mt-3 inline-flex items-center justify-center">
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                    <span className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">
                      Browse PDF
                    </span>
                  </label>
                  {file && (
                    <motion.div
                      className="mt-4 flex items-center justify-center gap-2 text-[11px] text-emerald-700 font-medium"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="truncate max-w-[220px]">Selected: {file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 bg-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>

                {/* Preview to the right (only when file is present) */}
                {file && previewUrl && (
                  <section className="space-y-2 text-sm text-slate-800">
                    <div className="rounded-md border bg-white min-h-[18rem] md:min-h-[20rem] overflow-hidden flex flex-col">
                      <iframe
                        key={previewUrl}
                        title="PDF Preview"
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="w-full flex-1 min-h-[16rem]"
                      />

                      {/* Fallback for browsers that block PDF in iframe */}
                      <div className="hidden">
                        <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </section>

            {/* Submit */}
            <section className="pt-2 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!file || isSubmitting}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                  file && !isSubmitting
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {isSubmitting ? "Submitting..." : "Submit Semester I Examination Form"}
              </button>
              <p className="text-[11px] text-slate-500">
                Once submitted, changes cannot be made from the portal. For any corrections, please fillup the google
                form given above.
              </p>
            </section>
          </div>
        </main>
      )}

      {/* Success state */}
      {submitted && (
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-slate-900">Form uploaded successfully</h2>
              <p className="mt-1 text-xs text-slate-600">
                Your Semester I Calcutta University Examination Form has been submitted. Please check your Institutional
                Email ID for the confirmation of the same.
              </p>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
