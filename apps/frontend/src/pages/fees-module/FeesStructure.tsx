import React, { useState, useRef, useEffect } from "react";
import {
  Banknote,
  PlusCircle,
  Upload,
  FileDown,
  X,
  AlertCircle,
  Layers3,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import FeeStructureForm from "../../components/fees/fee-structure-form/FeeStructureForm";
import { getAllCourses, Course } from "../../services/course-api";
import { FeesStructureDto, AcademicYear } from "../../types/fees";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// import { api } from "@/utils/api";

// Hardcoded academic years
const academicYears: AcademicYear[] = [
  { id: 1, startYear: new Date("2023-07-01"), endYear: new Date("2024-06-30"), isCurrentYear: false },
  { id: 2, startYear: new Date("2024-07-01"), endYear: new Date("2025-06-30"), isCurrentYear: true },
  { id: 3, startYear: new Date("2025-07-01"), endYear: new Date("2026-06-30"), isCurrentYear: false },
];

// Mock FeesStructureDto data
const mockFeesStructures: FeesStructureDto[] = [
  {
    id: 1,
    closingDate: new Date("2024-06-30"),
    semester: 2,
    advanceForSemester: 1,
    shift: 'MORNING',
    startDate: new Date("2023-07-01"),
    endDate: new Date("2024-06-30"),
    onlineStartDate: new Date("2023-07-10"),
    onlineEndDate: new Date("2024-06-20"),
    numberOfInstalments: 2,
    instalmentStartDate: new Date("2023-08-01"),
    instalmentEndDate: new Date("2024-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    academicYear: academicYears[0], // 2023-2024
    course: {
      id: 3,
      name: "B.COM (H)",
      stream: {
        id: 3,
        name: "B.COM Stream",
        level: "UNDER_GRADUATE",
        framework: "CCF",
        degree: {
          id: 3,
          name: "B.COM",
          level: "UNDER_GRADUATE",
          sequence: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        degreeProgramme: "HONOURS",
        duration: 3,
        numberOfSemesters: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shortName: "B.COM (H)",
      codePrefix: "BCOM",
      universityCode: "U003"
    },
    advanceForCourse: null,
    components: [
      { id: 5, feesStructureId: 3, feesHeadId: 301, isConcessionApplicable: true, amount: 45000, sequence: 1, remarks: "Tuition Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 6, feesStructureId: 3, feesHeadId: 302, isConcessionApplicable: false, amount: 2000, sequence: 2, remarks: "Library Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 7, feesStructureId: 3, feesHeadId: 303, isConcessionApplicable: true, amount: 3000, sequence: 3, remarks: "Sports Fee", createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: 2,
    closingDate: new Date("2025-06-30"),
    semester: 2,
    advanceForSemester: 1,
    shift: 'MORNING',
    startDate: new Date("2024-07-01"),
    endDate: new Date("2025-06-30"),
    onlineStartDate: new Date("2024-07-10"),
    onlineEndDate: new Date("2025-06-20"),
    numberOfInstalments: 2,
    instalmentStartDate: new Date("2024-08-01"),
    instalmentEndDate: new Date("2025-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    academicYear: academicYears[1], // 2024-2025
    course: {
      id: 1,
      name: "BCA",
      stream: {
        id: 1,
        name: "BCA Stream",
        level: "UNDER_GRADUATE",
        framework: "CCF",
        degree: {
          id: 1,
          name: "BCA",
          level: "UNDER_GRADUATE",
          sequence: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        degreeProgramme: "HONOURS",
        duration: 3,
        numberOfSemesters: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shortName: "BCA",
      codePrefix: "BCA",
      universityCode: "U001"
    },
    advanceForCourse: null,
    components: [
      { id: 1, feesStructureId: 1, feesHeadId: 101, isConcessionApplicable: true, amount: 50000, sequence: 1, remarks: "Tuition Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, feesStructureId: 1, feesHeadId: 102, isConcessionApplicable: false, amount: 2500, sequence: 2, remarks: "Library Fee", createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: 3,
    closingDate: new Date("2025-06-30"),
    semester: 2,
    advanceForSemester: 1,
    shift: 'EVENING',
    startDate: new Date("2024-07-01"),
    endDate: new Date("2025-06-30"),
    onlineStartDate: new Date("2024-07-10"),
    onlineEndDate: new Date("2025-06-20"),
    numberOfInstalments: 2,
    instalmentStartDate: new Date("2024-08-01"),
    instalmentEndDate: new Date("2025-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    academicYear: academicYears[1], // 2024-2025
    course: {
      id: 2,
      name: "BBA",
      stream: {
        id: 2,
        name: "BBA Stream",
        level: "UNDER_GRADUATE",
        framework: "CCF",
        degree: {
          id: 2,
          name: "BBA",
          level: "UNDER_GRADUATE",
          sequence: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        degreeProgramme: "GENERAL",
        duration: 3,
        numberOfSemesters: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shortName: "BBA",
      codePrefix: "BBA",
      universityCode: "U002"
    },
    advanceForCourse: null,
    components: [
      { id: 3, feesStructureId: 2, feesHeadId: 201, isConcessionApplicable: true, amount: 60000, sequence: 1, remarks: "Tuition Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 4, feesStructureId: 2, feesHeadId: 202, isConcessionApplicable: false, amount: 3000, sequence: 2, remarks: "Sports Fee", createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: 4,
    closingDate: new Date("2025-06-30"),
    semester: 4,
    advanceForSemester: 1,
    shift: 'MORNING',
    startDate: new Date("2024-07-01"),
    endDate: new Date("2025-06-30"),
    onlineStartDate: new Date("2024-07-10"),
    onlineEndDate: new Date("2025-06-20"),
    numberOfInstalments: 2,
    instalmentStartDate: new Date("2024-08-01"),
    instalmentEndDate: new Date("2025-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    academicYear: academicYears[1], // 2024-2025
    course: {
      id: 1,
      name: "BCA",
      stream: {
        id: 1,
        name: "BCA Stream",
        level: "UNDER_GRADUATE",
        framework: "CCF",
        degree: {
          id: 1,
          name: "BCA",
          level: "UNDER_GRADUATE",
          sequence: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        degreeProgramme: "HONOURS",
        duration: 3,
        numberOfSemesters: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shortName: "BCA",
      codePrefix: "BCA",
      universityCode: "U001"
    },
    advanceForCourse: null,
    components: [
      { id: 8, feesStructureId: 4, feesHeadId: 101, isConcessionApplicable: true, amount: 52000, sequence: 1, remarks: "Tuition Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 9, feesStructureId: 4, feesHeadId: 102, isConcessionApplicable: false, amount: 2500, sequence: 2, remarks: "Library Fee", createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: 5,
    closingDate: new Date("2025-06-30"),
    semester: 4,
    advanceForSemester: 1,
    shift: 'EVENING',
    startDate: new Date("2024-07-01"),
    endDate: new Date("2025-06-30"),
    onlineStartDate: new Date("2024-07-10"),
    onlineEndDate: new Date("2025-06-20"),
    numberOfInstalments: 2,
    instalmentStartDate: new Date("2024-08-01"),
    instalmentEndDate: new Date("2025-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    academicYear: academicYears[1], // 2024-2025
    course: {
      id: 2,
      name: "BBA",
      stream: {
        id: 2,
        name: "BBA Stream",
        level: "UNDER_GRADUATE",
        framework: "CCF",
        degree: {
          id: 2,
          name: "BBA",
          level: "UNDER_GRADUATE",
          sequence: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        degreeProgramme: "GENERAL",
        duration: 3,
        numberOfSemesters: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shortName: "BBA",
      codePrefix: "BBA",
      universityCode: "U002"
    },
    advanceForCourse: null,
    components: [
      { id: 10, feesStructureId: 5, feesHeadId: 201, isConcessionApplicable: true, amount: 62000, sequence: 1, remarks: "Tuition Fee", createdAt: new Date(), updatedAt: new Date() },
      { id: 11, feesStructureId: 5, feesHeadId: 202, isConcessionApplicable: false, amount: 3000, sequence: 2, remarks: "Sports Fee", createdAt: new Date(), updatedAt: new Date() },
    ],
  },
];

// const steps = ["Academic Setup", "Slab Creation", "Fee Configuration", "Preview & Simulation"];

// const initialFeesStructure: FeesStructureDto = {
//   id: 0,
//   academicYear: {
//     endYear: new Date(),
//     startYear: new Date(),
//     isCurrentYear: true,
//   },
//   course: {
//     codePrefix: null,
//     name: "BCOM",
//     shortName: "",
//     stream: {
//       degree: {
//         level: "UNDER_GRADUATE",
//         name: "",
//         sequence: 1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       degreeProgramme: "HONOURS",
//       duration: 2,
//       framework: "CBCS",
//       level: "UNDER_GRADUATE",
//       name: "BCOM",
//       numberOfSemesters: 6,
//       createdAt: new Date(),
//       updatedAt: new Date(),

//     },
//     universityCode: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   semester: null,
//   closingDate: new Date(),
//   startDate: new Date(),
//   endDate: new Date(),
//   onlineStartDate: new Date(),
//   onlineEndDate: new Date(),
//   feesReceiptTypeId: 0,
//   advanceForCourse: null,
//   advanceForSemester: null,
//   numberOfInstalments: 1,
//   instalmentStartDate: new Date(),
//   instalmentEndDate: new Date(),
//   components: [],
// };

// Slab Management Component
interface SlabType {
  id: number;
  name: string;
  code: string;
  disabled: boolean;
}

const initialSlabData: SlabType[] = [
  { id: 1, name: "Merit Scholarship", code: "MERIT", disabled: false },
  { id: 2, name: "EWS Concession", code: "EWS", disabled: false },
  { id: 3, name: "Sports Quota", code: "SPORTS", disabled: false },
  { id: 4, name: "Staff Ward", code: "STAFF", disabled: true },
];

const SlabManagement: React.FC = () => {
  const [data, setData] = useState<SlabType[]>(initialSlabData);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SlabType | null>(null);
  const [form, setForm] = useState<SlabType>({
    id: 0,
    name: "",
    code: "",
    disabled: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredData, setFilteredData] = useState<SlabType[]>(initialSlabData);

  useEffect(() => {
    let updated = data;
    if (searchTerm) {
      updated = updated.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      updated = updated.filter((s) => (statusFilter === "enabled" ? !s.disabled : s.disabled));
    }
    setFilteredData(updated);
  }, [searchTerm, statusFilter, data]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Code", "Status"],
      ...filteredData.map((s) => [s.id, s.name, s.code, s.disabled ? "disabled" : "enabled"]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slab_types.csv";
    a.click();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim()) return;

    if (editingItem) {
      setData(data.map((item) => (item.id === editingItem.id ? { ...form, id: item.id } : item)));
    } else {
      setData([...data, { ...form, id: Date.now() }]);
    }

    handleClose();
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ id: 0, name: "", code: "", disabled: false });
  };

  const handleEdit = (item: SlabType) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id));
  };

  const totalSlabs = data.length;
  const enabledSlabs = data.filter((s) => !s.disabled).length;
  const disabledSlabs = data.filter((s) => s.disabled).length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Slabs</p>
                <p className="text-lg font-bold text-gray-900">{totalSlabs}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded">
                <Layers3 className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Enabled</p>
                <p className="text-lg font-bold text-gray-900">{enabledSlabs}</p>
              </div>
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Disabled</p>
                <p className="text-lg font-bold text-gray-900">{disabledSlabs}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded">
                <XCircle className="h-4 w-4 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search slab types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                showFilters
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {statusFilter !== "all" && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
              )}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                    }}
                    className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                #
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Code
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3">{item.name}</TableCell>
                  <TableCell className="px-4 py-3">{item.code}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.disabled
                          ? "bg-gray-100 text-gray-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.disabled ? "Disabled" : "Enabled"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button variant="link" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="link" size="sm" className="text-red-600" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-3 text-center">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Slab</DialogTitle>
            <DialogDescription>
              Make changes to the slab here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-3 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                placeholder="e.g., Merit Scholarship"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="col-span-3 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                placeholder="e.g., MERIT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FeesStructure: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  // const [showFilters, setShowFilters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filteredFeesStructures, setFilteredFeesStructures] = useState<FeesStructureDto[]>(mockFeesStructures);
  const [activeTab, setActiveTab] = useState<"fees" | "slabs">("fees");

  useEffect(() => {
    getAllCourses().then((res) => {
      if (res && res.payload) setCourses(res.payload);
    });
  }, []);

  useEffect(() => {
    let filtered = mockFeesStructures;

    if (selectedAcademicYear) {
      filtered = filtered.filter(
        (fs) => fs.academicYear?.id === selectedAcademicYear.id
      );
    }
    
    if (selectedCourse) {
      filtered = filtered.filter(
        (fs) => fs.course?.id === selectedCourse.id
      );
    }

    setFilteredFeesStructures(filtered);
  }, [selectedAcademicYear, selectedCourse]);

  const handleFileUpload = (file: File) => {
    console.log("Uploading file:", file.name);
    setTimeout(() => {
      alert("File uploaded successfully!");
    }, 1000);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Amount", "Category", "Applied To", "Due Date", "Status", "Description"],
      ...filteredFeesStructures.map((fee) => [
        fee.id,
        fee.course?.name || "",
        fee.components.reduce((sum, comp) => sum + comp.amount, 0).toLocaleString(),
        fee.course?.stream.degree.name || "",
        fee.course?.stream.degreeProgramme || "",
        fee.startDate?.toLocaleDateString() || "",
        fee.shift || "N/A",
        fee.components.map(comp => comp.remarks).join(", ")
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fees_structure.csv";
    a.click();
  };

  const handleFeeStructureSubmit = (formData: unknown) => {
    console.log("Fee Structure Form Data:", formData);
    setShowFeeStructureForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Fees Structure</h1>
            <p className="text-sm text-gray-600">Manage and organize fee structures</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            value={selectedAcademicYear?.id || ""}
            onChange={e => {
              const year = academicYears.find(y => y.id === Number(e.target.value));
              setSelectedAcademicYear(year || null);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.startYear.getFullYear()} - {year.endYear.getFullYear()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
          <select
            value={selectedCourse?.id || ""}
            onChange={e => {
              const course = courses.find(c => c.id === Number(e.target.value));
              setSelectedCourse(course || null);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
        <div className="self-end">
          <button
            onClick={() => setShowFeeStructureForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Create Fee Structure
          </button>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export
          </button>

          <div
            className={`relative border-2 border-dashed rounded-md transition-all ${isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
              }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("fees")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fees'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fees Structure
          </button>
          <button
            onClick={() => setActiveTab("slabs")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'slabs'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Slabs
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'fees' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
            {filteredFeesStructures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sr. No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Base Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFeesStructures.map((fs, index) => (
                      <tr key={fs.id}>
                        <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fs.semester}</td>
                        <td className="px-4 py-3 whitespace-nowrap">₹{fs.components.reduce((sum, comp) => sum + comp.amount, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fs.shift || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="text-purple-600 hover:text-purple-800 mr-2">Edit</button>
                          <button className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No fee structures found for the selected criteria.</p>
              </div>
            )}
          </div>
        ) : (
          <SlabManagement />
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add New Fee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Tuition Fee"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applied To</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., All Students"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Fee description..."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 py-1.5 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium"
                >
                  Add Fee
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeeStructureForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <FeeStructureForm onClose={() => setShowFeeStructureForm(false)} onSubmit={handleFeeStructureSubmit} />
        </div>
      )}
    </div>
  );
};

export default FeesStructure;
