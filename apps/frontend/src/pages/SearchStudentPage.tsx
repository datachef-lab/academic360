import { StudentSearchDataTable } from "@/components/StudentSearch/StudentSearchDataTable";
import { studentData } from "./students_data";
import { StudentSearchColumn } from "@/components/tables/resources/Search-student-column";

export default function SearchStudent() {
  return (
    <div className="w-full h-full  border-2 p-2 ">
      {/* <div className="max-h-[80vh] max-w-[80%] overflow-auto"> */}
        <StudentSearchDataTable 
          data={studentData} 
          columns={StudentSearchColumn} 
        />
{/* </div> */}
    </div>
  );
}
