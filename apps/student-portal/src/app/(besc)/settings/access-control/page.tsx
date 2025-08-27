"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Search,
  UserX,
  Users,
  UserCheck,
  UserX as UserRemoved,
  GraduationCap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { StudentAccessControl } from "@/types/academics/access-control";

// Extended type with guaranteed array for restrictedFeatures and isSuspended
type StudentWithAccess = StudentAccessControl;

// Types for student stats
type StudentStats = {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  alumniStudents: number;
  supplementaryStudents: number;
};

// Function to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// Add a function to compute the status string and badges
function getStudentStatus(student: StudentWithAccess) {
  if (student.status === "suspended") {
    return {
      status: "Suspended",
      color: "bg-red-100 text-red-700",
      badges: [],
    };
  }

  let status = "";
  let color = "";
  // Check for alumni by leavingdate first
  if (student.status === "alumni") {
    status = "Alumni";
    color = "bg-purple-100 text-purple-700";
  } else if (student.status === "dropped_out") {
    status = "Dropped Out";
    color = "bg-gray-100 text-gray-700";
  } else if (student.status === "active") {
    status = "Active";
    color = "bg-green-100 text-green-700";
  } else if (student.status === "supplementary") {
    status = "Supplementary";
    color = "bg-amber-100 text-amber-700";
  }

  return { status, color };
}

// Add a status color and label map for use in the Select
const statusLabelMap: Record<string, string> = {
  active: "Active",
  alumni: "Alumni",
  supplementary: "Supplementary",
  droppedout: "Dropped Out",
  suspended: "Suspended",
};

