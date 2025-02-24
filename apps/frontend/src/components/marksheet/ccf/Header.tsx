import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStreams } from "@/services/stream";
import { DegreeProgramme } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Header() {
  const [selectedStream, setSelectedStream] = useState<string>("BCOM");
  const [selectedCourse, setSelectedCourse] = useState<DegreeProgramme>("HONOURS");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const { data } = useQuery({
    queryKey: ["streams"],
    queryFn: async () => {
      const response = await getAllStreams();
      setSelectedStream(response.payload[0]?.name || "BCOM"); // Handle empty data case
      return response.payload;
    },
  });

  return (
    <div className="text-center mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md w-[1240px]">
      {/* University Title */}
      <h1 className="font-bold text-4xl text-blue-800 mb-2">UNIVERSITY OF CALCUTTA</h1>
      <h2 className="font-semibold text-xl text-blue-600 mb-6">Grade Card</h2>

      {/* Dropdowns Container */}
      <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
        {/* Stream Dropdown */}
        <div className="w-full sm:w-56">
          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="w-full bg-white border-blue-300 hover:border-blue-500 shadow-sm">
              <SelectValue placeholder="Select Stream" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-100 shadow-lg">
              {data?.map((stream) => (
                <SelectItem key={stream.id} value={stream.name} className="hover:bg-blue-50 focus:bg-blue-50">
                  {stream.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Course Dropdown */}
        <div className="w-full sm:w-56">
          <Select value={selectedCourse} onValueChange={(value) => setSelectedCourse(value as DegreeProgramme)}>
            <SelectTrigger className="w-full bg-white border-blue-300 hover:border-blue-500 shadow-sm">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-100 shadow-lg">
              <SelectItem value="HONOURS" className="hover:bg-blue-50 focus:bg-blue-50">
                HONOURS
              </SelectItem>
              <SelectItem value="GENERAL" className="hover:bg-blue-50 focus:bg-blue-50">
                GENERAL
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Semester Dropdown */}
        <div className="w-full sm:w-56">
          <Select value={selectedSemester.toString()} onValueChange={(value) => setSelectedSemester(Number(value))}>
            <SelectTrigger className="w-full bg-white border-blue-300 hover:border-blue-500 shadow-sm">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-100 shadow-lg">
              {Array.from({ length: 6 }, (_, index) => index + 1).map((semester) => (
                <SelectItem key={semester} value={semester.toString()} className="hover:bg-blue-50 focus:bg-blue-50">
                  Semester {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
