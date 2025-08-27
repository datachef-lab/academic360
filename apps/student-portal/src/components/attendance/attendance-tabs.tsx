import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import TodayContent from "./today-content";
import StatisticsContent from "./statistics-content";
import EventContent from "./event-content";
import { MockData, mockData } from "./data";
import { Subject, UpcomingClass } from "@/types/attendance";

type AttendanceTabsProps = {
  selectedSemester: string;
};

export default function AttendanceTabs({
  selectedSemester,
}: AttendanceTabsProps) {
  const [selectedView, setSelectedView] = useState<string>("today");

  const currentSubjects =
    mockData.subjects[
      selectedSemester as unknown as keyof typeof mockData.subjects
    ] || [];
  const currentOrNextClass = getCurrentOrNextClass(currentSubjects, mockData);

  return (
    <Tabs
      value={selectedView}
      onValueChange={setSelectedView}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-auto mb-6">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="statistics">Statistics</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
      </TabsList>

      <TabsContent value="today">
        <TodayContent
          mockData={mockData}
          currentOrNextClass={currentOrNextClass}
        />
      </TabsContent>

      <TabsContent value="statistics">
        <StatisticsContent
          mockData={mockData}
          selectedSemester={selectedSemester}
        />
      </TabsContent>

      <TabsContent value="events">
        <EventContent mockData={mockData} />
      </TabsContent>
    </Tabs>
  );
}


// Helper to determine class status based on time
const getClassStatus = (timeRange: string): "Ongoing" | "Upcoming" | "Past" => {
  const now = new Date();
  const [startTimeStr, endTimeStr] = timeRange.split(" - ");

  const parseTime = (timeStr: string): Date => {
    const date = new Date(now);
    date.setSeconds(0, 0); // Reset seconds and milliseconds

    const parts = timeStr.match(/(\d+):(\d+)( )?(AM|PM)?/);
    if (!parts) throw new Error("Invalid time format: " + timeStr);

    let hour = parseInt(parts[1], 10);
    const minute = parseInt(parts[2], 10);
    const period = parts[4]; // AM/PM or undefined

    if (period) {
      if (period === "PM" && hour !== 12) {
        hour += 12;
      } else if (period === "AM" && hour === 12) {
        hour = 0; // 12 AM is 00:00
      }
    }

    date.setHours(hour, minute, 0, 0);
    return date;
  };

  try {
    const startTime = parseTime(startTimeStr);
    const endTime = parseTime(endTimeStr);

    // If the end time is before the start time, assume it spans midnight
    // This is unlikely for class times but good for general robustness
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    if (now >= startTime && now <= endTime) {
      return "Ongoing";
    } else if (now < startTime) {
      return "Upcoming";
    } else {
      return "Past";
    }
  } catch (error) {
    console.error("Error parsing time range: ", timeRange, error);
    // Return 'Past' or 'Upcoming' as a fallback, as 'Unknown' is not in the type definition.
    // 'Past' seems safer if parsing fails, assuming we missed the time.
    return "Past";
  }
};

const getCurrentOrNextClass = (
  subjects: Subject[],
  mockData: MockData
): UpcomingClass | undefined => {
  const now = new Date();
  const upcoming: UpcomingClass[] = [];

  // Helper to parse time string (e.g., "10:00 AM" or "10:00 - 11:30") and return a comparable time value (e.g., "10:00")
  const parseComparableTime = (timeStr: string): string => {
    const parts = timeStr.split(" - ")[0].match(/(\d+):(\d+)/); // Get the start time part (e.g., "10:00")
    if (!parts) return "";
    return `${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  };

  subjects.forEach((subject) => {
    // Parse schedule string, e.g., 'Mon, Wed, Fri - 10:00 AM'
    const [daysStr, timeStr] = subject.schedule.split(" - ");
    const days = daysStr.split(",").map((d: string) => d.trim());
    const timeMatch = timeStr.match(/(\d+):(\d+)( )?(AM|PM)?/);
    if (!timeMatch) return;
    const hour = timeMatch[1];
    const min = timeMatch[2];
    const period = timeMatch[4];

    const comparableScheduleTime = parseComparableTime(timeStr);

    days.forEach((day: string) => {
      // Get next date for this day
      const dayIndex = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ].indexOf(day.slice(0, 3));
      if (dayIndex === -1) return;
      const classDate = new Date(now);
      classDate.setHours(
        period === "PM" && hour !== "12"
          ? +hour + 12
          : +hour === 12 && period === "AM"
          ? 0
          : +hour,
        +min,
        0,
        0
      );
      let diff = (dayIndex + 7 - now.getDay()) % 7;
      if (diff === 0 && classDate < now) diff = 7; // if today but already passed, go to next week
      classDate.setDate(now.getDate() + diff);

      // Find corresponding class in timetable to get room and floor using parsed time
      let classInTimetable = undefined;
      const fullTimetableDays = Object.keys(
        mockData.timetable
      ) as (keyof typeof mockData.timetable)[];
      for (const tableDay of fullTimetableDays) {
        classInTimetable = mockData.timetable[tableDay].find(
          (cls) =>
            cls.subject === subject.code &&
            parseComparableTime(cls.time) === comparableScheduleTime
        );
        if (classInTimetable) break; // Found a match, no need to check other days
      }

      if (classInTimetable) {
        upcoming.push({
          ...subject,
          classDate,
          room: classInTimetable.room,
          floor: classInTimetable.floor,
        });
      } else {
        // Fallback if class not found in full timetable (shouldn't happen with current mock data)
        upcoming.push({ ...subject, classDate, room: "N/A", floor: "N/A" });
      }
    });
  });
  // Sort by soonest
  upcoming.sort((a, b) => a.classDate.getTime() - b.classDate.getTime());

  // Filter for classes today that are ongoing or upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayUpcomingOrOngoing = upcoming.filter((item) => {
    const itemDate = new Date(item.classDate);
    itemDate.setHours(0, 0, 0, 0);
    // Check if the class is today and its time hasn't passed yet
    const itemTimeStr = item.schedule.split(" - ")[1];
    return (
      itemDate.getTime() === today.getTime() &&
      getClassStatus(itemTimeStr) !== "Past"
    );
  });

  // Return the soonest one from today, or the overall soonest if none today are upcoming/ongoing
  return todayUpcomingOrOngoing.length > 0
    ? todayUpcomingOrOngoing[0]
    : upcoming[0];
};
