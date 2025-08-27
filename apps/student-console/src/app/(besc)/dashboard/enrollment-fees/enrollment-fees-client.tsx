"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Installment, Fee, EnrollmentFeesClientProps } from "./types";

export default function EnrollmentFeesClient({
  initialFeesData,
}: EnrollmentFeesClientProps) {
  const [feesData] = useState<Fee[]>(initialFeesData);
  const [selectedFee, setSelectedFee] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
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

  const getStatusColor = (
    status: Fee["status"] | Installment["status"]
  ): string => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partially_paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (
    status: Fee["status"] | Installment["status"]
  ): React.ReactNode => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "partially_paid":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const handleCardClick = (feeId: number): void => {
    if (selectedFee === feeId) {
      setSelectedFee(null);
    } else {
      setSelectedFee(feeId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
          <div className="absolute inset-0 bg-[url('/illustrations/dots-pattern.svg')] opacity-5"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center">
            <div className="mr-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
              <Calendar size={40} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white drop-shadow-md">
                Enrollment & Fees
              </h1>
              <p className="text-blue-50 text-xl drop-shadow max-w-2xl">
                Manage your academic payments and track your installments all in
                one place
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-16 relative z-10">
        <div className="space-y-8">
          {feesData.length === 0 ? (
            <Card className="p-8 text-center bg-white border-none rounded-2xl shadow-lg">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Calendar className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  No Fees Found
                </h3>
                <p className="text-gray-600 max-w-md">
                  There are currently no fees assigned to your account. Check
                  back later or contact the administration office.
                </p>
              </div>
            </Card>
          ) : selectedFee !== null ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Card
                className="w-full cursor-pointer bg-white border-none rounded-2xl shadow-2xl hover:shadow-2xl transition-all overflow-hidden"
                onClick={() => setSelectedFee(null)}
              >
                <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-2 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-blue-800">
                          {feesData[selectedFee].name}
                        </CardTitle>
                      </div>
                      <p className="text-lg text-blue-600 flex items-center gap-2 pl-5">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Due: {formatDate(feesData[selectedFee].dueDate)}
                      </p>
                    </div>
                    <Badge
                      className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm ${getStatusColor(
                        feesData[selectedFee].status
                      )}`}
                    >
                      <span className="flex items-center gap-2">
                        {getStatusIcon(feesData[selectedFee].status)}
                        {feesData[selectedFee].status
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
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
                          {formatCurrency(feesData[selectedFee].totalAmount)}
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
                          {formatCurrency(feesData[selectedFee].paidAmount)}
                        </p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-purple-50/50 to-purple-50/20">
                        <p className="text-base font-medium text-purple-600 mb-1 flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-purple-200 flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                          </span>
                          Due Date
                        </p>
                        <p className="text-xl font-bold text-purple-800 flex items-center gap-2 pl-6">
                          <Calendar className="w-5 h-5" />
                          {formatDate(feesData[selectedFee].dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-8">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 shadow-sm">
                        <h3 className="text-xl font-bold text-indigo-800 mb-5 flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-600" />
                          </div>
                          Installment Details
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
                                  Paid On
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {feesData[selectedFee].installments.map(
                                (installment, idx) => (
                                  <TableRow
                                    key={installment.id}
                                    className="hover:bg-blue-50/50 transition-colors"
                                  >
                                    <TableCell className="font-medium text-gray-700">
                                      {idx + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                      {formatCurrency(installment.amount)}
                                    </TableCell>
                                    <TableCell className="text-gray-700">
                                      {formatDate(installment.dueDate)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={`px-2 py-1 shadow-sm ${getStatusColor(
                                          installment.status
                                        )}`}
                                      >
                                        <span className="flex items-center gap-1">
                                          {getStatusIcon(installment.status)}
                                          {installment.status.toUpperCase()}
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {installment.paidOn ? (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                          <CheckCircle className="h-4 w-4" />
                                          {formatDate(installment.paidOn)}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500">-</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-center">
                    <p className="text-sm text-blue-700 font-medium">
                      Click anywhere to close details
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feesData.map((fee, index) => (
                <motion.div
                  key={fee.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-xl transition-all border-none bg-white shadow-lg overflow-hidden rounded-xl h-full"
                    onClick={() => handleCardClick(index)}
                  >
                    <div className="relative h-full flex flex-col">
                      <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                      <CardHeader className="pb-2 relative">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-10 w-1.5 rounded-full ${
                              fee.status === "paid"
                                ? "bg-green-500"
                                : fee.status === "pending"
                                ? "bg-yellow-500"
                                : fee.status === "overdue"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                          ></div>
                          <CardTitle className="text-xl font-bold text-gray-800">
                            {fee.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="relative flex-grow">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(fee.totalAmount)}
                          </p>
                          <Badge
                            className={`px-3 py-1.5 shadow-sm rounded-lg ${getStatusColor(
                              fee.status
                            )}`}
                          >
                            <span className="flex items-center gap-1.5">
                              {getStatusIcon(fee.status)}
                              {fee.status.replace("_", " ").toUpperCase()}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>Due: {formatDate(fee.dueDate)}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Payment Progress
                            </span>
                            <span className="font-medium text-blue-700">
                              {Math.round(
                                (fee.paidAmount / fee.totalAmount) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                              style={{
                                width: `${
                                  (fee.paidAmount / fee.totalAmount) * 100
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
