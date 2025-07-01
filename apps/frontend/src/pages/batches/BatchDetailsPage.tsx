import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CustomPaginationState } from "@/components/settings/SettingsContent";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { QueryObserverResult } from "@tanstack/react-query";
import { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const mockBatch = {
  id: "batch-1",
  name: "Batch A",
  course: "BSc",
  section: "A",
  session: "2023-24",
  shift: "Morning",
};

const mockStudents = [
  { id: 1, name: "Alice Smith", roll: "101", subjects: ["Math", "Physics", "English", "Computer Science", "Chemistry", "Biology", "Civics", "Astronomy", "Fine Arts", "History"] },
  { id: 2, name: "Bob Jones", roll: "102", subjects: ["Math", "Chemistry", "Biology", "History", "Political Science", "Physics", "English", "Civics", "Environmental Science", "Computer Science"] },
  { id: 3, name: "Charlie Brown", roll: "103", subjects: ["Biology", "Physics", "Geography", "English", "Astronomy", "Math", "History", "Political Science", "Chemistry", "Civics"] },
  { id: 4, name: "Diana Prince", roll: "104", subjects: ["English", "History", "Political Science", "Math", "Biology", "Computer Science", "Chemistry", "Civics", "Fine Arts", "Physics"] },
  { id: 5, name: "Ethan Hunt", roll: "105", subjects: ["Math", "Biology", "Computer Science", "Physics", "Chemistry", "Geography", "Civics", "Environmental Science", "Astronomy", "English"] },
  { id: 6, name: "Fiona Gallagher", roll: "106", subjects: ["Physics", "Chemistry", "Environmental Science", "English", "History", "Civics", "Computer Science", "Math", "Biology", "Geography"] },
  { id: 7, name: "George Clooney", roll: "107", subjects: ["English", "Math", "Geography", "Chemistry", "Biology", "Political Science", "Civics", "Computer Science", "Physics", "Astronomy"] },
  { id: 8, name: "Hannah Baker", roll: "108", subjects: ["History", "Physics", "Civics", "Math", "English", "Biology", "Environmental Science", "Fine Arts", "Political Science", "Chemistry"] },
  { id: 9, name: "Ian Somerhalder", roll: "109", subjects: ["Chemistry", "Biology", "Math", "English", "Geography", "Computer Science", "Physics", "Astronomy", "History", "Civics"] },
  { id: 10, name: "Jane Foster", roll: "110", subjects: ["Math", "English", "Computer Science", "Physics", "Civics", "Environmental Science", "Astronomy", "Fine Arts", "Chemistry", "History"] },
  { id: 11, name: "Kevin Hart", roll: "111", subjects: ["Biology", "History", "Environmental Science", "Math", "Physics", "Computer Science", "English", "Civics", "Geography", "Astronomy"] },
  { id: 12, name: "Laura Palmer", roll: "112", subjects: ["Chemistry", "Math", "Physics", "Biology", "Political Science", "Fine Arts", "Civics", "Environmental Science", "History", "English"] },
  { id: 13, name: "Mike Ross", roll: "113", subjects: ["Physics", "History", "Political Science", "English", "Geography", "Civics", "Astronomy", "Chemistry", "Math", "Computer Science"] },
  { id: 14, name: "Nina Dobrev", roll: "114", subjects: ["English", "Biology", "Civics", "Fine Arts", "Physics", "Math", "Chemistry", "Environmental Science", "Computer Science", "History"] },
  { id: 15, name: "Oscar Isaac", roll: "115", subjects: ["Math", "Physics", "Chemistry", "Computer Science", "Astronomy", "History", "Biology", "English", "Political Science", "Civics"] },
  { id: 16, name: "Pam Beesly", roll: "116", subjects: ["History", "English", "Fine Arts", "Political Science", "Civics", "Environmental Science", "Geography", "Computer Science", "Math", "Physics"] },
  { id: 17, name: "Quinn Fabray", roll: "117", subjects: ["Biology", "Math", "Geography", "Chemistry", "Physics", "English", "Civics", "Computer Science", "History", "Political Science"] },
  { id: 18, name: "Ron Weasley", roll: "118", subjects: ["Chemistry", "Physics", "Astronomy", "Math", "Biology", "Civics", "English", "Computer Science", "History", "Geography"] },
  { id: 19, name: "Sarah Connor", roll: "119", subjects: ["English", "Chemistry", "Computer Science", "Math", "Biology", "Civics", "Astronomy", "Political Science", "Fine Arts", "Geography"] },
  { id: 20, name: "Tom Hanks", roll: "120", subjects: ["Physics", "Math", "Political Science", "English", "History", "Civics", "Chemistry", "Environmental Science", "Biology", "Geography"] },
];

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

// Add Student type for table

type Student = {
  id: number;
  name: string;
  roll: string;
  subjects: string[];
};

export default function BatchDetailsPage() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [batch, setBatch] = useState(mockBatch);
  const [editBatch, setEditBatch] = useState(batch);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalElements: mockStudents.length,
  });
  const [viewSubjectsModal, setViewSubjectsModal] = useState<{ open: boolean; subjects: string[]; studentName: string }>({ open: false, subjects: [], studentName: "" });

  const badgeVariantOptions: BadgeVariant[] = ["default", "secondary", "destructive", "outline"];

  const studentColumns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: "Student Name",
      cell: ({ row }) => {
        const name = row.original.name;
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();
        // Use a hash of the name to pick a color for consistency
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIdx = Math.abs(hash) % badgeVariantOptions.length;
        const badgeVariant = badgeVariantOptions[colorIdx];
        return (
          <span className="flex items-center gap-2 justify-start">
            <Badge variant={badgeVariant}>{initials}</Badge>
            {name}
          </span>
        );
      },
    },
    { accessorKey: "roll", header: "Roll Number" },
    {
      accessorKey: "subjects",
      header: "Enrolled Subjects",
      cell: ({ row }) => (
        <>
          <Button
            size="sm"
            variant="outline"
            className="px-3 py-1 text-xs font-medium"
            onClick={() => setViewSubjectsModal({ open: true, subjects: row.original.subjects, studentName: row.original.name })}
          >
            {row.original.subjects.length} Subjects
          </Button>
        </>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewSubjectsModal({ open: true, subjects: row.original.subjects, studentName: row.original.name })}>View</Button>
          <Button size="sm" variant="outline">Edit</Button>
          <Button size="sm" variant="destructive">Remove</Button>
        </div>
      ),
    },
  ];

  const handleEditOpen = () => {
    setEditBatch(batch);
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    setBatch(editBatch);
    setEditModalOpen(false);
  };

  // Filter students by search text
  const filteredStudents = mockStudents.filter(student => {
    const search = searchText.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.roll.toLowerCase().includes(search) ||
      student.subjects.join(", ").toLowerCase().includes(search)
    );
  });

  // Pagination logic
  const totalElements = filteredStudents.length;
  const totalPages = Math.ceil(totalElements / pagination.pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  // Update pagination state when filteredStudents changes
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalElements,
      totalPages,
      pageIndex: Math.min(prev.pageIndex, totalPages - 1),
    }));
  }, [totalElements, totalPages]);

  return (
    <>
      <div className="min-h-[100px] bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-2 sm:px-2 lg:px-2 rounded-2xl mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 py-3 px-4 sm:p-3"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-xl shadow-xl"
            >
              <CalendarDays className="h-7 w-7 drop-shadow-xl text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Batch Details</h2>
              <p className="text-xs text-purple-600 font-medium">
                View, edit, and manage batch and student information
              </p>
            </div>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-1 bg-gradient-to-r mt-1 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
          />
        </motion.div>
      </div>
      <div className="min-h-screen pt-2 px-2 sm:px-6 lg:px-12">
        <div className="max-w-full mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEditOpen} className="font-semibold">✏️ Edit Batch Details</Button>
              <Button className="font-semibold">➕ Add Student</Button>
              <Button className="font-semibold">📁 Bulk Upload Students</Button>
              <Button variant="outline">Download CSV</Button>
              <Button variant="outline">Download PDF</Button>
            </div>
          </div>
          {/* Batch Summary Card */}
          <div className="bg-white p-8 flex flex-col sm:flex-row gap-8 items-center border rounded-2xl shadow-md w-full">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
              <div><span className="text-gray-500 font-medium">Batch Name:</span> <span className="font-semibold text-gray-800">{batch.name}</span></div>
              <div><span className="text-gray-500 font-medium">Course:</span> <span className="font-semibold text-gray-800">{batch.course}</span></div>
              <div><span className="text-gray-500 font-medium">Section:</span> <span className="font-semibold text-gray-800">{batch.section}</span></div>
              <div><span className="text-gray-500 font-medium">Session:</span> <span className="font-semibold text-gray-800">{batch.session}</span></div>
              <div><span className="text-gray-500 font-medium">Shift:</span> <span className="font-semibold text-gray-800">{batch.shift}</span></div>
            </div>
          </div>
          {/* Students Table Card */}
          <div className="w-full bg-white rounded-2xl shadow-md border">
            <div className="p-8 pb-0">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">View Students</h3>
            </div>
            <div className="p-8 pt-0">
              <DataTable
                columns={studentColumns}
                data={paginatedStudents}
                pagination={pagination}
                isLoading={false}
                setPagination={setPagination}
                searchText={searchText}
                setSearchText={setSearchText}
                setDataLength={() => {}}
                refetch={async () => Promise.resolve({} as QueryObserverResult<Student[] | undefined, Error>)}
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
              <Input className="w-full" value={editBatch.name} onChange={e => setEditBatch({ ...editBatch, name: e.target.value })} placeholder="Batch Name" />
              <Input className="w-full" value={editBatch.course} onChange={e => setEditBatch({ ...editBatch, course: e.target.value })} placeholder="Course" />
              <Input className="w-full" value={editBatch.section} onChange={e => setEditBatch({ ...editBatch, section: e.target.value })} placeholder="Section" />
              <Input className="w-full" value={editBatch.session} onChange={e => setEditBatch({ ...editBatch, session: e.target.value })} placeholder="Session" />
              <Input className="w-full" value={editBatch.shift} onChange={e => setEditBatch({ ...editBatch, shift: e.target.value })} placeholder="Shift" />
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button onClick={handleEditSave} className="font-semibold">Save</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* View Subjects Modal */}
        <Dialog open={viewSubjectsModal.open} onOpenChange={open => setViewSubjectsModal(v => ({ ...v, open }))}>
          <DialogContent
            className="max-w-5xl min-w-[500px] min-h-[500px] max-h-[80vh] w-[90vw] h-[70vh] p-8 flex flex-col rounded-2xl shadow-lg"
            style={{ resize: 'both', overflow: 'auto', display: 'flex' }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold mb-2">Subjects for {viewSubjectsModal.studentName}</DialogTitle>
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
                  <div className="mb-2 font-semibold text-gray-700">Subject Details</div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border-b text-left">Semester</th>
                          <th className="px-4 py-2 border-b text-left">Category</th>
                          <th className="px-4 py-2 border-b text-left">irpName</th>
                          <th className="px-4 py-2 border-b text-left">Name</th>
                          <th className="px-4 py-2 border-b text-left">irpCode</th>
                          <th className="px-4 py-2 border-b text-left">marksheetCode</th>
                          <th className="px-4 py-2 border-b text-left">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewSubjectsModal.subjects.map((subject, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 border-b text-center">{(idx % 6) + 1}</td>
                            <td className="px-4 py-2 border-b text-center">Core</td>
                            <td className="px-4 py-2 border-b text-center">IRP-{idx + 1}</td>
                            <td className="px-4 py-2 border-b text-center">{subject}</td>
                            <td className="px-4 py-2 border-b text-center">IRPCODE{idx + 100}</td>
                            <td className="px-4 py-2 border-b text-center">MSC{idx + 1000}</td>
                            <td className="px-4 py-2 border-b text-center">{(idx % 4) + 2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
    </>
  );
}
