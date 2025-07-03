import  { useMemo, useState } from "react";
import { courses, semesters, subjects } from "./mockData";
import { motion } from "framer-motion";

export interface Course {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: string;
}

export interface Subject {
  id: number;
  courseId: string;
  semesterId: string;
  subject: string;
  type: string;
  paper: string;
  materials?: string;
}

// Columns moved to separate file
import CourseMaterialTable from "./CourseMaterialTable";
import { CourseMaterialRow, Subject as SubjectType } from "./types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Header from "@/components/common/PageHeader";

import { FileIcon, Download, GraduationCap, Calendar, Filter } from "lucide-react";

const CourseMaterialPage = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course["id"]>(courses[0].id);
  const [selectedSemester, setSelectedSemester] = useState<Semester["id"]>(semesters[0].id);

  const filteredSubjects: CourseMaterialRow[] = useMemo(() =>
    (subjects as SubjectType[])
      .filter((s) => s.courseId === selectedCourse && s.semesterId === selectedSemester)
      .map((s) => ({
        id: s.id,
        subject: s.subject,
        type: s.type,
        paper: s.paper,
        materials: s.materials ?? undefined,
      })),
    [selectedCourse, selectedSemester]
  );

  const isLoading = false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen  bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-0 sm:px-2 lg:px-2"
    >

      <Header 
          className="" 
          icon={FileIcon} title="Course Materials" 
          subtitle="Manage course material links for students across all courses"
      />
    
    <div className="p-8">
      <div className="flex p-4 sm:p-6 flex-col border rounded-3xl shadow-md bg-gradient-to-br from-white to-slate-100 gap-6 sm:gap-8 mb-6">
        {/* Header with title and export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg shadow-md">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-sans font-semibold text-gray-800">
            Filter Options
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.05 }}>
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-2 transition-all">
              <Download className="h-4 w-4" /> Export
            </button>
          </motion.div>
        </div>
        {/* Filter Body */}
        <div className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between">
          <motion.div className="flex flex-wrap gap-3 w-full">
            {/* Course Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2 min-w-[120px]">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  {courses.find(c => c.id === selectedCourse)?.name || "Course"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto shadow-lg rounded-xl border border-slate-200 bg-white">
                {courses.map((c: Course) => (
                  <DropdownMenuItem key={c.id} onClick={() => setSelectedCourse(c.id)} className="hover:bg-slate-100">{c.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Semester Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2 min-w-[100px]">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  {semesters.find(s => s.id === selectedSemester)?.name || "Semester"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="shadow-lg rounded-xl border border-slate-200 bg-white">
                {semesters.map((s: Semester) => (
                  <DropdownMenuItem key={s.id} onClick={() => setSelectedSemester(s.id)} className="hover:bg-slate-100">{s.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </div>
      
      <CourseMaterialTable
        data={filteredSubjects}
        isLoading={isLoading}
      />
    </div>
    
       
    </motion.div>
  );
};

export default CourseMaterialPage;
