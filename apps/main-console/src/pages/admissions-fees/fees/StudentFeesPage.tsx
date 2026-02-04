import React, { useState, useCallback } from "react";
import { Wallet, Edit, Trash2, Search, Eye, CreditCard, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import { toast } from "sonner";
import {
  getFeeStudentMappingsByStudentId,
  updateStudentFeesMapping,
  deleteStudentFeesMapping,
} from "@/services/fees-api";
import { useError } from "@/hooks/useError";
import {
  fetchStudentByUid,
  getSearchedStudentsByRollNumber,
  getSearchedStudents,
  getStudentById,
} from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { UserAvatar } from "@/hooks/UserAvatar";

const StudentFeesPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDto | null>(null);
  const [mappings, setMappings] = useState<FeeStudentMappingDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeStudentMappingDto | null>(null);
  const [selectedSummaryItem, setSelectedSummaryItem] = useState<FeeStudentMappingDto | null>(null);
  const [editingItem, setEditingItem] = useState<FeeStudentMappingDto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [waivedOffForm, setWaivedOffForm] = useState({
    isWaivedOff: false,
    waivedOffAmount: 0,
    waivedOffReason: "",
    waivedOffDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState<FeeStudentMappingDto | null>(null);
  const [notificationItem, setNotificationItem] = useState<FeeStudentMappingDto | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentMode: "CASH" as "CASH" | "CHEQUE" | "ONLINE",
  });
  const [notificationForm, setNotificationForm] = useState({
    message: "",
    notificationType: "EMAIL" as "EMAIL" | "WHATSAPP",
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const { showError } = useError();
  const { user } = useAuth();

  // Fetch all fee-student-mappings for a student
  const fetchStudentMappings = useCallback(
    async (studentId: number) => {
      try {
        setLoading(true);
        const response = await getFeeStudentMappingsByStudentId(studentId);
        if (response.payload) {
          setMappings(response.payload);
        } else {
          setMappings([]);
        }
      } catch (error) {
        console.error("Error fetching student fees mappings:", error);
        showError({ message: "Failed to fetch student fees mappings" });
        setMappings([]);
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  // Search for student by UID, roll number, or registration number
  const handleStudentSearch = useCallback(async () => {
    if (!searchText.trim()) {
      setSelectedStudent(null);
      setMappings([]);
      return;
    }

    try {
      setSearching(true);
      const searchValue = searchText.trim();

      // Try to find student by UID first (most reliable)
      try {
        const student = await fetchStudentByUid(searchValue);
        if (student && student.id) {
          setSelectedStudent(student);
          // Fetch all fee-student-mappings for this student
          await fetchStudentMappings(student.id);
          return;
        }
      } catch (uidError) {
        // UID search failed, try general search
      }

      // Try general student search (searches across multiple fields)
      try {
        const searchResults = await getSearchedStudents(searchValue, 1, 10);
        if (searchResults.content && searchResults.content.length > 0) {
          // Get the first matching student's full details
          const firstMatch = searchResults.content[0];
          if (firstMatch && firstMatch.id) {
            const student = await getStudentById(firstMatch.id);
            if (student && student.id) {
              setSelectedStudent(student);
              // Fetch all fee-student-mappings for this student
              await fetchStudentMappings(student.id);
              return;
            }
          }
        }
      } catch (searchError) {
        // General search failed, try roll number specific search
      }

      // Try to find student by roll number (specific endpoint)
      try {
        const student = await getSearchedStudentsByRollNumber(searchValue);
        if (student && student.id) {
          setSelectedStudent(student);
          // Fetch all fee-student-mappings for this student
          await fetchStudentMappings(student.id);
          return;
        }
      } catch (rollError) {
        // Roll number search failed
      }

      // If all searches failed, show error
      toast.error("Student not found. Please check the UID, Roll Number, or Registration Number.");
      setSelectedStudent(null);
      setMappings([]);
    } catch (error) {
      console.error("Error searching for student:", error);
      toast.error("Failed to search for student. Please try again.");
      setSelectedStudent(null);
      setMappings([]);
    } finally {
      setSearching(false);
    }
  }, [searchText, fetchStudentMappings]);

  // Handle search on Enter key or when search button is clicked
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleStudentSearch();
  };

  const handleDeleteClick = (mapping: FeeStudentMappingDto) => {
    setDeletingItem(mapping);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem?.id || !selectedStudent?.id) return;

    try {
      await deleteStudentFeesMapping(deletingItem.id);
      toast.success("Student fees mapping deleted successfully");
      setShowDeleteModal(false);
      setDeletingItem(null);
      // Reload mappings for the selected student
      await fetchStudentMappings(selectedStudent.id);
    } catch (error) {
      console.error("Error deleting student fees mapping:", error);
      toast.error("Failed to delete student fees mapping. Please try again.");
    }
  };

  const handleEdit = (mapping: FeeStudentMappingDto) => {
    setEditingItem(mapping);
    setWaivedOffForm({
      isWaivedOff: mapping.isWaivedOff || false,
      waivedOffAmount: mapping.waivedOffAmount || 0,
      waivedOffReason: mapping.waivedOffReason || "",
      waivedOffDate: "", // Date will be auto-set when saving
    });
    setShowEditModal(true);
  };

  const handleSaveWaivedOff = async () => {
    if (!editingItem?.id || !user?.id) {
      toast.error("Missing required information");
      return;
    }

    if (waivedOffForm.isWaivedOff && (!waivedOffForm.waivedOffAmount || waivedOffForm.waivedOffAmount <= 0)) {
      toast.error("Please enter a valid waived off amount");
      return;
    }

    if (waivedOffForm.isWaivedOff && !waivedOffForm.waivedOffReason.trim()) {
      toast.error("Please provide a reason for waiver");
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        isWaivedOff: waivedOffForm.isWaivedOff,
        waivedOffAmount: waivedOffForm.isWaivedOff ? waivedOffForm.waivedOffAmount : 0,
        waivedOffReason: waivedOffForm.isWaivedOff ? waivedOffForm.waivedOffReason : null,
        // Auto-set waived off date to current date/time when waiver is enabled
        waivedOffDate: waivedOffForm.isWaivedOff ? new Date().toISOString() : null,
        waivedOffByUserId: waivedOffForm.isWaivedOff ? user.id : null,
      };

      await updateStudentFeesMapping(editingItem.id, updateData);
      toast.success("Waived off details updated successfully");
      setShowEditModal(false);
      setEditingItem(null);

      // Reload mappings if student is selected
      if (selectedStudent?.id) {
        await fetchStudentMappings(selectedStudent.id);
      }
    } catch (error) {
      console.error("Error updating waived off details:", error);
      toast.error("Failed to update waived off details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentItem?.id) {
      toast.error("Missing payment information");
      return;
    }

    if (!paymentForm.amountPaid || paymentForm.amountPaid <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    // For online payments, transaction details will be auto-populated from gateway
    // No manual validation needed for transaction reference

    try {
      setProcessingPayment(true);
      const updateData: any = {
        amountPaid: paymentForm.amountPaid,
        paymentMode: paymentForm.paymentMode,
        paymentStatus:
          paymentForm.amountPaid >= (paymentItem.totalPayable || 0)
            ? "COMPLETED"
            : paymentForm.amountPaid > 0
              ? "PENDING"
              : "PENDING",
      };

      await updateStudentFeesMapping(paymentItem.id, updateData);
      toast.success("Payment recorded successfully");
      setShowPaymentModal(false);
      setPaymentItem(null);

      // Reload mappings if student is selected
      if (selectedStudent?.id) {
        await fetchStudentMappings(selectedStudent.id);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleNotificationSubmit = async () => {
    if (!notificationItem || !selectedStudent) {
      toast.error("Missing notification information");
      return;
    }

    if (!notificationForm.message.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    try {
      setSendingNotification(true);
      // TODO: Implement notification API call
      // For now, just show a success message
      toast.success(`Notification will be sent via ${notificationForm.notificationType}`);
      setShowNotificationModal(false);
      setNotificationItem(null);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification. Please try again.");
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Student Fees
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage student fee payments and mappings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by UID, Roll Number, or Registration Number..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                  disabled={searching}
                />
              </div>
              <Button type="submit" disabled={searching || !searchText.trim()}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </form>
            {selectedStudent && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Student Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">UID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.uid || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Roll Number</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.rollNumber || selectedStudent.currentPromotion?.rollNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registration Number</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.registrationNumber || selectedStudent.currentPromotion?.rollNumberSI || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Program Course</p>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.programCourse?.name || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading student fees mappings...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Sr. No</TableHead>
                    <TableHead className="text-center">Academic Year / Semester</TableHead>
                    <TableHead className="text-center">Receipt Type</TableHead>
                    <TableHead className="text-center">Total Payable</TableHead>
                    <TableHead className="text-center">Fee Category / Slab</TableHead>
                    <TableHead className="text-center">Waived Off</TableHead>
                    <TableHead className="text-center">Summary</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!selectedStudent ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
                        Please search for a student by UID, Roll Number, or Registration Number to view their fee
                        mappings.
                      </TableCell>
                    </TableRow>
                  ) : mappings.length > 0 ? (
                    mappings.map((mapping, index) => {
                      const promotion = mapping.feeCategoryPromotionMappings?.[0]?.promotion;
                      const feeStructure = mapping.feeStructure;
                      const feeCategoryPromotionMapping = mapping.feeCategoryPromotionMappings?.[0];
                      const feeCategory = feeCategoryPromotionMapping?.feeCategory;
                      const academicYear = feeStructure?.academicYear?.year || "-";
                      const semester = promotion?.class?.name || feeStructure?.class?.name || "-";
                      const receiptType = feeStructure?.receiptType?.name || "-";
                      const paymentStatus = mapping.paymentStatus || "PENDING";
                      const totalPayable = mapping.totalPayable || 0;
                      const feeCategoryName = feeCategory?.name || "-";
                      const slabName = feeCategory?.feeConcessionSlab?.name || "-";
                      const isWaivedOff = mapping.isWaivedOff || false;

                      return (
                        <TableRow key={mapping.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">{academicYear}</Badge>
                              <Badge className="bg-green-100 text-green-800 border-green-300">{semester}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">{receiptType}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-gray-900">₹{totalPayable.toLocaleString("en-IN")}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                                {feeCategoryName}
                              </Badge>
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300">{slabName}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {isWaivedOff ? (
                              <Badge className="bg-red-100 text-red-800 border-red-300">Yes</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-300">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSummaryItem(mapping)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View Summary
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                paymentStatus === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : paymentStatus === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : paymentStatus === "FAILED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }
                            >
                              {paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(mapping)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Waived Off
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPaymentItem(mapping);
                                    setPaymentForm({
                                      amountPaid: mapping.amountPaid || 0,
                                      paymentMode: (mapping.paymentMode as "CASH" | "CHEQUE" | "ONLINE") || "CASH",
                                    });
                                    setShowPaymentModal(true);
                                  }}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setNotificationItem(mapping);
                                    setNotificationForm({
                                      message: "",
                                      notificationType: "EMAIL",
                                    });
                                    setShowNotificationModal(true);
                                  }}
                                >
                                  <Bell className="h-4 w-4 mr-2" />
                                  Send Notification
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(mapping)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
                        No fee mappings found for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Modal */}
      <Dialog open={!!selectedSummaryItem} onOpenChange={(open) => !open && setSelectedSummaryItem(null)}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Student Fee Mapping – Summary</DialogTitle>
          </DialogHeader>
          {selectedSummaryItem && (
            <div className="space-y-6 flex-1 overflow-y-auto px-6 pb-4 min-h-0">
              {/* Fee Structure Details */}
              <div className="border-2 border-gray-400 rounded">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Academic Year
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Semester
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Receipt Type
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Base Amount
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Total Payable
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Amount Paid
                      </TableHead>
                      <TableHead className="w-[200px] p-2 text-center text-base font-semibold whitespace-nowrap">
                        Payment Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b-2 border-gray-400">
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedSummaryItem.feeStructure?.academicYear ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-blue-100 text-blue-800 border-blue-300">
                              {selectedSummaryItem.feeStructure.academicYear.year}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.promotion?.class?.name ||
                        selectedSummaryItem.feeStructure?.class?.name ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-green-100 text-green-800 border-green-300">
                              {selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.promotion?.class?.name ||
                                selectedSummaryItem.feeStructure?.class?.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedSummaryItem.feeStructure?.receiptType ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-purple-100 text-purple-800 border-purple-300">
                              {selectedSummaryItem.feeStructure.receiptType.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        <div className="flex justify-center">
                          <span className="text-gray-900 font-semibold">
                            ₹{selectedSummaryItem.feeStructure?.baseAmount?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        <div className="flex justify-center">
                          <span className="text-gray-900 font-semibold">
                            ₹{selectedSummaryItem.totalPayable?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        <div className="flex justify-center">
                          <span className="text-gray-900 font-semibold">
                            ₹{selectedSummaryItem.amountPaid?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2 min-h-[100px]">
                        <Badge
                          className={
                            selectedSummaryItem.paymentStatus === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : selectedSummaryItem.paymentStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : selectedSummaryItem.paymentStatus === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }
                        >
                          {selectedSummaryItem.paymentStatus || "PENDING"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Additional Details */}
              <div className="border-2 border-gray-400 rounded">
                <div className="bg-gray-100 border-b-2 border-gray-400 p-3">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Waived Off Amount</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{(selectedSummaryItem.waivedOffAmount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Waived Off By</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSummaryItem.waivedOffByUser?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Waived Off Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSummaryItem.waivedOffDate
                        ? new Date(selectedSummaryItem.waivedOffDate).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Updated Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSummaryItem.updatedAt
                        ? new Date(selectedSummaryItem.updatedAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSummaryItem.transactionDate
                        ? new Date(selectedSummaryItem.transactionDate).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                    <Badge
                      className={
                        selectedSummaryItem.paymentStatus === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : selectedSummaryItem.paymentStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedSummaryItem.paymentStatus === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }
                    >
                      {selectedSummaryItem.paymentStatus || "PENDING"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Fee Components Table - Only show connected slab */}
              {selectedSummaryItem.feeStructure?.components &&
                selectedSummaryItem.feeStructure.components.length > 0 &&
                selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.feeCategory?.feeConcessionSlab && (
                  <div className="border-2 border-gray-400 rounded overflow-hidden">
                    <div className="bg-gray-100 border-b-2 border-gray-400 p-3">
                      <h3 className="text-lg font-semibold text-gray-900">Fee Components</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Connected Slab:{" "}
                        <span className="font-semibold">
                          {selectedSummaryItem.feeCategoryPromotionMappings[0].feeCategory.feeConcessionSlab.name}
                        </span>
                      </p>
                    </div>
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="border-b-2 border-gray-400">
                          <TableHead className="w-[80px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-blue-50">
                            Sr. No
                          </TableHead>
                          <TableHead className="w-[200px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-green-50">
                            Fee Head
                          </TableHead>
                          <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-yellow-50">
                            Allocation
                          </TableHead>
                          <TableHead className="w-[200px] p-2 text-center text-base font-semibold whitespace-nowrap bg-orange-50">
                            {selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.feeCategory?.feeConcessionSlab
                              ?.name || "N/A"}
                            {(() => {
                              // Find the matching concession rate from feeStructureConcessionSlabs
                              const connectedSlabId =
                                selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.feeCategory?.feeConcessionSlab
                                  ?.id;
                              if (!connectedSlabId) return "";
                              const matchingSlab = selectedSummaryItem.feeStructure?.feeStructureConcessionSlabs?.find(
                                (fs) => fs.feeConcessionSlab.id === connectedSlabId,
                              );
                              return matchingSlab ? ` (${(matchingSlab.concessionRate || 0).toFixed(2)}%)` : "";
                            })()}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSummaryItem.feeStructure.components.map((component, index) => {
                          const componentAmount = Math.round(
                            ((selectedSummaryItem.feeStructure?.baseAmount || 0) * (component.feeHeadPercentage || 0)) /
                              100,
                          );
                          // Calculate concession for the connected slab only
                          const connectedSlabId =
                            selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.feeCategory?.feeConcessionSlab?.id;
                          if (!connectedSlabId) {
                            // If no connected slab, show component amount without concession
                            return (
                              <TableRow
                                key={component.id || index}
                                className="border-b-2 border-gray-400"
                                style={{
                                  backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                                }}
                              >
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-blue-50">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-green-50">
                                  {component.feeHead?.name || "-"}{" "}
                                  <span className="text-red-600">
                                    ({(component.feeHeadPercentage || 0).toFixed(2)}%)
                                  </span>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 font-semibold bg-yellow-50">
                                  ₹{componentAmount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center p-2 font-semibold bg-orange-50">
                                  ₹{componentAmount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          const matchingSlab = selectedSummaryItem.feeStructure?.feeStructureConcessionSlabs?.find(
                            (fs) => fs.feeConcessionSlab.id === connectedSlabId,
                          );
                          const concessionRate = matchingSlab?.concessionRate || 0;
                          const concessionAmount = Math.round((componentAmount * concessionRate) / 100);
                          const totalAfterConcession = componentAmount - concessionAmount;

                          return (
                            <TableRow
                              key={component.id || index}
                              className="border-b-2 border-gray-400"
                              style={{
                                backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                              }}
                            >
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-blue-50">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-green-50">
                                {component.feeHead?.name || "-"}{" "}
                                <span className="text-red-600">({(component.feeHeadPercentage || 0).toFixed(2)}%)</span>
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-semibold bg-yellow-50">
                                ₹{componentAmount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center p-2 font-semibold bg-orange-50">
                                ₹{totalAfterConcession.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Total Row */}
                        <TableRow className="border-t-4 border-gray-600 bg-gray-100">
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-blue-50">
                            Total
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-green-50">
                            -
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-yellow-50">
                            ₹{selectedSummaryItem.feeStructure?.baseAmount?.toLocaleString() || "0"}
                          </TableCell>
                          <TableCell className="text-center p-2 font-bold text-base bg-orange-50">
                            <div className="flex flex-col items-center gap-1">
                              {(() => {
                                const connectedSlabId =
                                  selectedSummaryItem.feeCategoryPromotionMappings?.[0]?.feeCategory?.feeConcessionSlab
                                    ?.id;
                                if (!connectedSlabId) {
                                  return <span className="text-gray-900 font-bold">-</span>;
                                }
                                const matchingSlab =
                                  selectedSummaryItem.feeStructure?.feeStructureConcessionSlabs?.find(
                                    (fs) => fs.feeConcessionSlab.id === connectedSlabId,
                                  );
                                const concessionRate = matchingSlab?.concessionRate || 0;
                                const totalAfterConcession = selectedSummaryItem.feeStructure.components.reduce(
                                  (sum, component) => {
                                    const componentAmount = Math.round(
                                      ((selectedSummaryItem.feeStructure?.baseAmount || 0) *
                                        (component.feeHeadPercentage || 0)) /
                                        100,
                                    );
                                    const concessionAmount = Math.round((componentAmount * concessionRate) / 100);
                                    const totalAfterConcession = componentAmount - concessionAmount;
                                    return sum + totalAfterConcession;
                                  },
                                  0,
                                );
                                const totalPayable = selectedSummaryItem.totalPayable || 0;

                                // Show strike-through if waived off amount exists
                                if (selectedSummaryItem.waivedOffAmount && selectedSummaryItem.waivedOffAmount > 0) {
                                  return (
                                    <>
                                      <span className="line-through text-gray-500 text-sm">
                                        ₹{totalAfterConcession.toLocaleString()}
                                      </span>
                                      <span className="text-gray-900 font-bold">₹{totalPayable.toLocaleString()}</span>
                                    </>
                                  );
                                }
                                return (
                                  <span className="text-gray-900 font-bold">
                                    ₹{totalAfterConcession.toLocaleString()}
                                  </span>
                                );
                              })()}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Edit Fee Mapping</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6 min-h-0">
              {/* Approval By Section */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Approval By</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      user={
                        { name: user?.name || undefined, image: user?.image || undefined } as unknown as {
                          name?: string;
                          image?: string;
                        }
                      }
                      size="md"
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Logged In User</p>
                      <p className="text-sm font-semibold text-gray-900">{user?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email || "N/A"}</p>
                    </div>
                  </div>
                  {editingItem.waivedOffByUser && (
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        user={
                          {
                            name: editingItem.waivedOffByUser.name || undefined,
                            image: editingItem.waivedOffByUser.image || undefined,
                          } as unknown as {
                            name?: string;
                            image?: string;
                          }
                        }
                        size="md"
                        className="rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Previously Approved By</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {editingItem.waivedOffByUser.name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{editingItem.waivedOffByUser.email || "N/A"}</p>
                      </div>
                    </div>
                  )}
                  {editingItem.updatedAt && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Last Updated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(editingItem.updatedAt).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Waived Off Details Section */}
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Waived Off Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isWaivedOff"
                      checked={waivedOffForm.isWaivedOff}
                      onCheckedChange={(checked) =>
                        setWaivedOffForm({ ...waivedOffForm, isWaivedOff: checked as boolean })
                      }
                    />
                    <Label htmlFor="isWaivedOff" className="text-sm font-medium cursor-pointer">
                      Is Waived Off
                    </Label>
                  </div>

                  {waivedOffForm.isWaivedOff && (
                    <>
                      <div>
                        <Label htmlFor="waivedOffAmount" className="text-sm font-medium">
                          Waived Off Amount (₹)
                        </Label>
                        <Input
                          id="waivedOffAmount"
                          type="number"
                          min="0"
                          value={waivedOffForm.waivedOffAmount}
                          onChange={(e) =>
                            setWaivedOffForm({
                              ...waivedOffForm,
                              waivedOffAmount: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                          placeholder="Enter waived off amount"
                        />
                      </div>

                      <div>
                        <Label htmlFor="waivedOffReason" className="text-sm font-medium">
                          Waived Off Reason *
                        </Label>
                        <Textarea
                          id="waivedOffReason"
                          value={waivedOffForm.waivedOffReason}
                          onChange={(e) => setWaivedOffForm({ ...waivedOffForm, waivedOffReason: e.target.value })}
                          className="mt-1"
                          placeholder="Enter reason for waiver"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {waivedOffForm.waivedOffReason.length}/500 characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="waivedOffDate" className="text-sm font-medium">
                          Waived Off Date
                        </Label>
                        <Input
                          id="waivedOffDate"
                          type="text"
                          value={
                            editingItem.waivedOffDate
                              ? new Date(editingItem.waivedOffDate).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Will be set automatically on save"
                          }
                          disabled
                          className="mt-1 bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This date will be automatically set to the current date when you save.
                        </p>
                      </div>

                      {/* Approval Information */}
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                          Will be Approved/Updated By
                        </p>
                        <p className="text-sm font-semibold text-green-900">
                          {user?.name || "N/A"} (ID: {user?.id || "N/A"})
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email || "N/A"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Installment Configuration Section (UI Only) */}
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Installment Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This section is for display purposes only. Installment configuration will be implemented in a future
                  update.
                </p>
                {editingItem.feeStructure?.installments && editingItem.feeStructure.installments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Installment No.</TableHead>
                          <TableHead className="text-center">Base Amount (₹)</TableHead>
                          <TableHead className="text-center">Start Date</TableHead>
                          <TableHead className="text-center">End Date</TableHead>
                          <TableHead className="text-center">Online Start Date</TableHead>
                          <TableHead className="text-center">Online End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editingItem.feeStructure.installments.map((installment, index) => (
                          <TableRow key={installment.id || index}>
                            <TableCell className="text-center font-medium">
                              {installment.installmentNumber || index + 1}
                            </TableCell>
                            <TableCell className="text-center">
                              ₹
                              {(installment.baseAmount || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-center">
                              {installment.startDate
                                ? new Date(installment.startDate).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {installment.endDate
                                ? new Date(installment.endDate).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {installment.onlineStartDate
                                ? new Date(installment.onlineStartDate).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {installment.onlineEndDate
                                ? new Date(installment.onlineEndDate).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No installments configured for this fee structure.
                  </p>
                )}
              </div>
            </div>
          )}
          {/* Fixed Footer */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 pb-6 px-6 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWaivedOff} disabled={saving}>
              {saving ? "Saving..." : "Save Waived Off Details"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentItem && (
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Payable</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{(paymentItem.totalPayable || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount Paid</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{(paymentItem.amountPaid || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining Amount</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹
                    {Math.max(0, (paymentItem.totalPayable || 0) - (paymentItem.amountPaid || 0)).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="amountPaid" className="text-sm font-medium">
                  Payment Amount (₹) *
                </Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  max={paymentItem.totalPayable || 0}
                  value={paymentForm.amountPaid}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amountPaid: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                  placeholder="Enter payment amount"
                />
              </div>

              <div>
                <Label htmlFor="paymentMode" className="text-sm font-medium">
                  Payment Mode *
                </Label>
                <Select
                  value={paymentForm.paymentMode}
                  onValueChange={(value: "CASH" | "CHEQUE" | "ONLINE") =>
                    setPaymentForm({ ...paymentForm, paymentMode: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online / Payment Gateway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentForm.paymentMode === "ONLINE" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">Complete payment through payment gateway</p>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!paymentItem?.id || !selectedStudent?.id) {
                          toast.error("Missing payment information");
                          return;
                        }

                        // TODO: Replace with actual payment gateway integration
                        // This should call a backend API to generate payment link
                        // For now, this is a placeholder
                        const paymentLink = `/api/v1/fees/payments/initiate?studentId=${selectedStudent.id}&mappingId=${paymentItem.id}&amount=${paymentItem.totalPayable}`;

                        // Open payment gateway in new window/tab
                        window.open(paymentLink, "_blank");

                        toast.info("Redirecting to payment gateway...");
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment Gateway
                    </Button>
                    <p className="text-xs text-blue-700 mt-2">
                      After completing payment, the transaction details will be automatically recorded
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Fixed Footer */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 pb-6 px-6 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentItem(null);
              }}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={processingPayment}>
              {processingPayment ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          {notificationItem && selectedStudent && (
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-semibold text-blue-900 mb-1">Student Information</p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Name:</span> {selectedStudent.name || "N/A"}
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">UID:</span> {selectedStudent.uid || "N/A"}
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Email:</span> {selectedStudent.personalEmail || "N/A"}
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Total Payable:</span> ₹
                  {(notificationItem.totalPayable || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Amount Paid:</span> ₹
                  {(notificationItem.amountPaid || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <Label htmlFor="notificationType" className="text-sm font-medium">
                  Notification Type *
                </Label>
                <Select
                  value={notificationForm.notificationType}
                  onValueChange={(value: "EMAIL" | "WHATSAPP") =>
                    setNotificationForm({ ...notificationForm, notificationType: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notificationMessage" className="text-sm font-medium">
                  Message *
                </Label>
                <Textarea
                  id="notificationMessage"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="mt-1"
                  placeholder="Enter notification message"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">{notificationForm.message.length} characters</p>
              </div>
            </div>
          )}
          {/* Fixed Footer */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 pb-6 px-6 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setShowNotificationModal(false);
                setNotificationItem(null);
              }}
              disabled={sendingNotification}
            >
              Cancel
            </Button>
            <Button onClick={handleNotificationSubmit} disabled={sendingNotification}>
              {sendingNotification ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Fee Mapping"
        itemName={`Fee Mapping #${deletingItem?.id || ""}`}
        description={`Are you sure you want to delete this student fee mapping? This action cannot be undone.`}
      />
    </div>
  );
};

export default StudentFeesPage;
