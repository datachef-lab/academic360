import React from "react";
import { Card, CardContent } from "../ui/card";
import { BarChart, Calendar, Clock } from "lucide-react";
import { MockData } from "./data";

type AttendanceStatsProps = {
  mockData: MockData;
  selectedSemester: string;
};

export default function AttendanceStats({
  mockData,
  selectedSemester,
}: AttendanceStatsProps) {
  const currentSubjects =
    mockData.subjects[
      selectedSemester as unknown as keyof typeof mockData.subjects
    ] || [];

  const calculateAttendancePercentage = (attended: number, total: number) => {
    return ((attended / total) * 100).toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-100 overflow-hidden">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">
                Average Attendance
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {currentSubjects.length > 0
                  ? (
                      currentSubjects.reduce(
                        (sum, subject) =>
                          sum +
                          Number(
                            calculateAttendancePercentage(
                              subject.attended,
                              subject.total
                            )
                          ),
                        0
                      ) / currentSubjects.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-200 text-blue-700">
              <BarChart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm mt-2 text-blue-600">
            Across {currentSubjects.length} subjects
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-green-100 overflow-hidden">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Classes This Week
              </p>
              <p className="text-2xl font-bold text-green-700">12</p>
            </div>
            <div className="p-3 rounded-xl bg-green-200 text-green-700">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm mt-2 text-green-600">3 remaining</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-purple-100 overflow-hidden">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">
                Subjects Below Threshold
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {
                  currentSubjects.filter(
                    (subject) =>
                      Number(
                        calculateAttendancePercentage(
                          subject.attended,
                          subject.total
                        )
                      ) < 75
                  ).length
                }
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-200 text-purple-700">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm mt-2 text-purple-600">
            75% attendance required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
