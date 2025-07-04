import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CustomPaginationState } from "@/components/settings/SettingsContent";
import React from "react";
// import { motion } from "framer-motion";
import { BookOpenIcon, CalendarDays, CalendarDaysIcon, HomeIcon } from "lucide-react";
import type { QueryObserverResult } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBatchDetailsById } from "@/services/batch";
import { BatchDetails, StudentBatchEntry, StudentBatchSubjectEntry } from "@/types/academics/batch";
import type { StudentStatus } from "@/types/enums";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Badge } from "@/components/ui/badge";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/batches",
    icon: HomeIcon,
  },
  {
    title: "Materials",
    url: "/dashboard/batches/materials",
    icon: BookOpenIcon,
  },
  {
    title: "Attendance & Time Table",
    url: "/dashboard/batches/attendance-time-table",
    icon: CalendarDaysIcon,
  },
];

export default function BatchDetailsPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<BatchDetails | null>(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalElements: 0,
  });
  const [viewSubjectsModal, setViewSubjectsModal] = useState<{
    open: boolean;
    subjects: string[];
    studentName: string;
  }>({ open: false, subjects: [], studentName: "" });

  const {
    data: batchDetails,
    isLoading,
    error,
  } = useQuery<BatchDetails>({
    queryKey: ["batchDetails", batchId],
    queryFn: async () => {
      const response = await getBatchDetailsById(batchId!);
      console.log(response);
      return response;
    },
    enabled: !!batchId,
  });

  // Prepare students data from batchDetails
  const paginatedStudentEntry = batchDetails?.paginatedStudentEntry;
  const students: StudentBatchEntry[] = paginatedStudentEntry?.content || [];

  // Map to StudentBatchSubjectEntry[]
  const studentSubjectRows: StudentBatchSubjectEntry[] = React.useMemo(() => {
    return students.flatMap((student) =>
      student.subjects.map((subject) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        roll: student.roll,
        registrationNumber: student.registrationNumber,
        uid: student.uid,
        subject,
        status: student.status as StudentStatus,
      })),
    );
  }, [students]);

  // Filter by search text
  const filteredRows = studentSubjectRows.filter((row) => {
    const search = searchText.toLowerCase();
    return (
      row.uid.toLowerCase().includes(search) ||
      row.studentName.toLowerCase().includes(search) ||
      (row.roll?.toLowerCase().includes(search) ?? false) ||
      (row.registrationNumber?.toLowerCase().includes(search) ?? false) ||
      row.subject.name.toLowerCase().includes(search) ||
      (row.subject.irpCode?.toLowerCase().includes(search) ?? false) ||
      row.status.toLowerCase().includes(search)
    );
  });

  // Pagination logic
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;
  const totalElements = filteredRows.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedRows = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Update pagination state when filteredRows changes
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalElements,
      totalPages,
      pageIndex: Math.min(prev.pageIndex, totalPages - 1),
    }));
  }, [totalElements, totalPages]);

  // Only now, after all hooks, do early returns:
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 p-4">Failed to load batch details.</div>;

  // Table columns for StudentBatchSubjectEntry
  const studentSubjectColumns: ColumnDef<StudentBatchSubjectEntry>[] = [
    { 
      accessorKey: "studentName", 
      header: "Name", 
      cell: ({ row }) => {
        const status = row.original.status;
        let statusColor = "bg-gray-200 text-gray-700";
        if (status === "ACTIVE") statusColor = "bg-green-100 text-green-800";
        else if (status === "DROPPED_OUT") statusColor = "bg-red-100 text-red-800";
        else if (status === "ALUMNI") statusColor = "bg-blue-100 text-blue-800";
        else if (status === "PENDING_CLEARANCE") statusColor = "bg-orange-100 text-orange-800";
        return (
          <div className="flex flex-col gap-1 min-w-[140px]">
            {/* <span className="inline-block text-sm font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 w-fit mb-0.5">{row.original.uid}</span> */}
            <span className="text-md font-bold text-gray-800 leading-tight">{row.original.studentName}</span>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${statusColor} w-fit mt-0.5`}>{status.replace(/_/g, ' ')}</span>
          </div>
        );
      }
    },
    { accessorKey: "uid", header: "UID" }, 
    { accessorKey: "roll", header: "Roll" },
    // { accessorKey: "registrationNumber", header: "Registration No." },
    {
      accessorKey: "subject.marksheetCode",
      header: "Paper Code",
      cell: ({ row }) => (
        <div>
          <p>{row.original.subject.marksheetCode}</p>
          <p className="text-xs text-red-500">{row.original.subject.irpCode}</p>
        </div>
      ),
    },
    // { accessorKey: "subject.irpCode", header: "IRP Code", cell: ({ row }) => row.original.subject.irpCode || "-" },
    {
      accessorKey: "subject.subjectType.name",
      header: "Type",
      cell: ({ row }) => (
        <div>
          {
            row.original.subject.subjectType && row.original.subject.subjectType.name && 
            <Badge variant={"outline"}>{row.original.subject.subjectType?.name}</Badge>
          }
        </div>
      ),
    },
    // { accessorKey: "status", header: "Status" },
    // {
    //   id: "actions",
    //   header: "Actions",
    //   cell: ({ row }) => (
    //     <div className="flex gap-2">
    //       <button
    //         className="p-1 rounded hover:bg-blue-100 text-blue-600"
    //         title="Edit"
    //         onClick={() => {/* TODO: handle edit */}}
    //       >
    //         <span role="img" aria-label="edit"><EditIcon/></span>
    //       </button>
    //       <button
    //         className="p-1 rounded hover:bg-red-100 text-red-600"
    //         title="Delete"
    //         onClick={() => {/* TODO: handle delete */}}
    //       >
    //         <span role="img" aria-label="delete"><Trash/></span>
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  // Edit modal uses BatchDetails fields
  const handleEditOpen = () => {
    setEditBatch(batchDetails || null);
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    setEditModalOpen(false);
  };

  return (
    <MasterLayout subLinks={subLinks}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
        {/* Main Content */}
        <div className="max-w-full mx-auto space-y-10">
          {/* Batch Summary Card */}
          <div className="bg-white flex flex-col sm:flex-row border rounded-2xl shadow-lg w-full overflow-hidden">
            {/* Left: Batch Details */}
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-800">Batch Summary</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                <div>
                  <span className="text-gray-500 font-medium">Course: </span>
                  <span className="font-semibold text-gray-800">{batchDetails?.course?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Class: </span>
                  <span className="font-semibold text-gray-800">{batchDetails?.academicClass?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Section: </span>
                  <span className="font-semibold text-gray-800">{batchDetails?.section?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Session: </span>
                  <span className="font-semibold text-gray-800">{batchDetails?.session?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Shift: </span>
                  <span className="font-semibold text-gray-800">{batchDetails?.shift?.name || '-'}</span>
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px bg-gradient-to-b from-purple-100 to-gray-200" />
            {/* Right: Actions */}
            <div className="flex flex-col gap-2 bg-gray-50 p-3 sm:p-4 w-full sm:max-w-xs items-end justify-center">
              <Button
                onClick={handleEditOpen}
                className="w-[180px] flex items-center gap-2 justify-center font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2"
              >
                <span role="img" aria-label="edit">✏️</span> Edit Batch Details
              </Button>

              <Button
                className="w-[180px] flex items-center gap-2 justify-center font-medium bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2"
              >
                <span role="img" aria-label="add">➕</span> Add Student
              </Button>

              <Button
                className="w-[180px] flex items-center gap-2 justify-center font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-md px-4 py-2"
              >
                <span role="img" aria-label="bulk">📁</span> Bulk Upload Students
              </Button>
            </div>

          </div>
          {/* Students Table Card */}
          <div className="w-full bg-white rounded-2xl shadow-md border">
            <div className="p-8 pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <Button variant="outline" className="flex items-center gap-2">
                    <span role="img" aria-label="view">👁️</span> View
                  </Button>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <span role="img" aria-label="csv">⬇️</span> Export
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-8 pt-0">
              <DataTable
                viewDataToolbar={false}
                columns={studentSubjectColumns}
                data={paginatedRows}
                pagination={pagination}
                isLoading={isLoading}
                setPagination={setPagination}
                searchText={searchText}
                setSearchText={setSearchText}
                setDataLength={() => { }}
                refetch={async () =>
                  Promise.resolve({} as QueryObserverResult<StudentBatchSubjectEntry[] | undefined, Error>)
                }
              />
            </div>
          </div>
        </div>
        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Batch Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input className="w-full" value={editBatch?.id || ""} readOnly placeholder="Batch ID" />
              <Input className="w-full" value={editBatch?.course?.name || ""} readOnly placeholder="Course" />
              <Input className="w-full" value={editBatch?.section?.name || ""} readOnly placeholder="Section" />
              <Input className="w-full" value={editBatch?.session?.name || ""} readOnly placeholder="Session" />
              <Input className="w-full" value={editBatch?.shift?.name || ""} readOnly placeholder="Shift" />
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button onClick={handleEditSave} className="font-semibold">
                Save
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* View Subjects Modal */}
        <Dialog open={viewSubjectsModal.open} onOpenChange={(open) => setViewSubjectsModal((v) => ({ ...v, open }))}>
          <DialogContent
            className="max-w-5xl min-w-[500px] min-h-[500px] max-h-[80vh] w-[90vw] h-[70vh] p-8 flex flex-col rounded-2xl shadow-lg"
            style={{ resize: "both", overflow: "auto", display: "flex" }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold mb-2">
                Subjects for {viewSubjectsModal.studentName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {viewSubjectsModal.subjects.length === 0 ? (
                <div className="text-gray-500">No subjects found.</div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="font-semibold text-gray-700 mb-2">Subject List</div>
                    <div className="flex flex-wrap gap-2">
                      {viewSubjectsModal.subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium border bg-gray-50 text-gray-700 border-gray-200`}
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="flex gap-2 justify-end pt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MasterLayout>
  );
}
