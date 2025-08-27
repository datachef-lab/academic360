import React from "react";
import { Student } from "@/types/academics/student";
import { Calendar } from "lucide-react";
import Image from "next/image";
import NotificationCorner from "./NotificationCorner";

export default function WelcomeBanner({ student }: { student: Student }) {
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative bg-[#a674fe] text-white rounded-2xl shadow-lg overflow-hidden p-6 md:p-8 flex items-center justify-between min-h-[180px]">
      <div className="z-10 relative">
        <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{dateString}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-1">
          Welcome back, {student?.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-base opacity-90 max-w-md">
          Always stay updated in your student portal
        </p>

        {/* Notification button - Moved to be part of the welcome text section */}
        <NotificationCorner />
      </div>

      <div className="absolute right-0 bottom-0 top-0 -mr-10 md:mr-0 z-0 hidden sm:flex items-center justify-center">
        <Image
          src={
            student?.sexId === 1
              ? "/illustrations/welcome-illustration-male.png"
              : "/illustrations/welcome-illustration-female.png"
          }
          alt="Welcome Illustration"
          width={320}
          height={220}
          className="object-contain h-full w-auto"
          priority
          style={{ filter: "none" }}
        />
      </div>
    </div>
  );
}
