import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { MockData } from "./data";
import TimeTableCard from "./time-table-card";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

type TimeTableDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mockData: MockData;
};

export default function TimeTableDialog({
  open,
  setOpen,
  mockData,
}: TimeTableDialogProps) {
  // Helper to get all unique time slots
  const getAllTimeSlots = () => {
    const slots = new Set<string>();
    weekDays.forEach((day) => {
      (mockData.timetable[day] || []).forEach((cls) => {
        slots.add(cls.time);
      });
    });
    return Array.from(slots).sort();
  };

  const allTimeSlots = getAllTimeSlots();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Weekly Timetable</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg text-center shadow-sm">
            <thead>
              <tr>
                <th className="p-3 text-left border-b bg-gray-100 text-gray-700">
                  Time
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="p-3 border-b bg-gray-100 text-gray-700"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTimeSlots.map((time, index) => (
                <TimeTableCard
                  key={`time-${index}`}
                  time={time}
                  mockData={mockData}
                />
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
