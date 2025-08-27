"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HeaderBanner from "@/components/attendance/header-banner";
import AttendanceTabs from "@/components/attendance/attendance-tabs";
import { mockData } from "@/components/attendance/data";

export default function AttendancePage() {
  const [selectedSemester, setSelectedSemester] = useState<string>("1");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <HeaderBanner
        mockData={mockData}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="block md:hidden mb-6">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-full border-indigo-100">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {mockData.semesters.map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AttendanceTabs selectedSemester={selectedSemester} />
      </main>
    </div>
  );
}






// Dynamically add some dummy upcoming and ongoing classes for the current day
// const today = new Date().toLocaleDateString("en-US", {
//   weekday: "long",
// }) as keyof typeof mockData.timetable;

// // Add dummy classes with times relative to now
// const now = new Date();
// const currentHour = now.getHours();
// const currentMinute = now.getMinutes();

// // Add an upcoming class (e.g., 1 hour from now)
// const upcomingTimeHour = (currentHour + 1) % 24;
// const upcomingTime = `${upcomingTimeHour
//   .toString()
//   .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")} - ${(
//   (upcomingTimeHour + 1) %
//   24
// )
//   .toString()
//   .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

// mockData.timetable = {
//   ...mockData.timetable,
//   [today]: [
//     ...(mockData.timetable[today] || []),
//     {
//       time: upcomingTime,
//       subject: "DUMMY101",
//       room: "301",
//       floor: "3rd",
//     },
//   ],
// };

// // Add another upcoming class (e.g., 2 hours from now)
// const upcomingTime2Hour = (currentHour + 2) % 24;
// const upcomingTime2 = `${upcomingTime2Hour
//   .toString()
//   .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")} - ${
//   (upcomingTime2Hour + 1) % 24
// }`;

// mockData.timetable = {
//   ...mockData.timetable,
//   [today]: [
//     ...(mockData.timetable[today] || []),
//     {
//       time: upcomingTime2,
//       subject: "DUMMY201",
//       room: "402",
//       floor: "4th",
//     },
//   ],
// };

// // Optionally, add an ongoing class if within a specific window (e.g., start time within the last 15 mins)
// // This is a bit trickier with just mock data and depends heavily on when the user loads the page.
// // For reliable demo, adding upcoming is easier.

// // Note: In a real application, you would fetch the actual today's schedule from an API.
