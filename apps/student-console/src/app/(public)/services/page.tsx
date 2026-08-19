"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, ArrowRight, BookOpen } from "lucide-react";
import { useBranding } from "@/features/settings/hooks/use-branding";
import { fetchServiceTypes } from "@/services/service-requests.service";
import type { ServiceType } from "@/services/service-requests.service";

export const dynamic = "force-dynamic";

export default function ServicesChooserPage() {
  const { collegeName, abbreviation, logoUrl } = useBranding();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  useEffect(() => {
    fetchServiceTypes().then(setServiceTypes).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="mb-10 flex flex-col items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-16 w-16 rounded-xl object-contain bg-white p-1" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
            {(abbreviation || collegeName || "S").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center">
          {abbreviation && (
            <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase mb-1">
              {abbreviation} | Student Console
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {collegeName || "Institution"} Services
          </h1>
          <p className="mt-2 text-indigo-200 text-sm md:text-base">
            Bonafide, Transcript, Refund, and more — raise a service request online.
          </p>
        </div>
      </div>

      {/* Chooser cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Student */}
        <Link
          href="/"
          className="group bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
        >
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Current Student</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your UID — identity is prefilled from your profile.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
            Sign in <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Alumnus */}
        <Link
          href="/services/intake"
          className="group bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
        >
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Users className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Alumnus</h2>
            <p className="text-sm text-gray-500 mt-1">
              Not a current student? Fill a short identity form and verify your contact.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
            Continue as Alumni <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Service type list */}
      {serviceTypes.length > 0 && (
        <div className="mt-12 w-full max-w-2xl">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
            Available Services
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {serviceTypes.map((st) => (
              <div
                key={st.id}
                className="bg-white/10 rounded-xl px-3 py-3 text-center text-white text-xs font-medium backdrop-blur-sm border border-white/10"
              >
                <BookOpen className="h-4 w-4 mx-auto mb-1 text-indigo-300" />
                {st.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track existing request */}
      <p className="mt-10 text-indigo-300 text-sm">
        Already submitted?{" "}
        <Link href="/services/track" className="text-white underline underline-offset-2 hover:text-indigo-200">
          Track your request
        </Link>
      </p>
    </div>
  );
}
