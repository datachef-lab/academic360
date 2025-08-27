import React from "react";
import { Badge } from "../ui/badge";
import { UpcomingClass } from "@/types/attendance";
import { Button } from "../ui/button";
import { CheckCircle2, Clock, MapPin } from "lucide-react";

type CurrentNextClassCardProps = {
  currentOrNextClass: UpcomingClass;
};

export default function CurrentNextClassCard({
  currentOrNextClass,
}: CurrentNextClassCardProps) {
  const getClassStatus = (
    timeRange: string
  ): "Ongoing" | "Upcoming" | "Past" => {
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

  const currentOrNextClassStatus = currentOrNextClass
    ? getClassStatus(currentOrNextClass.schedule.split(" - ")[1])
    : null;
  const statusBadgeColor =
    currentOrNextClassStatus === "Ongoing"
      ? "bg-green-100 text-green-800"
      : currentOrNextClassStatus === "Upcoming"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="bg-white/90 border border-indigo-100 rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-lg text-indigo-800">
            {currentOrNextClass.name}
          </span>
          <Badge
            variant="outline"
            className="ml-2 text-xs bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm"
          >
            {currentOrNextClass.code}
          </Badge>
          {currentOrNextClassStatus && (
            <Badge className={`ml-2 text-xs font-semibold ${statusBadgeColor}`}>
              {currentOrNextClassStatus}
            </Badge>
          )}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          {currentOrNextClass.instructor}
        </div>
        <div className="text-gray-500 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          {currentOrNextClass.schedule}
          <MapPin className="w-4 h-4 ml-4 text-indigo-500" />
          <span className="font-medium text-gray-600">
            {currentOrNextClass.room}
          </span>
          , <span className="text-gray-600">{currentOrNextClass.floor}</span>
        </div>
      </div>
      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-base font-semibold w-full md:w-auto mt-4 md:mt-0">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        Mark Attendance
      </Button>
    </div>
  );
}
