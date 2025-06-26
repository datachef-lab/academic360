import React, { useState, useEffect } from "react";
import { Wallet, AlertCircle, Search, Filter, FileDown, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface StudentFee {
  id: number;
  studentName: string;
  studentId: string;
  academicYear: string;
  feeType: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "paid" | "partial" | "overdue" | "pending";
  dueDate: string;
  lastPaymentDate?: string;
}

const initialData: StudentFee[] = [
  {
    id: 1,
    studentName: "Aarav Sharma",
    studentId: "STU001",
    academicYear: "2024-25",
    feeType: "Tuition Fee",
    totalAmount: 50000,
    paidAmount: 50000,
    dueAmount: 0,
    status: "paid",
    dueDate: "2024-04-15",
    lastPaymentDate: "2024-04-10",
  },
  {
    id: 2,
    studentName: "Priya Patel",
    studentId: "STU002",
    academicYear: "2024-25",
    feeType: "Tuition Fee",
    totalAmount: 50000,
    paidAmount: 25000,
    dueAmount: 25000,
    status: "partial",
    dueDate: "2024-06-15",
    lastPaymentDate: "2024-04-12",
  },
  {
    id: 3,
    studentName: "Arjun Reddy",
    studentId: "STU003",
    academicYear: "2024-25",
    feeType: "Hostel Fee",
    totalAmount: 30000,
    paidAmount: 0,
    dueAmount: 30000,
    status: "overdue",
    dueDate: "2024-05-15",
  },
  {
    id: 4,
    studentName: "Ananya Singh",
    studentId: "STU004",
    academicYear: "2024-25",
    feeType: "Library Fee",
    totalAmount: 2000,
    paidAmount: 2000,
    dueAmount: 0,
    status: "paid",
    dueDate: "2024-04-20",
    lastPaymentDate: "2024-04-18",
  },
  {
    id: 5,
    studentName: "Rohan Kumar",
    studentId: "STU005",
    academicYear: "2024-25",
    feeType: "Transport Fee",
    totalAmount: 15000,
    paidAmount: 0,
    dueAmount: 15000,
    status: "pending",
    dueDate: "2024-07-01",
  },
  {
    id: 6,
    studentName: "Kavya Nair",
    studentId: "STU006",
    academicYear: "2024-25",
    feeType: "Lab Fee",
    totalAmount: 8000,
    paidAmount: 0,
    dueAmount: 8000,
    status: "overdue",
    dueDate: "2024-05-30",
  },
  {
    id: 7,
    studentName: "Ishaan Gupta",
    studentId: "STU007",
    academicYear: "2024-25",
    feeType: "Tuition Fee",
    totalAmount: 50000,
    paidAmount: 30000,
    dueAmount: 20000,
    status: "partial",
    dueDate: "2024-06-30",
    lastPaymentDate: "2024-05-15",
  },
  {
    id: 8,
    studentName: "Diya Mehta",
    studentId: "STU008",
    academicYear: "2024-25",
    feeType: "Sports Fee",
    totalAmount: 5000,
    paidAmount: 0,
    dueAmount: 5000,
    status: "pending",
    dueDate: "2024-08-15",
  },
];

const feeTypes = ["Tuition Fee", "Hostel Fee", "Transport Fee", "Library Fee", "Lab Fee", "Sports Fee"];
const academicYears = ["2024-25", "2023-24", "2022-23"];

const StudentFees: React.FC = () => {
  const [data, setData] = useState<StudentFee[]>(initialData);
  const [filteredData, setFilteredData] = useState<StudentFee[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentFee | null>(null);
  const [form, setForm] = useState<StudentFee>({
    id: 0,
    studentName: "",
    studentId: "",
    academicYear: "2024-25",
    feeType: "Tuition Fee",
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: "pending",
    dueDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let updated = data;
    if (searchTerm) {
      updated = updated.filter(
        (fee) =>
          fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.feeType.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      updated = updated.filter((fee) => fee.status === statusFilter);
    }
    if (feeTypeFilter !== "all") {
      updated = updated.filter((fee) => fee.feeType === feeTypeFilter);
    }
    if (academicYearFilter !== "all") {
      updated = updated.filter((fee) => fee.academicYear === academicYearFilter);
    }
    setFilteredData(updated);
  }, [data, searchTerm, statusFilter, feeTypeFilter, academicYearFilter]);

  useEffect(() => {
    // Recalculate due amount whenever total or paid amount changes
    const calculatedDueAmount = Math.max(0, form.totalAmount - form.paidAmount);
    if (form.dueAmount !== calculatedDueAmount) {
      setForm((prev) => ({ ...prev, dueAmount: calculatedDueAmount }));
    }
  }, [form.totalAmount, form.paidAmount]);

  const handleExport = () => {
    const csvContent = [
      [
        "ID",
        "Student Name",
        "Student ID",
        "Academic Year",
        "Fee Type",
        "Total Amount",
        "Paid Amount",
        "Due Amount",
        "Status",
        "Due Date",
        "Last Payment Date",
      ],
      ...filteredData.map((fee) => [
        fee.id,
        fee.studentName,
        fee.studentId,
        fee.academicYear,
        fee.feeType,
        fee.totalAmount,
        fee.paidAmount,
        fee.dueAmount,
        fee.status,
        fee.dueDate,
        fee.lastPaymentDate || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_fees.csv";
    a.click();
  };

  const handleSubmit = () => {
    if (!form.studentName.trim() || !form.studentId.trim() || form.totalAmount <= 0 || !form.dueDate) return;

    let status: StudentFee["status"] = "pending";
    if (form.paidAmount >= form.totalAmount) {
      status = "paid";
    } else if (form.paidAmount > 0) {
      status = "partial";
    } else if (new Date(form.dueDate) < new Date()) {
      status = "overdue";
    }

    const updatedForm = { ...form, status, dueAmount: Math.max(0, form.totalAmount - form.paidAmount) };

    if (editingItem) {
      setData(data.map((item) => (item.id === editingItem.id ? { ...updatedForm, id: item.id } : item)));
    } else {
      setData([...data, { ...updatedForm, id: Date.now() }]);
    }
    handleClose();
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      id: 0,
      studentName: "",
      studentId: "",
      academicYear: "2024-25",
      feeType: "Tuition Fee",
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: "pending",
      dueDate: "",
    });
  };

  const handleEdit = (item: StudentFee) => {
    setEditingItem(item);
    setForm(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this fee record?")) return;
    setData(data.filter((fee) => fee.id !== id));
  };

  const totalStudents = new Set(data.map((fee) => fee.studentId)).size;
  const paidRecords = data.filter((fee) => fee.status === "paid").length;
  const overdueRecords = data.filter((fee) => fee.status === "overdue").length;
  const totalCollected = data.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalPending = data.reduce((sum, fee) => sum + fee.dueAmount, 0);

  const filterCount =
    (statusFilter !== "all" ? 1 : 0) + (feeTypeFilter !== "all" ? 1 : 0) + (academicYearFilter !== "all" ? 1 : 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "partial":
        return "bg-blue-100 text-blue-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Student Fees</h1>
            <p className="text-sm text-gray-600">Manage student fee payments and track dues</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Students</p>
                <p className="text-lg font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded">
                <Wallet className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Paid</p>
                <p className="text-lg font-bold text-gray-900">{paidRecords}</p>
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
                <p className="text-xs text-gray-600">Overdue</p>
                <p className="text-lg font-bold text-gray-900">{overdueRecords}</p>
              </div>
              <div className="p-2 bg-red-100 rounded">
                <Clock className="h-4 w-4 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Collected</p>
                <p className="text-lg font-bold text-gray-900">₹{totalCollected.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded">
                <DollarSign className="h-4 w-4 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded">
                <XCircle className="h-4 w-4 text-orange-700" />
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
              placeholder="Search students, fee types..."
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
              {filterCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">{filterCount}</span>
              )}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Wallet className="h-3.5 w-3.5" />
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
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Fee Type</label>
                  <select
                    value={feeTypeFilter}
                    onChange={(e) => setFeeTypeFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Fee Types</option>
                    {feeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Academic Year</label>
                  <select
                    value={academicYearFilter}
                    onChange={(e) => setAcademicYearFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Years</option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setFeeTypeFilter("all");
                      setAcademicYearFilter("all");
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
                Student
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                Academic Year
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Fee Type
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total Amount
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Paid
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Due
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
            {filteredData.length ? (
              filteredData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{item.studentName}</span>
                      <div className="text-xs text-gray-500">{item.studentId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <span className="text-sm text-gray-600">{item.academicYear}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      {item.feeType}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">₹{item.totalAmount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-sm text-green-600">₹{item.paidAmount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-red-600">₹{item.dueAmount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-purple-600 hover:text-purple-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 ml-4">
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No Fee Records Found</p>
                  <p className="text-sm text-gray-500 mt-1">Adjust your filters or add a new fee record.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fee Record" : "Add New Fee Record"}</DialogTitle>
            <DialogDescription>Manage student fee payments and track dues.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="e.g., Aarav Sharma"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value.toUpperCase() })}
                  placeholder="e.g., STU001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <select
                  id="academicYear"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <select
                  id="feeType"
                  value={form.feeType}
                  onChange={(e) => setForm({ ...form, feeType: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {feeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={form.totalAmount || ""}
                  onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={form.paidAmount || ""}
                  onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max={form.totalAmount}
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueAmount">Due Amount (₹)</Label>
                <Input id="dueAmount" type="number" value={form.dueAmount || ""} disabled className="bg-gray-100" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
              {editingItem ? "Update" : "Create"} Fee Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentFees;
