import React from "react";
import { MockData } from "./data";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

type TimeTableCardProps = {
  time: string;
  mockData: MockData;
};

export default function TimeTableCard({ time, mockData }: TimeTableCardProps) {
  const getClassForDayAndTime = (
    day: (typeof weekDays)[number],
    time: string
  ) => {
    return (mockData.timetable[day] || []).find((cls) => cls.time === time);
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 odd:bg-white even:bg-gray-50">
      <td className="p-3 border-b font-medium text-left bg-gray-50">{time}</td>
      {weekDays.map((day) => {
        const cls = getClassForDayAndTime(day, time);
        return (
          <td
            key={day}
            className="p-3 border-b align-top min-w-[120px] text-sm space-y-1"
          >
            {cls ? (
              <div>
                <div className="font-semibold text-indigo-800 text-base">
                  {cls.subject}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="block">Room: {cls.room}</span>
                  <span className="block">Floor: {cls.floor}</span>
                </div>
              </div>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}
