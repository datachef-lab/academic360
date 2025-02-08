import { StudentSearchDataTable } from "@/components/StudentSearch/StudentSearchDataTable";
import { studentData } from "./students_data";
import { StudentSearchColumn } from "@/components/tables/resources/Search-student-column";

export default function SearchStudent() {
  return (
    <div className="overflow-x-auto  w-full h-full  p-2 ">
      {/* <div className="max-h-[80vh] max-w-[80%] overflow-auto"> */}
        <StudentSearchDataTable 
          data={studentData} 
          columns={StudentSearchColumn} 
        />
{/* </div> */}
    </div>
  );
}
