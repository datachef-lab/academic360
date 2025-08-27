import { ClassSchedule } from "@/types/attendance";
import { Badge } from "lucide-react";
import React from "react";

type ClassCardProps = {
  class_: ClassSchedule;
};
export default function ClassCard({ class_ }: ClassCardProps) {
  const status = getClassStatus(class_.time);

  const badgeColor =
    status === "Ongoing"
      ? "bg-green-500 text-white border-green-600" // More colorful green
      : status === "Upcoming"
      ? "bg-blue-500 text-white border-blue-600" // More colorful blue
      : "bg-gray-500 text-white border-gray-600"; // Darker gray

  return (
    <tr
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 odd:bg-white even:bg-gray-50" // Added hover and alternating row colors
    >
      <td className="p-3">{class_.time}</td> {/* Increased padding */}
      <td className="p-3">{class_.subject}</td>
      <td className={`p-3`}>
        {" "}
        {/* Increased padding */}
        <div>{class_.room}</div> {/* Display room on a separate line */}
        <div className="text-xs text-gray-600">Floor: {class_.floor}</div>{" "}
        {/* Explicit label for floor, slightly darker text */}
      </td>
      <td className="p-3">
        {" "}
        {/* Increased padding */}
        <Badge className={badgeColor}>{status}</Badge>
      </td>
    </tr>
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
