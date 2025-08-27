"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
  School,
  Percent,
  Award,
  Hourglass,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Instalment } from "@/types/fees/instalment";
import { useStudent } from "@/providers/student-provider";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExtendedComponentMetadata {
  id: number;
  headName: string;
  type: string;
  amount: number;
  specialTypeName: string | null;
  instalmentTypeName: string | null;
  lateTypeCalculation: string | null;
  concession: number | null;
  dueDate?: string;
  scholarshipAmount?: number;
  scholarshipName?: string;
}

const getPaymentDueDateInfo = (dueDate: string | null | undefined) => {
  if (!dueDate) return null;

  try {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) return null;

    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "overdue",
        days: Math.abs(diffDays),
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    } else if (diffDays <= 3) {
      return {
        status: "critical",
        days: diffDays,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      };
    } else if (diffDays <= 7) {
      return {
        status: "warning",
        days: diffDays,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    } else {
      return {
        status: "normal",
        days: diffDays,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }
  } catch (error) {
    console.error("Error processing date", error);
    return null;
  }
};

export default function FeesPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [selectedFeeType, setSelectedFeeType] = useState<string | null>(null);
  const [groupedInstalments, setGroupedInstalments] = useState<
    Record<string, Instalment[]>
  >({});
  const [feeSummaries, setFeeSummaries] = useState<
    Record<string, { total: number; paid: number; status: string }>
  >({});

  useEffect(() => {
    const fetchInstalments = async () => {
      try {
        // In a real application, fetch from API
        const response = await fetch(`/api/fees?studentId=${student?.id || 0}`);
        const data = (await response.json()) as Instalment[];

        // Group instalments by their individual IDs to display each as a separate card
        const grouped = data.reduce((acc, instalment) => {
          // Use a unique key that combines receipt type and installment number
          const key = `${instalment.metadata.receiptTypeName}_${instalment.instalmentNumber}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(instalment);
          return acc;
        }, {} as Record<string, Instalment[]>);

        setGroupedInstalments(grouped);

        // Calculate fee summaries for each installment
        const summaries: Record<
          string,
          { total: number; paid: number; status: string }
        > = {};

        Object.entries(grouped).forEach(([key, instalments]) => {
          // Since each group now has only one installment
          const instalment = instalments[0];
          const total = instalment.amount;
          const paid = instalment.hasPaid ? instalment.amount : 0;

          let status = "pending";
          if (instalment.hasPaid) {
            status = "paid";
          } else if (instalment.cancelled) {
            status = "cancelled";
          } else {
            // Check if instalment is overdue
            const isOverdue =
              instalment.metadata.lastDate &&
              new Date(String(instalment.metadata.lastDate)) < new Date();

            if (isOverdue) {
              status = "overdue";
            }
          }

          summaries[key] = { total, paid, status };
        });

        setFeeSummaries(summaries);
      } catch (error) {
        console.error("Error fetching instalments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (student?.id) {
      fetchInstalments();
    }
  }, [student]);

  const formatDate = (dateString: string | Date | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (instalment: Instalment) => {
    if (instalment.cancelled) {
      return {
        status: "cancelled",
        color: "bg-gray-100 text-gray-800",
        icon: <AlertCircle className="w-4 h-4 text-gray-600" />,
      };
    }

    if (instalment.hasPaid) {
      return {
        status: "paid",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      };
    }

    const lastDate = instalment.metadata.lastDate
      ? new Date(instalment.metadata.lastDate)
      : null;

    if (lastDate && lastDate < new Date()) {
      return {
        status: "overdue",
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="w-4 h-4 text-red-600" />,
      };
    }

    return {
      status: "pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="w-4 h-4 text-yellow-600" />,
    };
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partially_paid":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "partially_paid":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const handleCardClick = (feeType: string): void => {
    if (selectedFeeType === feeType) {
      setSelectedFeeType(null);
    } else {
      setSelectedFeeType(feeType);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  //   if (error) {
  //     return (
  //       <div className="p-6">
  //         <Alert variant="destructive">
  //           <AlertCircle className="h-4 w-4" />
  //           <AlertTitle>Error</AlertTitle>
  //           <AlertDescription>{error}</AlertDescription>
  //         </Alert>
  //       </div>
  //     );
  //   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center">
            <div className="mr-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
              <School size={40} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white drop-shadow-md">
                Fees & Instalments
              </h1>
              <p className="text-blue-50 text-xl drop-shadow max-w-2xl">
                Track your fee payments and upcoming instalments all in one
                place
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-16 relative z-10">
        <div className="space-y-8">
          {selectedFeeType !== null ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedFeeType(null)}
              ></div>
              <Card className="w-full max-w-4xl max-h-[90vh] cursor-pointer bg-white border-none rounded-2xl shadow-2xl overflow-hidden relative z-10">
                {(() => {
                  const instalments = groupedInstalments[selectedFeeType] || [];
                  const summary = feeSummaries[selectedFeeType] || {
                    total: 0,
                    paid: 0,
                    status: "pending",
                  };

                  return (
                    <>
                      <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 sticky top-0 z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-2 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                              <CardTitle className="text-2xl md:text-3xl font-bold text-blue-800">
                                {selectedFeeType}
                              </CardTitle>
                            </div>
                            {instalments.length > 0 && (
                              <p className="text-lg text-blue-600 flex items-center gap-2 pl-5">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                {instalments[0].metadata.className} -{" "}
                                {instalments[0].metadata.sessionName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm ${getStatusColorClass(
                                summary.status
                              )}`}
                            >
                              <span className="flex items-center gap-2">
                                {getStatusIcon(summary.status)}
                                {summary.status.replace("_", " ").toUpperCase()}
                              </span>
                            </Badge>
                            <button
                              onClick={() => setSelectedFeeType(null)}
                              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
                        <CardContent className="p-0">
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                              <div className="p-6 border-b md:border-b-0 md:border-r border-blue-100 bg-gradient-to-br from-blue-50/50 to-blue-50/20">
                                <p className="text-base font-medium text-blue-600 mb-1 flex items-center gap-2">
                                  <span className="h-4 w-4 rounded-full bg-blue-200 flex items-center justify-center">
                                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                                  </span>
                                  Total Amount
                                </p>
                                <p className="text-3xl font-bold text-blue-800 pl-6">
                                  {formatCurrency(summary.total)}
                                </p>
                              </div>
                              <div className="p-6 border-b md:border-b-0 md:border-r border-green-100 bg-gradient-to-br from-green-50/50 to-green-50/20">
                                <p className="text-base font-medium text-green-600 mb-1 flex items-center gap-2">
                                  <span className="h-4 w-4 rounded-full bg-green-200 flex items-center justify-center">
                                    <span className="h-2 w-2 rounded-full bg-green-600"></span>
                                  </span>
                                  Paid Amount
                                </p>
                                <p className="text-3xl font-bold text-green-800 pl-6">
                                  {formatCurrency(summary.paid)}
                                </p>
                              </div>
                              <div className="p-6 bg-gradient-to-br from-purple-50/50 to-purple-50/20">
                                <p className="text-base font-medium text-purple-600 mb-1 flex items-center gap-2">
                                  <span className="h-4 w-4 rounded-full bg-purple-200 flex items-center justify-center">
                                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                                  </span>
                                  Payment Progress
                                </p>
                                <div className="pl-6 pt-2">
                                  <Progress
                                    value={
                                      summary.total > 0
                                        ? (summary.paid / summary.total) * 100
                                        : 0
                                    }
                                    className="h-3 bg-purple-100"
                                  />
                                  <p className="text-lg font-bold text-purple-800 mt-1">
                                    {summary.total > 0
                                      ? Math.round(
                                          (summary.paid / summary.total) * 100
                                        )
                                      : 0}
                                    %
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 pt-8">
                              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 shadow-sm">
                                <h3 className="text-xl font-bold text-indigo-800 mb-5 flex items-center gap-2">
                                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Receipt className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  Instalment Details
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-indigo-100 bg-white shadow-sm">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50">
                                        <TableHead className="text-indigo-700 font-semibold">
                                          No.
                                        </TableHead>
                                        <TableHead className="text-indigo-700 font-semibold">
                                          Amount
                                        </TableHead>
                                        <TableHead className="text-indigo-700 font-semibold">
                                          Due Date
                                        </TableHead>
                                        <TableHead className="text-indigo-700 font-semibold">
                                          Status
                                        </TableHead>
                                        <TableHead className="text-indigo-700 font-semibold">
                                          Payment Details
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {instalments.map((instalment, index) => {
                                        const statusInfo =
                                          getStatusInfo(instalment);
                                        return (
                                          <TableRow
                                            key={`${instalment.id}-${index}`}
                                            className="hover:bg-blue-50/50 transition-colors"
                                          >
                                            <TableCell className="font-medium text-gray-700">
                                              {instalment.instalmentNumber}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900">
                                              <div className="flex flex-col">
                                                {formatCurrency(
                                                  instalment.amount
                                                )}

                                                {/* Show concession indicators if any exists */}
                                                {instalment.details.components?.some(
                                                  (comp) =>
                                                    comp.metadata.concession &&
                                                    comp.metadata.concession > 0
                                                ) && (
                                                  <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                                                    <Percent className="h-3 w-3 mr-1" />
                                                    Concession Applied
                                                  </div>
                                                )}

                                                {/* Show scholarship indicators if any exists */}
                                                {instalment.details.components?.some(
                                                  (comp) => {
                                                    const metadata =
                                                      comp.metadata as ExtendedComponentMetadata;
                                                    return (
                                                      metadata?.scholarshipAmount &&
                                                      metadata.scholarshipAmount >
                                                        0
                                                    );
                                                  }
                                                ) && (
                                                  <div className="flex items-center mt-1 text-xs text-purple-600 font-medium">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    Scholarship Applied
                                                  </div>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                              <div className="flex flex-col">
                                                {formatDate(
                                                  instalment.metadata.lastDate
                                                )}

                                                {/* Show due date indicator */}
                                                {!instalment.hasPaid &&
                                                  instalment.metadata
                                                    .lastDate && (
                                                    <div className="mt-1">
                                                      {(() => {
                                                        const dueInfo =
                                                          getPaymentDueDateInfo(
                                                            typeof instalment
                                                              .metadata
                                                              .lastDate ===
                                                              "string"
                                                              ? instalment
                                                                  .metadata
                                                                  .lastDate
                                                              : instalment.metadata.lastDate?.toISOString()
                                                          );
                                                        if (dueInfo) {
                                                          return (
                                                            <div
                                                              className={`inline-flex text-xs items-center ${dueInfo.color} ${dueInfo.bgColor} px-2 py-0.5 rounded-md ${dueInfo.borderColor} border`}
                                                            >
                                                              <Hourglass className="w-3 h-3 mr-1" />
                                                              {dueInfo.status ===
                                                              "overdue" ? (
                                                                <>
                                                                  Overdue by{" "}
                                                                  {dueInfo.days}
                                                                  d
                                                                </>
                                                              ) : (
                                                                <>
                                                                  Due in{" "}
                                                                  {dueInfo.days}
                                                                  d
                                                                </>
                                                              )}
                                                            </div>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                    </div>
                                                  )}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                className={`px-2 py-1 shadow-sm ${statusInfo.color}`}
                                              >
                                                <span className="flex items-center gap-1">
                                                  {statusInfo.icon}
                                                  {statusInfo.status.toUpperCase()}
                                                </span>
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              {instalment.hasPaid ? (
                                                <div className="space-y-1">
                                                  <span className="text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Paid on{" "}
                                                    {formatDate(
                                                      instalment.paidAt
                                                    )}
                                                  </span>
                                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {
                                                      instalment.details
                                                        .paymentMode
                                                    }{" "}
                                                    | Challan:{" "}
                                                    {
                                                      instalment.details
                                                        .challanNumber
                                                    }
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-gray-500">
                                                  -
                                                </span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* Components Section */}
                              {instalments.length > 0 &&
                                instalments[0].details.components.length >
                                  0 && (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm">
                                    <h3 className="text-xl font-bold text-blue-800 mb-5 flex items-center gap-2">
                                      <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                      </div>
                                      Fee Components
                                    </h3>
                                    <div className="rounded-xl overflow-hidden border border-blue-100 bg-white shadow-sm">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <TableHead className="text-blue-700 font-semibold">
                                              Component
                                            </TableHead>
                                            <TableHead className="text-blue-700 font-semibold">
                                              Type
                                            </TableHead>
                                            <TableHead className="text-blue-700 font-semibold">
                                              Amount
                                            </TableHead>
                                            <TableHead className="text-blue-700 font-semibold">
                                              Concession
                                            </TableHead>
                                            <TableHead className="text-blue-700 font-semibold">
                                              Status
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {instalments[0].details.components.map(
                                            (component, cIndex) => (
                                              <TableRow
                                                key={`${component.id}-${cIndex}`}
                                                className="hover:bg-blue-50/50 transition-colors"
                                              >
                                                <TableCell className="font-medium text-gray-800">
                                                  {component.headName}
                                                </TableCell>
                                                <TableCell className="text-gray-700">
                                                  {component.metadata.type}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-900">
                                                  {formatCurrency(
                                                    component.metadata.amount
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-gray-700">
                                                  {component.metadata
                                                    .concession !== null &&
                                                  component.metadata
                                                    .concession > 0 ? (
                                                    <div className="flex items-center text-green-600">
                                                      <Percent className="w-4 h-4 mr-1.5" />
                                                      {formatCurrency(
                                                        component.metadata
                                                          .concession
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <span className="text-gray-400">
                                                      -
                                                    </span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge
                                                    className={`px-2 py-1 shadow-sm ${
                                                      component.hasPaid
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                  >
                                                    <span className="flex items-center gap-1">
                                                      {component.hasPaid ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                      ) : (
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                      )}
                                                      {component.hasPaid
                                                        ? "PAID"
                                                        : "PENDING"}
                                                    </span>
                                                  </Badge>

                                                  {!component.hasPaid &&
                                                    (
                                                      component.metadata as ExtendedComponentMetadata
                                                    ).dueDate && (
                                                      <div className="mt-1.5">
                                                        {(() => {
                                                          const dueInfo =
                                                            getPaymentDueDateInfo(
                                                              (
                                                                component.metadata as ExtendedComponentMetadata
                                                              ).dueDate
                                                            );
                                                          if (dueInfo) {
                                                            return (
                                                              <div
                                                                className={`flex items-center text-xs ${dueInfo.color} ${dueInfo.bgColor} px-2 py-1 rounded-md ${dueInfo.borderColor} border`}
                                                              >
                                                                <Hourglass className="w-3 h-3 mr-1" />
                                                                {dueInfo.status ===
                                                                "overdue" ? (
                                                                  <>
                                                                    Overdue by{" "}
                                                                    {
                                                                      dueInfo.days
                                                                    }{" "}
                                                                    day
                                                                    {dueInfo.days !==
                                                                    1
                                                                      ? "s"
                                                                      : ""}
                                                                  </>
                                                                ) : (
                                                                  <>
                                                                    Due in{" "}
                                                                    {
                                                                      dueInfo.days
                                                                    }{" "}
                                                                    day
                                                                    {dueInfo.days !==
                                                                    1
                                                                      ? "s"
                                                                      : ""}
                                                                  </>
                                                                )}
                                                              </div>
                                                            );
                                                          }
                                                          return null;
                                                        })()}
                                                      </div>
                                                    )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </>
                  );
                })()}
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(groupedInstalments).map(
                ([feeType, feeInstalments]) => {
                  const summary = feeSummaries[feeType] || {
                    total: 0,
                    paid: 0,
                    status: "pending",
                  };
                  const firstInstalment = feeInstalments[0];

                  return (
                    <motion.div
                      key={`${feeType}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-xl transition-all border-none bg-white shadow-lg overflow-hidden rounded-xl h-full"
                        onClick={() => handleCardClick(feeType)}
                      >
                        <div className="relative h-full flex flex-col">
                          <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                          <CardHeader className="pb-2 relative">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-10 w-1.5 rounded-full ${
                                  summary.status === "paid"
                                    ? "bg-green-500"
                                    : summary.status === "partially_paid"
                                    ? "bg-blue-500"
                                    : summary.status === "overdue"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                              ></div>
                              <CardTitle className="text-xl font-bold text-gray-800">
                                {feeType}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="relative flex-grow">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-blue-700">
                                  {formatCurrency(summary.total)}
                                </p>
                                <Badge
                                  className={`px-3 py-1.5 shadow-sm rounded-lg ${getStatusColorClass(
                                    summary.status
                                  )}`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {getStatusIcon(summary.status)}
                                    {summary.status
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </span>
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span>
                                {firstInstalment.metadata.className} -{" "}
                                {firstInstalment.metadata.sessionName}
                              </span>
                            </div>

                            {/* Display instalment number */}
                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                              <Receipt className="w-4 h-4 text-indigo-500" />
                              <span className="font-medium">
                                Instalment {firstInstalment.instalmentNumber}
                              </span>
                            </div>

                            {/* Payment information for unpaid fees */}
                            {!firstInstalment.hasPaid && (
                              <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                                  <CreditCard className="w-4 h-4 mr-1.5 text-blue-600" />
                                  Payment Information
                                </h4>
                                <div className="text-xs text-gray-700 space-y-1.5">
                                  <p>
                                    <span className="font-medium">
                                      Due Date:
                                    </span>{" "}
                                    {formatDate(
                                      firstInstalment.metadata.lastDate
                                    )}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Payment Methods:
                                    </span>{" "}
                                    Online, Bank Transfer, Cash at Office
                                  </p>
                                  {firstInstalment.metadata
                                    .lastOnlineDateTo && (
                                    <p>
                                      <span className="font-medium">
                                        Online Payment Available Until:
                                      </span>{" "}
                                      {formatDate(
                                        firstInstalment.metadata
                                          .lastOnlineDateTo
                                      )}
                                    </p>
                                  )}
                                  {firstInstalment.fg && (
                                    <p className="text-green-700">
                                      <span className="font-medium">
                                        Fine Grace:
                                      </span>{" "}
                                      Applied
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Concession & Scholarship indicators */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {feeInstalments.some((i) =>
                                i.details?.components?.some(
                                  (comp) =>
                                    comp.metadata?.concession &&
                                    comp.metadata.concession > 0
                                )
                              ) && (
                                <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                  <Percent className="h-3 w-3 mr-1" />
                                  Concession Applied
                                </span>
                              )}

                              {feeInstalments.some((i) =>
                                i.details?.components?.some((comp) => {
                                  const metadata =
                                    comp.metadata as ExtendedComponentMetadata;
                                  return (
                                    metadata?.scholarshipAmount &&
                                    metadata.scholarshipAmount > 0
                                  );
                                })
                              ) && (
                                <span className="inline-flex items-center text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                  <Award className="h-3 w-3 mr-1" />
                                  Scholarship Applied
                                </span>
                              )}

                              {/* Show next payment due indicator */}
                              {(() => {
                                // For a single installment, directly check its due date
                                if (
                                  !firstInstalment.hasPaid &&
                                  firstInstalment.metadata.lastDate
                                ) {
                                  const dueInfo = getPaymentDueDateInfo(
                                    String(firstInstalment.metadata.lastDate)
                                  );
                                  if (dueInfo) {
                                    return (
                                      <span
                                        className={`inline-flex items-center text-xs ${dueInfo.color} ${dueInfo.bgColor} px-2 py-1 rounded-md border ${dueInfo.borderColor}`}
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        {dueInfo.status === "overdue" ? (
                                          <>Payment overdue</>
                                        ) : (
                                          <>Payment due in {dueInfo.days}d</>
                                        )}
                                      </span>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                  Payment Status
                                </span>
                                <span className="font-medium text-blue-700">
                                  {summary.total > 0
                                    ? Math.round(
                                        (summary.paid / summary.total) * 100
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                  style={{
                                    width: `${
                                      summary.total > 0
                                        ? (summary.paid / summary.total) * 100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="absolute bottom-0 right-0 w-16 h-16 overflow-hidden opacity-10">
                              <div className="absolute inset-0 bg-blue-500 rounded-tl-full"></div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
