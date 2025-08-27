import { Calendar } from "lucide-react";
import React from "react";
import { MockData } from "./data";
import { Badge } from "../ui/badge";

type UpcomingHolidaysWidgetProps = {
  mockData: MockData;
};

export default function UpcomingHolidaysWidget({
  mockData,
}: UpcomingHolidaysWidgetProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-100 shadow-md">
        <h2 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
          Upcoming Holidays
        </h2>
        <div className="space-y-3">
          {mockData.holidays.map((holiday, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-indigo-500" />
                <div>
                  <p className="font-medium">{holiday.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(holiday.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  holiday.type === "academic"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"
                }
              >
                {holiday.type === "academic" ? "Academic" : "Public"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
