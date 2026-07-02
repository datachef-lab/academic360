"use client";

import React from "react";
import { Card, CardTitle } from "../ui/card";
import { ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CuRegistrationCard() {
  const router = useRouter();

  return (
    <Card
      className="border shadow-lg rounded-2xl overflow-hidden bg-white cursor-pointer hover:shadow-xl transition-shadow duration-200"
      onClick={() => router.push("/dashboard/admission-registration")}
    >
      <div className="flex h-full min-h-[220px]">
        {/* Left: Illustration */}
        <div
          className="w-1/2 bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center relative min-h-[220px]"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_URL!}/illustrations/cu-registration-illustration.jpg)`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        {/* Right: Content */}
        <div className="w-1/2 flex flex-col justify-center p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-purple-800">Action Required</CardTitle>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">CU Registration</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Complete your CU affiliation registration. Submit your details to finalize enrollment
              for this academic year.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
