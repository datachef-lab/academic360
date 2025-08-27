import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar } from "lucide-react";

type SubjectCardProps = {
  subject: {
    code: string;
    name: string;
    attended: number;
    total: number;
    schedule: string;
    instructor: string;
    recentClasses: {
      date: string;
      status: string;
    }[];
  };
};

export default function SubjectCard({ subject }: SubjectCardProps) {
  const percentage = Number(
    calculateAttendancePercentage(subject.attended, subject.total)
  );
  const { status, textColor } = getAttendanceStatus(percentage);

  // Determine color theme based on attendance percentage
  const cardTheme =
    percentage >= 90
      ? "border-green-200 bg-gradient-to-br from-white to-green-50"
      : percentage >= 75
      ? "border-blue-200 bg-gradient-to-br from-white to-blue-50"
      : percentage >= 60
      ? "border-amber-200 bg-gradient-to-br from-white to-amber-50"
      : "border-red-200 bg-gradient-to-br from-white to-red-50";

  return (
    <Card
      className={`border-2 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden ${cardTheme}`}
    >
      <CardHeader className="pb-2 border-b border-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-gray-800">
              {subject.name}
              <Badge
                variant="outline"
                className="ml-2 text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {subject.code}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {subject.instructor} • {subject.schedule}
            </p>
          </div>
          <Badge
            className={`${
              percentage >= 75
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0"
                : "bg-gradient-to-r from-red-400 to-rose-500 text-white border-0"
            }`}
          >
            {percentage >= 75 ? "Above Threshold" : "Below Threshold"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold mr-2 text-gray-800">
                  {percentage}%
                </span>
                <span className={`text-sm font-medium ${textColor}`}>
                  {status}
                </span>
              </div>
              <span className="text-sm bg-white px-2 py-1 rounded-full text-gray-700 shadow-sm border border-gray-100">
                {subject.attended}/{subject.total} classes
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 mt-2 overflow-hidden shadow-inner">
              <div
                className={`h-4 rounded-full ${
                  percentage >= 90
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : percentage >= 75
                    ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                    : percentage >= 60
                    ? "bg-amber-400 to-orange-500"
                    : "bg-red-400 to-rose-500"
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {getClassesRequired(subject.attended, subject.total)}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm font-medium mb-2 text-gray-700 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
              Recent Classes
            </p>
            <div className="flex space-x-3">
              {subject.recentClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-2 py-1 rounded-md shadow-sm border ${
                    cls.status === "present"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      cls.status === "present" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {cls.date.split(",")[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const getClassesRequired = (attended: number, total: number) => {
  const current = (attended / total) * 100;
  if (current >= 75) return "Attendance threshold met";

  // Calculate classes needed to reach 75%
  const totalProjected = Math.ceil((attended * 100) / 75);
  const required = totalProjected - total;

  return `Need to attend ${required} more consecutive classes to reach 75%`;
};

const calculateAttendancePercentage = (attended: number, total: number) => {
  return ((attended / total) * 100).toFixed(1);
};

const getAttendanceStatus = (percentage: number) => {
  if (percentage >= 90)
    return {
      status: "Excellent",
      textColor: "text-green-600",
    };
  if (percentage >= 75)
    return {
      status: "Good",
      textColor: "text-emerald-500",
    };
  if (percentage >= 60)
    return {
      status: "Average",
      textColor: "text-yellow-500",
    };
  return { status: "Poor", textColor: "text-red-600" };
};
