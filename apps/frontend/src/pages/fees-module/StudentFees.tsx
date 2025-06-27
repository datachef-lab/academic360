import React, { useState } from "react";
import { Wallet, PlusCircle, Edit, Trash2, Search } from "lucide-react";
import Header from "../../components/common/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentFeesMappings, useFeesStructures } from "@/hooks/useFees";
import { StudentFeesMapping } from "@/types/fees";

const StudentFees: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<StudentFeesMapping[]>([]);
  const [form, setForm] = useState<{
    studentId: number;
    feesStructureId: number;
    type: "FULL" | "INSTALMENT";
    baseAmount: number;
    lateFee: number;
    totalPayable: number;
    amountPaid: number | null;
    paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
    paymentMode: "CASH" | "CHEQUE" | "ONLINE";
    receiptNumber: string | null;
  }>({
    studentId: 0,
    feesStructureId: 0,
    type: "FULL",
    baseAmount: 0,
    lateFee: 0,
    totalPayable: 0,
    amountPaid: null,
    paymentStatus: "PENDING",
    paymentMode: "CASH",
    receiptNumber: null,
  });

  const { 
    studentFeesMappings, 
    loading, 
    addStudentFeesMapping, 
    updateStudentFeesMappingById, 
    deleteStudentFeesMappingById 
  } = useStudentFeesMappings();

  const { feesStructures } = useFeesStructures();

  React.useEffect(() => {
    let updated = studentFeesMappings;
    if (searchTerm) {
      updated = updated.filter(
        (s) =>
          s.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredData(updated);
  }, [searchTerm, studentFeesMappings]);

  const handleSubmit = async () => {
    if (!form.studentId || !form.feesStructureId) return;
    
    try {
      if (editingId) {
        await updateStudentFeesMappingById(editingId, form);
        setEditingId(null);
      } else {
        await addStudentFeesMapping(form as StudentFeesMapping);
      }
      setForm({
        studentId: 0,
        feesStructureId: 0,
        type: "FULL",
        baseAmount: 0,
        lateFee: 0,
        totalPayable: 0,
        amountPaid: null,
        paymentStatus: "PENDING",
        paymentMode: "CASH",
        receiptNumber: null,
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving student fees mapping:", error);
    }
  };

  const handleEdit = (mapping: StudentFeesMapping) => {
    setEditingId(mapping.id!);
    setForm({
      studentId: mapping.studentId,
      feesStructureId: mapping.feesStructureId,
      type: mapping.type,
      baseAmount: mapping.baseAmount,
      lateFee: mapping.lateFee,
      totalPayable: mapping.totalPayable,
      amountPaid: mapping.amountPaid,
      paymentStatus: mapping.paymentStatus,
      paymentMode: mapping.paymentMode,
      receiptNumber: mapping.receiptNumber,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this student fees mapping?")) {
      await deleteStudentFeesMappingById(id);
    }
  };

  const handleCancel = () => {
    setForm({
      studentId: 0,
      feesStructureId: 0,
      type: "FULL",
      baseAmount: 0,
      lateFee: 0,
      totalPayable: 0,
      amountPaid: null,
      paymentStatus: "PENDING",
      paymentMode: "CASH",
      receiptNumber: null,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
        <Header title="Student Fees" subtitle="Manage student fee payments" icon={Wallet} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading student fees mappings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Student Fees" subtitle="Manage student fee payments" icon={Wallet} />

      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search student fees mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Student Fees
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              type="number"
              placeholder="Student ID"
              value={form.studentId || ""}
              onChange={(e) => setForm((p) => ({ ...p, studentId: parseInt(e.target.value) || 0 }))}
            />
            <select
              value={form.feesStructureId || ""}
              onChange={(e) => setForm((p) => ({ ...p, feesStructureId: parseInt(e.target.value) || 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Fees Structure</option>
              {feesStructures.map(structure => (
                <option key={structure.id} value={structure.id}>
                  {structure.course?.name} - {structure.academicYear?.startYear}
                </option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "FULL" | "INSTALMENT" }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="FULL">Full Payment</option>
              <option value="INSTALMENT">Instalment</option>
            </select>
            <Input
              type="number"
              placeholder="Base Amount"
              value={form.baseAmount || ""}
              onChange={(e) => setForm((p) => ({ ...p, baseAmount: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              type="number"
              placeholder="Late Fee"
              value={form.lateFee || ""}
              onChange={(e) => setForm((p) => ({ ...p, lateFee: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              type="number"
              placeholder="Total Payable"
              value={form.totalPayable || ""}
              onChange={(e) => setForm((p) => ({ ...p, totalPayable: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              type="number"
              placeholder="Amount Paid"
              value={form.amountPaid || ""}
              onChange={(e) => setForm((p) => ({ ...p, amountPaid: parseFloat(e.target.value) || null }))}
            />
            <select
              value={form.paymentStatus}
              onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED" }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={form.paymentMode}
              onChange={(e) => setForm((p) => ({ ...p, paymentMode: e.target.value as "CASH" | "CHEQUE" | "ONLINE" }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
            </select>
            <Input
              placeholder="Receipt Number"
              value={form.receiptNumber || ""}
              onChange={(e) => setForm((p) => ({ ...p, receiptNumber: e.target.value || null }))}
            />
            <div className="col-span-full flex gap-2 justify-end">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-md bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Student ID</TableHead>
              <TableHead className="text-center">Fees Structure</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-center">Base Amount</TableHead>
              <TableHead className="text-center">Total Payable</TableHead>
              <TableHead className="text-center">Amount Paid</TableHead>
              <TableHead className="text-center">Payment Status</TableHead>
              <TableHead className="text-center">Receipt Number</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.studentId}</TableCell>
                  <TableCell className="text-center">
                    {feesStructures.find(fs => fs.id === row.feesStructureId)?.course?.name || row.feesStructureId}
                  </TableCell>
                  <TableCell className="text-center">{row.type}</TableCell>
                  <TableCell className="text-center">₹{row.baseAmount}</TableCell>
                  <TableCell className="text-center">₹{row.totalPayable}</TableCell>
                  <TableCell className="text-center">₹{row.amountPaid || 0}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      row.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      row.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      row.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{row.receiptNumber || '-'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentFees;