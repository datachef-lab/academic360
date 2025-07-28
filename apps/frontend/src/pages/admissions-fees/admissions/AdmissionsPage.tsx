import { UserDataTable } from "@/pages/DataTableTest";
import { columns } from "@/pages/column";
import { dummyUsers } from "@/pages/dummyData";
import { Button } from "@/components/ui/button";
import { CustomPaginationState } from "@/components/ui/simple-data-table";
import React from "react";
import { PlusCircle } from "lucide-react";
import { QueryObserverResult } from "@tanstack/react-query";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { useNavigate } from "react-router-dom";
// import CreateAdmissionDialog from "./components/CreateAdmissionDialog";
// import AdmissionsStats from "./components/AdmissionsStats";
// import AdmissionConfigureDialog from "./components/AdmissionConfigureDialog";
// import {  AdmissionSummary, Stats } from "./types";
// import { fetchStatsSummary, fetchAdmissionSummaries, createAdmission } from "@/services/admissions.service";
// import { getAllCourses } from "@/services/course-api";
// import { Course } from "@/types/course-design/course";
// import { Admission } from "@/types/admissions";

export default function AdmissionsPage() {
  const [pagination, setPagination] = React.useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalElements: dummyUsers.length,
    totalPages: Math.ceil(dummyUsers.length / 10),
  });
  const [searchText, setSearchText] = React.useState("");
  const setDataLength = React.useState(dummyUsers.length)[1];

  const refetch = async () => {
    return {
      data: dummyUsers,
      error: null,
      isFetching: false,
      status: "success",
    } as QueryObserverResult<
      { id: number; name: string; position: string; email: string; contact: string; avatarColor: string }[] | undefined,
      Error
    >;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admissions</h1>
          <p className="text-gray-500">Manage student admissions.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Admission
        </Button>
      </div>
      <UserDataTable
        columns={columns}
        data={dummyUsers}
        pagination={pagination}
        setPagination={setPagination}
        isLoading={false}
        searchText={searchText}
        setSearchText={setSearchText}
        setDataLength={setDataLength}
        refetch={refetch}
      />
    </div>
  );
}
