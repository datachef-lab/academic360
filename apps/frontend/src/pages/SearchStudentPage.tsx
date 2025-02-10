import { StudentSearchDataTable } from "@/components/StudentSearch/StudentSearchDataTable";
import { studentData } from "./students_data";
import { StudentSearchColumn } from "@/components/tables/resources/Search-student-column";

import { Country } from "country-state-city";
import { Button } from "@/components/ui/button";

export default function SearchStudent() {
  return (
    <div className="overflow-x-auto  w-full h-full  p-2 ">
      <Button variant="ghost" size="icon" className="text-xl">
        {Country.getAllCountries().find((ele) => ele.name === "India")?.flag}
      </Button>
      {/* <div className="max-h-[80vh] max-w-[80%] overflow-auto"> */}
      <StudentSearchDataTable data={studentData} columns={StudentSearchColumn} />
      {/* </div> */}
    </div>
  );
}
