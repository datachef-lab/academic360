"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, CheckCircle2, UploadCloud, FileSearch2, ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CUFormUploadPage() {
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
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
    if (droppedFile) toast.error("Please upload a PDF file only.");
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

  const progressStep = submitted ? 3 : file ? 2 : 1;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-8 px-4 mb-6 shadow-md relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-blue-400 blur-2xl" />
          <div className="absolute right-32 top-10 w-28 h-28 rounded-full bg-purple-400 blur-xl" />
          <div className="absolute left-10 bottom-4 w-40 h-40 rounded-full bg-indigo-300 blur-2xl" />
        </div>

        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                Exams
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold leading-snug">
                CU Semester I Examination Form Upload
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-blue-100/90 max-w-xl">
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

      {!submitted && (
        <main className="flex-1 px-4">
          <div className="max-w-5xl mx-auto border bg-slate-50 rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
            {/* Progress Steps (UNCHANGED STRUCTURE) */}
            <div className="flex items-center w-full text-[10px] sm:text-[11px] text-slate-500 overflow-x-auto">
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
                  <>
                    <div key={step.key} className="flex flex-col items-center gap-1 min-w-[60px]">
                      <div
                        className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs font-medium border-2 transition-all ${circleClasses}`}
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
                      <div className="flex-1 h-0.5 mx-2 sm:mx-3 bg-slate-200 relative overflow-hidden">
                        <div
                          className={`absolute inset-0 transition-all duration-300 ${
                            progressStep > step.key ? "bg-emerald-500 w-full" : "bg-transparent w-0"
                          }`}
                        />
                      </div>
                    )}
                  </>
                );
              })}
            </div>

            {/* Instructions */}
            <section className="text-xs sm:text-sm text-slate-700">
              <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                    i
                  </span>
                  Important Information:
                </h2>
                <ul className="mt-3 list-disc pl-5 space-y-1.5">
                  <li>The form should be a single PDF file (max 2 MB).</li>
                  <li>All fields such as subjects, signature and photograph must be clearly visible.</li>
                  <li>Exam form must be downloaded from the Calcutta University website.</li>
                  <li>
                    Please verify that all details mentioned in your examination form are correct. In case of any
                    discrepancy, kindly fill out the Google Form provided below to notify us. It is advised to submit
                    the form using your institutional email ID only.
                    <a
                      href="https://your-google-form-link-here"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-blue-700 underline hover:text-blue-900 font-semibold text-xs  cursor-pointer"
                    >
                      Fill the Form
                    </a>
                  </li>
                  <li className=" text-red-600 font-semibold">
                    It is mandatory to complete the enrolment process along with the payment of fees to be a bonafide
                    student of the college.
                  </li>
                </ul>
              </div>
            </section>

            {/* Upload + Preview */}
            <section className="space-y-3 text-sm text-slate-800 ">
              <h3 className="font-semibold">Upload & Preview</h3>
              <div className={`grid gap-4 ${file ? "md:grid-cols-2" : "grid-cols-1"}`}>
                {/* Upload Box */}
                <motion.div
                  layout
                  className={`relative rounded-2xl border-2 border-dashed px-4 ${file ? "py-4" : "py-6"} text-center overflow-hidden ${
                    file ? "h-64 sm:h-72 md:h-80 flex flex-col items-center justify-center" : ""
                  } ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50/80"
                      : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <motion.div
                    className={`mx-auto ${file ? "mb-4 h-14 w-14" : "mb-3 h-12 w-12"} inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm`}
                    animate={isDragOver ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <UploadCloud className={file ? "w-6 h-6" : "w-5 h-5"} />
                  </motion.div>
                  <p className={`${file ? "text-sm" : "text-xs"} text-slate-700`}>
                    Drag and drop your PDF here, or <span className="font-semibold text-indigo-600">browse</span> from
                    your device.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer ${
                      file ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
                    }`}
                  >
                    Browse PDF
                  </button>

                  {file && (
                    <div className="mt-4 flex justify-center items-center gap-3 text-sm text-emerald-700">
                      <span className="truncate max-w-[260px]">{file.name}</span>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1 border rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Preview */}
                {file && previewUrl && (
                  <div>
                    {/* <h4 className="font-semibold mb-2">Preview</h4> */}
                    <div className="rounded-md border bg-white h-64 sm:h-72 md:h-80 overflow-hidden">
                      <object data={`${previewUrl}#toolbar=0`} type="application/pdf" className="w-full h-full" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submit */}
            <section>
              <button
                onClick={() => {
                  setSubmitted(true);
                  toast.success("Form uploaded successfully.");
                }}
                disabled={!file}
                className={`w-full py-2 rounded-md font-semibold text-sm ${
                  file
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                Submit Semester I Examination Form
              </button>
            </section>
          </div>
        </main>
      )}

      {/* Success State */}
      {submitted && (
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-md sm:max-w-lg rounded-lg border bg-white p-5 sm:p-7 text-center space-y-4 sm:space-y-5 shadow-sm">
            <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mx-auto">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
                Form uploaded successfully
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your Semester I Calcutta University Examination Form has been submitted. A confirmation email has been
                sent to your Institutional Email ID. Please check the same.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to upload
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
