import React from "react";
import { Clock } from "lucide-react";
import { mockData } from "./data";
import { ClassSchedule } from "@/types/attendance";
import { Button } from "../ui/button";
import ClassCard from "./class-card";
import TimeTableDialog from "./time-table-dialog";

const todaySchedule = [
  ...(mockData.timetable[
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
    }) as keyof typeof mockData.timetable
  ] || []),
];

todaySchedule.push({
  time: "09:00 - 10:30",
  subject: "CS101",
  room: "101",
  floor: "1st",
});

todaySchedule.push({
  time: "10:00 - 11:30",
  subject: "MA101",
  room: "202",
  floor: "2nd",
});

todaySchedule.push({
  time: "13:00 - 14:30",
  subject: "MA101",
  room: "202",
  floor: "2nd",
});

// Sort the schedule by time for display
todaySchedule.sort((a, b) => {
  const timeA = new Date(`2000-01-01 ${a.time.split(" - ")[0]}`);
  const timeB = new Date(`2000-01-01 ${b.time.split(" - ")[0]}`);
  return timeA.getTime() - timeB.getTime();
});

export default function TodaySchedule() {
  const [isTimetableOpen, setIsTimetableOpen] = React.useState(false);

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-100 shadow-md">
        <h2 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-indigo-600" />
          Today&apos;s Schedule
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg text-left shadow-sm">
            <thead>
              <tr>
                {["Time", "Subject", "Room", "Status"].map((header, index) => (
                  <th
                    key={`header-${index}`}
                    className="p-3 text-left border-b bg-gray-100 text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Generate today's schedule including dummy data */}
              {todaySchedule.map((class_: ClassSchedule, index: number) => (
                <ClassCard key={`class-${index}`} class_={class_} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Example: Total classes today: 3, Attended: 2, Breaks: 1 */}
        <div className="mt-6 text-sm text-gray-600 italic">
          * This section displays your schedule for today. Dummy entries with
          dynamic times are included for demonstration purposes.
        </div>

        <Button
          className="mt-4 w-full"
          variant="outline"
          onClick={() => setIsTimetableOpen(true)}
        >
          View Full Timetable
        </Button>
      </div>

      <TimeTableDialog
        open={isTimetableOpen}
        setOpen={setIsTimetableOpen}
        mockData={mockData}
      />
    </>
  );
}
