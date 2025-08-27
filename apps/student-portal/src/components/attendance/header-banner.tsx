import { ListChecks } from "lucide-react";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MockData } from "./data";


type HeaderBannerProps = {
  selectedSemester: string;
  setSelectedSemester: React.Dispatch<React.SetStateAction<string>>;
  mockData: MockData;
};

export default function HeaderBanner({
  selectedSemester,
  setSelectedSemester,
  mockData
}: HeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-10 px-6 mb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
        <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
        <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
        <div className="absolute inset-0 bg-[url('/illustrations/dots-pattern.svg')] opacity-5"></div>
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-5 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
              <ListChecks size={36} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                Attendance Tracker
              </h1>
              <p className="text-blue-50 text-lg drop-shadow max-w-2xl">
                Monitor your class attendance and stay on top of your academic
                requirements
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <Select
              value={selectedSemester}
              onValueChange={setSelectedSemester}
            >
              <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white backdrop-blur-sm">
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
        </div>
      </div>
    </div>
  );
}