export default function AccessControlPage() {
  const { accessToken } = useAuth();
  const [students, setStudents] = useState<StudentWithAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithAccess | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    activeStudents: 0,
    suspendedStudents: 0,
    alumniStudents: 0,
    supplementaryStudents: 0,
  });

  // Fetch student statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!accessToken) return;

        const headers: HeadersInit = {
          Authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch("/api/student/stats", { headers });

        if (!response.ok) {
          // If the stats endpoint doesn't exist yet, we'll use placeholder data
          setStats({
            totalStudents: 0,
            activeStudents: 0,
            suspendedStudents: 0,
            alumniStudents: 0,
            supplementaryStudents: 0,
          });
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch {
        // Use placeholder data if the API fails
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          suspendedStudents: 0,
          alumniStudents: 0,
          supplementaryStudents: 0,
        });
      }
    };

    fetchStats();
  }, [accessToken]);

  // Search and fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);

        // Prepare the API URL
        const url = searchQuery.trim()
          ? `/api/student/search?page=${page}&size=${pageSize}&query=${encodeURIComponent(
              searchQuery
            )}`
          : `/api/student/list?page=${page}&size=${pageSize}`;

        // Set authorization header if accessToken exists
        const headers: HeadersInit = {};
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch students: ${response.status} ${response.statusText}`
          );
        }

        const result = (await response.json()) as {
          page: number;
          size: number;
          totalPages: number;
          data: StudentAccessControl[];
        };
        setStudents(
          (result.data || []).map((s): StudentWithAccess => {
            const sWithUnknown = s as unknown;
            return {
              ...s,
              imgFile: (sWithUnknown as { imgFile?: string }).imgFile ?? null,
            };
          })
        );
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to prevent excessive API calls
    const debounceTimeout = setTimeout(() => {
      if (accessToken) {
        fetchStudents();
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [page, accessToken, pageSize, searchQuery]);

  // Update student access permissions
  const updateStudentAccess = async (studentData: StudentWithAccess) => {
    setUpdateLoading(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/student/${studentData.id}/access`, {
        method: "PUT",
        headers,
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error("Failed to update student access");
      }

      // Optionally update local state/UI
      setStudents(
        students.map((student) =>
          student.id === studentData.id
            ? { ...student, ...studentData }
            : student
        )
      );

      setIsDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      // Refresh stats after update
      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };
      const response = await fetch("/api/student/stats", { headers });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
      setUpdateLoading(false);
    }
  };

  const openStudentDialog = (student: StudentWithAccess) => {
    setSelectedStudent({ ...student });
    setIsDialogOpen(true);
  };

  // Move columns definition here so openStudentDialog is in scope
  const columns: ColumnDef<StudentWithAccess>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage
                src={
                  student.imgFile
                    ? `https://74.207.233.48:8443/hrclIRP/studentimages/${student.imgFile}`
                    : undefined
                }
                alt={student.name || "student-profile-image"}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(student.name || "")}
              </AvatarFallback>
            </Avatar>
            <span>{student.name}</span>
          </div>
        );
      },
    },
    {
      header: "Code",
      accessorKey: "codeNumber",
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
    },
    {
      header: "Univ. Reg. No.",
      accessorKey: "univregno",
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
    },
    {
      header: "Univ. Roll No.",
      accessorKey: "univlstexmrollno",
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
    },
    {
      header: "CU Form No.",
      accessorKey: "cuformno",
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "institutionalemail",
      cell: ({ getValue }) => (
        <span
          className="text-sm max-w-[180px] truncate"
          title={getValue<string>()}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const { status, color } = getStudentStatus(row.original);
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-all duration-200 ${color}`}
          >
            {status}
            {/* {badges.map((badge: string, i: number) => (
              <span
                key={i}
                className="ml-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[10px] font-semibold"
                title={badge}
              >
                {badge === "Library access restricted"
                  ? "Library"
                  : badge === "Course materials restricted"
                  ? "Materials"
                  : badge}
              </span>
            ))} */}
          </span>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="default"
          size="sm"
          className="h-8 px-4 hover-scale flex items-center gap-1 shadow"
          onClick={() => openStudentDialog(row.original)}
        >
          <span>Manage</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Button>
      ),
    },
  ];

  // Table setup
  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchQuery,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onGlobalFilterChange: setSearchQuery,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex: page - 1, pageSize });
        setPage(newState.pageIndex + 1);
      } else if (typeof updater === "object") {
        setPage(updater.pageIndex + 1);
      }
    },
    manualPagination: false,
    manualFiltering: false,
  });

  // Show loading state on initial load
  if (isLoading && students.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Access Control</h2>
          <p className="text-muted-foreground text-sm">
            Manage student access to portal features
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          title="Active Students"
          value={stats.activeStudents.toLocaleString()}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          color="bg-green-50 border-green-100"
        />
        <StatCard
          title="Suspended Students"
          value={stats.suspendedStudents.toLocaleString()}
          icon={<UserRemoved className="h-5 w-5 text-red-600" />}
          color="bg-red-50 border-red-100"
        />
        <StatCard
          title="Alumni Students"
          value={stats.alumniStudents.toLocaleString()}
          icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50 border-purple-100"
        />
        <StatCard
          title="Supplementary Students"
          value={stats.supplementaryStudents.toLocaleString()}
          icon={<GraduationCap className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50 border-amber-100"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students by name, code, email..."
          className="pl-9 w-full"
          value={table.getState().globalFilter || ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-left">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-10"
                  >
                    <UserX className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      {searchQuery.trim() !== ""
                        ? "No students found matching your search"
                        : "No students available"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="py-5">
            <DataTablePagination table={table} />
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Dialog
          open={isDialogOpen || updateLoading}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Avatar className="h-12 w-12 rounded-full">
                  <AvatarImage
                    src={
                      selectedStudent.imgFile
                        ? `https://74.207.233.48:8443/hrclIRP/studentimages/${selectedStudent.imgFile}`
                        : undefined
                    }
                    alt={selectedStudent.name || "student-profile-image"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-base">
                    {getInitials(selectedStudent.name || "")}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle>Access for {selectedStudent.name}</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Control which features this student can access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <Label htmlFor="status" className="font-medium">
                    Account Status
                  </Label>
                </div>
                <Select
                  value={
                    selectedStudent?.status as
                      | "alumni"
                      | "active"
                      | "suspended"
                      | "supplementary"
                      | "dropped_out"
                      | string
                  }
                  onValueChange={(
                    value:
                      | "alumni"
                      | "active"
                      | "suspended"
                      | "dropped_out"
                      | string
                  ) => {
                    setSelectedStudent((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        status: value as
                          | "alumni"
                          | "active"
                          | "suspended"
                          | "supplementary"
                          | "dropped_out",
                      };
                    });
                  }}
                >
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusLabelMap).map((key) => (
                      <SelectItem key={key} value={key}>
                        {statusLabelMap[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Feature Access</h4>
                {[
                  {
                    id: "courseCatalogue",
                    label: "Course Catalogue",
                    description: "Browse and view courses",
                    key: "access_course",
                  },
                  {
                    id: "library",
                    label: "Library",
                    description: "Access library resources",
                    key: "access_library",
                  },
                  {
                    id: "exams",
                    label: "Exams",
                    description: "View and manage exams",
                    key: "access_exams",
                  },
                  {
                    id: "documents",
                    label: "Documents",
                    description: "View and download documents",
                    key: "access_documents",
                  },
                ].map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Label
                        htmlFor={feature.id}
                        className="font-medium text-sm"
                      >
                        {feature.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      id={feature.id}
                      checked={
                        selectedStudent[
                          feature.key as keyof StudentWithAccess
                        ] as boolean
                      }
                      onCheckedChange={(checked) => {
                        const updatedStudent = {
                          ...selectedStudent,
                          [feature.key as keyof StudentWithAccess]: checked,
                        };
                        setSelectedStudent(updatedStudent);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                disabled={updateLoading}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateLoading}
                onClick={() => updateStudentAccess(selectedStudent)}
              >
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className={`${color} border`}>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="rounded-full p-2 bg-white/80 shadow-sm">{icon}</div>
      </CardContent>
    </Card>
  );
}
