"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

interface Admission {
  id: number;
  year: number;
  startDate: string;
  endDate: string | null;
  lastDate: string | null;
  isClosed: boolean;
  // Add any other properties your admission object has
}

interface Course {
  id: string;
  disabled: boolean;
  isClosed: boolean;
  course: {
    name: string;
    disabled: boolean;
  } | null;
  // Add any other properties your course object has
}


interface AdmissionsClientProps {
    admission: Admission | null;
    courses: Course[];
    error: string | null;
    currentYear: number;
}


export default function AdmissionsClient({ admission, courses, error, currentYear }: AdmissionsClientProps) {

  // Animated gradient background
  const animatedBg = (
    <div className="fixed inset-0 -z-10 animate-gradient bg-[linear-gradient(120deg,_#f3e7fa,_#e3f0ff,_#fbe8f6,_#e3f0ff,_#f3e7fa)] bg-[length:200%_200%]" />
  );

  // Floating blurred shapes for depth
  const floatingShapes = (
    <>
      <div className="absolute top-[-100px] left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-float-slow z-0" />
      <div className="absolute bottom-[-80px] right-1/4 w-60 h-60 bg-blue-200/30 rounded-full blur-2xl animate-float-slower z-0" />
      <div className="absolute top-1/2 left-0 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl animate-float-slowest z-0" />
    </>
  );

  // Accent bar for section heading
  const accentBar = <span className="inline-block w-2 h-6 rounded bg-gradient-to-b from-purple-500 to-pink-400 mr-3 align-middle" />;

  // Glassy pill for dates
  const datePill = (icon: React.ReactNode, label: string, value: string) => (
    <span className="flex items-center gap-1 px-4 py-1 rounded-full bg-white/60 backdrop-blur border border-white/40 shadow text-sm font-medium text-gray-700">
      {icon}
      <span className="font-semibold text-gray-800">{label}:</span> {value}
    </span>
  );

  // Gradient text for headline
  const gradientText = "bg-gradient-to-r from-purple-700 via-blue-600 to-pink-500 bg-clip-text text-transparent";

  // Modern font
  const fontClass = "font-sans";

  if (error || !admission) {
    return (
      <div className={"min-h-screen flex flex-col items-center justify-center relative " + fontClass}>
        {animatedBg}
        {floatingShapes}
        <Image src="/admission-close-besc.png" alt="Admissions Closed" width={120} height={120} className="mx-auto mb-6 drop-shadow-xl z-10" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2 z-10">Admissions Not Open</h1>
        <p className="text-gray-600 mb-4 z-10">Admissions for {currentYear} are currently closed or not available.</p>
        <div className="bg-purple-50/70 rounded-lg p-4 mb-4 border border-purple-100 z-10">
          <h2 className="font-semibold text-purple-800 mb-1">Need Help?</h2>
          <p className="text-sm text-gray-700">Contact our admissions office:</p>
          <div className="mt-2 text-sm text-gray-700">
            <p>📞 +91-XXXXXXXXXX</p>
            <p>✉️ admissions@besc.edu.in</p>
            <p>Mon-Fri, 10:00 AM - 4:00 PM</p>
          </div>
        </div>
        <Button asChild className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-transform z-10">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    );
  }

  const isClosed = admission.isClosed;

  return (
    <div className={"max-h-screen flex flex-col relative min-h-screen " + fontClass} style={{height: '100vh'}}>
      {animatedBg}
      {floatingShapes}
      {/* Main Content Wrapper: flex column, center, shrink hero/table */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 md:px-0">
        {/* Hero Section (smaller) */}
        <section className="flex flex-col items-center justify-center pt-6 pb-4 relative z-10 w-full" style={{minHeight: 0}}>
          <Image src="/besc-logo.jpeg" alt="BESC Logo" width={64} height={64} className="rounded-full border-2 border-white shadow-lg mb-3 bg-white z-10" />
          <h1 className={"text-2xl md:text-3xl font-extrabold text-center tracking-tight mb-1 " + gradientText}>
            {isClosed ? "Admissions Closed" : `Admissions Open for ${currentYear}`}
          </h1>
          <p className="text-base text-gray-700 max-w-xl text-center font-medium mb-2">
            {isClosed
              ? "We regret to inform you that admissions for this academic year are closed."
              : "Start your journey with us. Apply now to secure your seat for the upcoming academic year!"}
          </p>
          {/* Dates */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center mb-3">
            {datePill(
              <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              "Start Date",
              formatDate(admission.startDate)
            )}
            {datePill(
              <svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              "End Date",
              formatDate(admission.lastDate || admission.endDate || "")
            )}
          </div>
          {!isClosed && (
            <Button asChild size="sm" className="mt-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-6 py-2 rounded-full shadow text-base hover:scale-105 hover:shadow-lg transition-transform">
              <Link href={`/admissions/${currentYear}`}>Apply Now</Link>
            </Button>
          )}
        </section>

        {/* Courses Section (compact) */}
        {!isClosed && (
          <section className="w-full max-w-xl mx-auto mt-4 px-1 md:px-0 relative z-10">
            <div className="mb-2 flex items-center">
              {accentBar}
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Courses Available</h2>
            </div>
            <div className="overflow-x-auto rounded-xl shadow bg-white/80 backdrop-blur border border-white/40 max-h-48 md:max-h-56 overflow-y-auto">
              <table className="min-w-full text-xs md:text-sm rounded-xl overflow-hidden">
                <thead className="bg-white/90">
                  <tr>
                    <th className="py-2 px-3 text-left font-semibold text-gray-700">Sr. No.</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-700">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.filter((c: any) => !c.disabled && !c.isClosed && c.course && !c.course.disabled).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 text-center text-gray-500">No courses available for this admission.</td>
                    </tr>
                  ) : (
                    courses.filter((c: any) => !c.disabled && !c.isClosed && c.course && !c.course.disabled).map((c: any, idx: number) => (
                      <tr key={c.id} className={"transition hover:bg-purple-50/40 " + (idx % 2 === 0 ? "bg-white/60" : "bg-white/40") }>
                        <td className="py-2 px-3 text-gray-900 whitespace-nowrap font-semibold">{idx + 1}</td>
                        <td className="py-2 px-3 text-gray-800 whitespace-nowrap font-medium">{c.course?.name || "Unnamed Course"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      {/* Footer */}
      <footer className="w-full border-t border-transparent pt-3 pb-2 bg-transparent relative z-10 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 px-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Image src="/besc-logo.jpeg" alt="BESC Logo" width={20} height={20} className="rounded-full border border-purple-200" />
            <span className="font-semibold text-gray-700">The Bhawanipur Education Society College</span>
            <div className="flex gap-2 ml-2">
              <a href="#" className="text-purple-400 hover:text-purple-700" aria-label="Facebook"><svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg></a>
              <a href="#" className="text-purple-400 hover:text-purple-700" aria-label="Twitter"><svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.938-.856 2.021-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646A9.936 9.936 0 0 0 24 4.557z"/></svg></a>
              <a href="#" className="text-purple-400 hover:text-purple-700" aria-label="LinkedIn"><svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11.75 20h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.599v5.597z"/></svg></a>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Image src="/datachef-logo.svg" alt="DataChef" width={16} height={16} className="rounded-full border border-purple-200 bg-white" />
            <span className="font-bold text-gray-700">DataChef</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 