import { useMarksheetFilterStore } from "@/components/globals/useMarksheetFilterStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { getAllStreams } from "@/services/stream";
import { ProgrammeType } from "@/types/enums";
// import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface HeaderProps {
  selectedSemester?: number;
  hideSemesterDropdown?: boolean;
}

export default function Header({ selectedSemester, hideSemesterDropdown }: HeaderProps) {
  // const [selectedStream, setSelectedStream] = useState<string>("BCOM");
  const [selectedCourse, setSelectedCourse] = useState<ProgrammeType>("HONOURS");
  const [selectedSemesterState, setSelectedSemester] = useState<number>(1);
  const {setSemester,setCategory,Category,semester}=useMarksheetFilterStore();

    const handleCourseTypeChange = (value: string) => {
    setSelectedCourse(value as ProgrammeType);
    setCategory(value);
  };
   const handleSemesterChange = (value: string) => {
    const numValue = Number(value);
    setSelectedSemester(numValue);
    setSemester(numValue);
  };

  // const { data } = useQuery({
  //   queryKey: ["streams"],
  //   queryFn: async () => {
  //     const response = await getAllStreams();
  //     setSelectedStream(response[0]?.name || "BCOM"); // Handle empty data case
  //     return response;
  //   },
  // });

  return (
    <div className="text-center w-full mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md ">
      {/* University Title */}
      <h1 className="font-bold text-4xl text-blue-800 mb-2">UNIVERSITY OF CALCUTTA</h1>
      <h2 className="font-semibold text-xl text-blue-600 mb-6">Grade Card</h2>

      {/* Dropdowns Container */}
      <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
        {/* Stream Dropdown */}
        {/* <div className="w-full sm:w-56">
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
        </div> */}

        {/* Course Dropdown */}
        <div className="w-full sm:w-56">
          <Select  
          value={Category ?? selectedCourse ?? undefined}
            onValueChange={handleCourseTypeChange}
            >
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

        {/* Semester Dropdown or Plain Text */}
        <div className="w-full sm:w-56">
          {hideSemesterDropdown && selectedSemester ? (
            <div className="py-2 px-4 bg-white border border-blue-300 rounded shadow-sm text-lg font-semibold text-blue-700">
              Semester {selectedSemester}
            </div>
          ) : (
            <Select 
              value={semester?.toString() || selectedSemesterState.toString()}
              onValueChange={handleSemesterChange}
            >
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
          )}
        </div>
      </div>
    </div>
  );
}
