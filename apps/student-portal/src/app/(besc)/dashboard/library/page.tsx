"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Search,
  BookMarked,
  BarChart,
  BookOpen,
  User,
  Library,
  History,
  Timer,
  MapPin,
  X,
  Share2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useStudent } from "@/providers/student-provider";
import { useRouter } from "next/dist/client/components/navigation";
import { IssuedBookDetails, LibraryVisit } from "@/types/academics/library";

export default function LibraryPage() {
  const { accessControl, student } = useStudent();
  const router = useRouter();
  const [issuedBooks, setIssuedBooks] = useState<IssuedBookDetails[]>([]);
  const [visits, setVisits] = useState<LibraryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "history" | "visits">(
    "current"
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<IssuedBookDetails | null>(
    null
  );

  useEffect(() => {
    if (!accessControl?.access_course) {
      router.back();
    }
  }, [accessControl, router]);

  useEffect(() => {
    fetchLibraryData();
    fetchLibraryVisits();
  }, [student?.id]);

  const fetchLibraryData = async () => {
    if (!student?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/student/library?studentId=${student.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch library data");
      }
      const data = await response.json();
      setIssuedBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryVisits = async () => {
    if (!student?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/student/library/visit?studentId=${student.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch library data");
      }
      const data = await response.json();
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const activeBooks = issuedBooks.filter((book) => !book.isReturn).length;

  // Calculate days until a book is due and return appropriate status
  const calculateDueDays = (dueDate: string) => {
    const returnDate = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Return status object with days remaining and status level
    return {
      days: diffDays,
      status:
        diffDays <= 0
          ? "overdue"
          : diffDays <= 3
          ? "critical"
          : diffDays <= 7
          ? "warning"
          : "normal",
    };
  };

  const dueSoonBooks = issuedBooks.filter((book) => {
    if (book.isReturn) return false;
    const dueStatus = calculateDueDays(book.returnDate);
    return dueStatus.status === "warning" || dueStatus.status === "critical";
  }).length;

  const overdueBooks = issuedBooks.filter((book) => {
    if (book.isReturn) return false;
    const dueStatus = calculateDueDays(book.returnDate);
    return dueStatus.status === "overdue";
  }).length;

  const returnedBooks = issuedBooks.filter((book) => book.isReturn).length;

  // Calculate total time spent in library (in hours)
  const calculateTotalTime = () => {
    let totalTime = 0;

    visits.forEach((visit) => {
      try {
        if (!visit?.entrytime) return;

        // Skip if exittime is (null) or missing
        if (!visit?.exittime || String(visit.exittime) === "(null)") return;

        const inTimeStr = String(visit.entrytime);
        const outTimeStr = String(visit.exittime);

        // Parse HH:MM:SS time format
        const inTimeParts = inTimeStr.split(":");
        const outTimeParts = outTimeStr.split(":");

        if (inTimeParts.length === 3 && outTimeParts.length === 3) {
          const inHours = parseInt(inTimeParts[0], 10);
          const inMinutes = parseInt(inTimeParts[1], 10);
          const inSeconds = parseInt(inTimeParts[2], 10);

          const outHours = parseInt(outTimeParts[0], 10);
          const outMinutes = parseInt(outTimeParts[1], 10);
          const outSeconds = parseInt(outTimeParts[2], 10);

          // Calculate total seconds
          const inTotalSeconds = inHours * 3600 + inMinutes * 60 + inSeconds;
          const outTotalSeconds =
            outHours * 3600 + outMinutes * 60 + outSeconds;

          // Calculate difference
          const diffSeconds = outTotalSeconds - inTotalSeconds;

          // Convert to hours
          const hours = diffSeconds / 3600;

          if (!isNaN(hours) && hours >= 0) {
            totalTime += hours;
          }
        }
      } catch {
        console.error("Error calculating time for visit:", visit);
      }
    });

    return totalTime;
  };

  const totalTimeSpent = calculateTotalTime();
  const totalVisits = visits.length;
  const averageTimePerVisit =
    totalVisits > 0 ? totalTimeSpent / totalVisits : 0;

  // Function to open details modal
  const openBookDetails = (book: IssuedBookDetails) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset selected book after animation completes
    setTimeout(() => setSelectedBook(null), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center">
            <div className="mr-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-xl">
              <Library size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                College Library
              </h1>
              <p className="text-blue-50 text-lg drop-shadow">
                Your digital gateway to knowledge and discovery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10">
        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for books, authors, or topics..."
              className="w-full p-5 pl-14 pr-36 border-none rounded-xl shadow-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
            <Search className="absolute left-5 top-5 text-blue-400" size={22} />
            <button className="absolute right-3 top-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-blue-500 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg">
              Search
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-100/80 to-blue-50/80 rounded-xl shadow-sm border border-blue-200 overflow-hidden group hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Books Borrowed
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {activeBooks}
                    </p>
                    <span className="ml-2 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
                <div className="bg-blue-200 p-3 rounded-xl group-hover:bg-blue-300/70 transition-all">
                  <BookMarked size={24} className="text-blue-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
            <div className="px-6 pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-500 rounded-full p-3">
                  <Clock size={22} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm font-medium">Due Soon</p>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    {dueSoonBooks}
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 ml-2 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    {overdueBooks > 0 && (
                      <span className="text-xs font-medium bg-red-100 text-red-700 ml-2 px-2 py-0.5 rounded-full">
                        {overdueBooks} Overdue
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${
                      activeBooks > 0 ? (dueSoonBooks / activeBooks) * 100 : 0
                    }%`,
                  }}
                ></div>
                {overdueBooks > 0 && (
                  <div
                    className="h-full bg-red-500 -mt-2"
                    style={{
                      width: `${
                        activeBooks > 0 ? (overdueBooks / activeBooks) * 100 : 0
                      }%`,
                    }}
                  ></div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 pb-4">
                {dueSoonBooks} due soon,{" "}
                {overdueBooks > 0 ? `${overdueBooks} overdue` : "none overdue"}{" "}
                of {activeBooks} active books
              </p>
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-amber-100/30">
              <button className="text-amber-600 text-sm font-medium hover:text-amber-800 transition-colors flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                View due dates
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100/80 to-purple-50/80 rounded-xl shadow-sm border border-purple-200 overflow-hidden group hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">
                    Returned Books
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold text-purple-700">
                      {returnedBooks}
                    </p>
                    <span className="ml-2 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      History
                    </span>
                  </div>
                </div>
                <div className="bg-purple-200 p-3 rounded-xl group-hover:bg-purple-300/70 transition-all">
                  <History size={24} className="text-purple-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-100/80 to-indigo-50/80 rounded-xl shadow-sm border border-indigo-200 overflow-hidden group hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-700 font-medium mb-1">
                    Library Visits
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold text-indigo-700">
                      {totalVisits}
                    </p>
                    <span className="ml-2 text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Total
                    </span>
                  </div>
                </div>
                <div className="bg-indigo-200 p-3 rounded-xl group-hover:bg-indigo-300/70 transition-all">
                  <MapPin size={24} className="text-indigo-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-100/80 to-emerald-50/80 rounded-xl shadow-sm border border-emerald-200 overflow-hidden group hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 lg:col-span-1 md:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium mb-1">
                    Fine Amount
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold text-emerald-700">
                      ₹
                      {issuedBooks.reduce(
                        (sum, book) => sum + (book.fine || 0),
                        0
                      )}
                    </p>
                    <span className="ml-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Total
                    </span>
                  </div>
                </div>
                <div className="bg-emerald-200 p-3 rounded-xl group-hover:bg-emerald-300/70 transition-all">
                  <BarChart size={24} className="text-emerald-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-100/80 to-orange-50/80 rounded-xl shadow-sm border border-orange-200 overflow-hidden group hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 lg:col-span-1 md:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium mb-1">
                    Hours Spent
                  </p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold text-orange-700">
                      {totalTimeSpent.toFixed(1)}
                    </p>
                    <span className="ml-2 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      Hours
                    </span>
                  </div>
                </div>
                <div className="bg-orange-200 p-3 rounded-xl group-hover:bg-orange-300/70 transition-all">
                  <Timer size={24} className="text-orange-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("current")}
              className={`flex-1 py-4 px-6 font-medium text-sm transition-all ${
                activeTab === "current"
                  ? "text-blue-600 border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Current Loans
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {activeBooks}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-4 px-6 font-medium text-sm transition-all ${
                activeTab === "history"
                  ? "text-purple-600 border-b-2 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center">
                <History className="mr-2 h-5 w-5" />
                Borrowing History
                <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                  {returnedBooks}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("visits")}
              className={`flex-1 py-4 px-6 font-medium text-sm transition-all ${
                activeTab === "visits"
                  ? "text-orange-600 border-b-2 border-orange-500 bg-gradient-to-r from-orange-50 to-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center">
                <MapPin className="mr-2 h-5 w-5" />
                Library Visits
                <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  {totalVisits}
                </span>
              </div>
            </button>
          </div>

          {/* Current Loans Tab Content */}
          {activeTab === "current" && (
            <div className="p-6 bg-gradient-to-br from-white via-blue-50/10 to-blue-50/20">
              <div className="space-y-8">
                {issuedBooks
                  .filter((book) => !book.isReturn)
                  .map((book) => (
                    <div
                      key={book.copyId + "-" + book.issueDate}
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-blue-100 transition-all duration-300 group"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Book Cover */}
                        <div className="sm:w-[150px] p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 relative">
                          <div className="relative w-[120px]">
                            <div className="book-cover-shadow absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <div className="book-cover relative">
                              <div className="w-full h-[180px] bg-gradient-to-br from-blue-200 to-indigo-300 rounded-lg flex items-center justify-center shadow-md">
                                <BookOpen className="w-12 h-12 text-white" />
                              </div>
                              <div className="absolute inset-0 rounded-lg shadow-inner bg-gradient-to-b from-black/10 to-black/20"></div>
                            </div>
                          </div>
                          <div className="absolute -right-3 top-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg rotate-3">
                            {book.subjectgroupName}
                          </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 p-5">
                          <div className="flex flex-col h-full">
                            <div className="mb-3">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-xl text-gray-800 flex items-center">
                                  <BookMarked className="mr-2 h-5 w-5 text-blue-600" />
                                  {book.mainTitle}
                                </h3>
                                {(() => {
                                  const dueStatus = calculateDueDays(
                                    book.returnDate
                                  );
                                  let statusColor = "";
                                  let statusText = "";

                                  if (dueStatus.status === "overdue") {
                                    statusColor =
                                      "bg-red-100 text-red-700 border border-red-200";
                                    statusText = "Overdue";
                                  } else if (dueStatus.status === "critical") {
                                    statusColor =
                                      "bg-amber-100 text-amber-700 border border-amber-200";
                                    statusText = `Due in ${dueStatus.days} day${
                                      dueStatus.days !== 1 ? "s" : ""
                                    }`;
                                  } else if (dueStatus.status === "warning") {
                                    statusColor =
                                      "bg-yellow-100 text-yellow-700 border border-yellow-200";
                                    statusText = `Due Soon`;
                                  } else {
                                    statusColor = "bg-blue-100 text-blue-700";
                                    statusText = "Active";
                                  }

                                  return (
                                    <span
                                      className={`text-xs ${statusColor} px-2 py-1 rounded-full font-medium inline-flex items-center`}
                                    >
                                      <Clock className="w-3 h-3 mr-1" />
                                      {statusText}
                                    </span>
                                  );
                                })()}
                              </div>
                              {book.subTitle && (
                                <p className="text-gray-600 text-sm mt-1.5 ml-7">
                                  {book.subTitle}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <div className="flex items-center">
                                <div className="bg-indigo-100 p-2 rounded-full">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">
                                    Author/Publisher
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.publisherName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="bg-emerald-100 p-2 rounded-full">
                                  <BarChart className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">ISBN</p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.isbn || "Not available"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="bg-amber-100 p-2 rounded-full">
                                  <MapPin className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">
                                    Location
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.rackName
                                      ? `Rack ${book.rackName}`
                                      : ""}
                                    {book.rackName && book.shelfName
                                      ? ", "
                                      : ""}
                                    {book.shelfName
                                      ? `Shelf ${book.shelfName}`
                                      : ""}
                                    {!book.rackName &&
                                      !book.shelfName &&
                                      "Not specified"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Edition:
                                </span>{" "}
                                {book.edition}{" "}
                                {book.editionYear && `(${book.editionYear})`}
                              </div>
                              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Language:
                                </span>{" "}
                                {book.languageName}
                              </div>
                              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Call No:
                                </span>{" "}
                                {book.callNo}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center text-sm text-gray-600 mb-2 sm:mb-0">
                                  <Calendar className="h-4 w-4 mr-1.5 text-blue-500" />
                                  <span>
                                    Borrowed:{" "}
                                    <span className="font-medium">
                                      {new Date(
                                        book.issueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex items-center text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                  <Clock className="h-4 w-4 mr-1.5 text-amber-500" />
                                  <span>
                                    Due:{" "}
                                    <span className="font-bold">
                                      {new Date(
                                        book.returnDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center mr-3">
                                  <Clock className="mr-1.5 h-4 w-4" />
                                  Renew Book
                                </button>
                                <button
                                  onClick={() => openBookDetails(book)}
                                  className="bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all flex items-center"
                                >
                                  <BookOpen className="mr-1.5 h-4 w-4" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {activeBooks === 0 && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-md border border-blue-100">
                    <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No Active Loans
                    </h3>
                    <p className="text-gray-500">
                      You don&apos;t have any books currently borrowed from the
                      library.
                    </p>
                    <button className="mt-4 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all flex items-center mx-auto">
                      <Search className="mr-1.5 h-4 w-4" />
                      Browse Books
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === "history" && (
            <div className="p-6 bg-gradient-to-br from-white via-purple-50/10 to-purple-50/20">
              <div className="space-y-8">
                {issuedBooks
                  .filter((book) => book.isReturn)
                  .map((book) => (
                    <div
                      key={book.copyId + "-" + book.issueDate}
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-purple-100 transition-all duration-300 group"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Book Cover */}
                        <div className="sm:w-[150px] p-4 flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 relative">
                          <div className="relative w-[120px]">
                            <div className="book-cover-shadow absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <div className="book-cover relative">
                              <div className="w-full h-[180px] bg-gradient-to-br from-purple-200 to-indigo-300 rounded-lg flex items-center justify-center shadow-md">
                                <BookOpen className="w-12 h-12 text-white" />
                              </div>
                              <div className="absolute inset-0 rounded-lg shadow-inner bg-gradient-to-b from-black/10 to-black/20"></div>
                            </div>
                          </div>
                          <div className="absolute -right-3 top-3 bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg rotate-3">
                            {book.subjectgroupName}
                          </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 p-5">
                          <div className="flex flex-col h-full">
                            <div className="mb-3">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-xl text-gray-800 flex items-center">
                                  <BookMarked className="mr-2 h-5 w-5 text-purple-600" />
                                  {book.mainTitle}
                                </h3>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium inline-flex items-center">
                                  <History className="w-3 h-3 mr-1" />
                                  Returned
                                </span>
                              </div>
                              {book.subTitle && (
                                <p className="text-gray-600 text-sm mt-1.5 ml-7">
                                  {book.subTitle}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <div className="flex items-center">
                                <div className="bg-indigo-100 p-2 rounded-full">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">
                                    Author/Publisher
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.publisherName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="bg-emerald-100 p-2 rounded-full">
                                  <BarChart className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">ISBN</p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.isbn || "Not available"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="bg-amber-100 p-2 rounded-full">
                                  <MapPin className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="ml-2">
                                  <p className="text-xs text-gray-500">
                                    Location
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {book.rackName
                                      ? `Rack ${book.rackName}`
                                      : ""}
                                    {book.rackName && book.shelfName
                                      ? ", "
                                      : ""}
                                    {book.shelfName
                                      ? `Shelf ${book.shelfName}`
                                      : ""}
                                    {!book.rackName &&
                                      !book.shelfName &&
                                      "Not specified"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                              <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Edition:
                                </span>{" "}
                                {book.edition}{" "}
                                {book.editionYear && `(${book.editionYear})`}
                              </div>
                              <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Language:
                                </span>{" "}
                                {book.languageName}
                              </div>
                              <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded-md flex items-center">
                                <span className="font-medium mr-1">
                                  Call No:
                                </span>{" "}
                                {book.callNo}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center text-sm text-gray-600 mb-2 sm:mb-0">
                                  <Calendar className="h-4 w-4 mr-1.5 text-purple-500" />
                                  <span>
                                    Borrowed:{" "}
                                    <span className="font-medium">
                                      {new Date(
                                        book.issueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                  <Clock className="h-4 w-4 mr-1.5 text-emerald-500" />
                                  <span>
                                    Returned:{" "}
                                    <span className="font-bold">
                                      {book.actualRetDate
                                        ? new Date(
                                            book.actualRetDate
                                          ).toLocaleDateString()
                                        : "-"}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                {book.fine > 0 && (
                                  <div className="inline-flex items-center bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-md border border-amber-200">
                                    <BarChart className="h-4 w-4 mr-1.5 text-amber-500" />
                                    Fine: ₹{book.fine}
                                  </div>
                                )}
                                <div className={book.fine > 0 ? "ml-auto" : ""}>
                                  <button
                                    onClick={() => openBookDetails(book)}
                                    className="bg-purple-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all flex items-center"
                                  >
                                    <BookOpen className="mr-1.5 h-4 w-4" />
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {returnedBooks === 0 && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-md border border-purple-100">
                    <div className="bg-purple-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <History className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No Borrowing History
                    </h3>
                    <p className="text-gray-500">
                      You haven&apos;t returned any books yet.
                    </p>
                    <button className="mt-4 bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all flex items-center mx-auto">
                      <Search className="mr-1.5 h-4 w-4" />
                      Browse Books
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visits Tab Content */}
          {activeTab === "visits" && (
            <div className="p-6 bg-gradient-to-br from-white via-orange-50/10 to-orange-50/20">
              <div className="space-y-6">
                {visits.length > 0 ? (
                  <>
                    <div className="overflow-x-auto border border-orange-200 rounded-lg shadow-sm">
                      <div className="max-h-[500px] overflow-y-auto">
                        <table className="min-w-full bg-white">
                          <thead className="bg-gradient-to-r from-orange-200 to-orange-300 sticky top-0 z-10">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-medium text-orange-900 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-orange-900 uppercase tracking-wider">
                                Check In
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-orange-900 uppercase tracking-wider">
                                Check Out
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-orange-900 uppercase tracking-wider">
                                Duration
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-orange-900 uppercase tracking-wider">
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-200">
                            {visits.map((visit, index) => {
                              // Format date from entry date
                              let displayDate = "Unknown";
                              try {
                                if (visit?.entrydt) {
                                  const dateOnly = String(visit.entrydt).split(
                                    " "
                                  )[0];
                                  const entryDate = new Date(dateOnly);
                                  if (!isNaN(entryDate.getTime())) {
                                    displayDate =
                                      entryDate.toLocaleDateString();
                                  }
                                }
                              } catch {
                                console.error("Error parsing date:", visit);
                              }

                              // Parse entry time - handle time-only format
                              let inTimeStr = null;
                              try {
                                if (visit?.entrytime) {
                                  inTimeStr = String(visit.entrytime);
                                }
                              } catch {
                                console.error(
                                  "Error parsing entry time:",
                                  visit
                                );
                              }

                              // Parse exit time - handle time-only format
                              let outTimeStr = null;
                              try {
                                if (visit?.exittime) {
                                  outTimeStr = String(visit.exittime);
                                }
                              } catch {
                                console.error(
                                  "Error parsing exit time:",
                                  visit
                                );
                              }

                              // Calculate duration from time strings
                              let duration = "Still in library";
                              if (
                                inTimeStr &&
                                outTimeStr &&
                                outTimeStr !== "(null)"
                              ) {
                                try {
                                  // Parse HH:MM:SS time format
                                  const inTimeParts = inTimeStr.split(":");
                                  const outTimeParts = outTimeStr.split(":");

                                  if (
                                    inTimeParts.length === 3 &&
                                    outTimeParts.length === 3
                                  ) {
                                    const inHours = parseInt(
                                      inTimeParts[0],
                                      10
                                    );
                                    const inMinutes = parseInt(
                                      inTimeParts[1],
                                      10
                                    );
                                    const inSeconds = parseInt(
                                      inTimeParts[2],
                                      10
                                    );

                                    const outHours = parseInt(
                                      outTimeParts[0],
                                      10
                                    );
                                    const outMinutes = parseInt(
                                      outTimeParts[1],
                                      10
                                    );
                                    const outSeconds = parseInt(
                                      outTimeParts[2],
                                      10
                                    );

                                    // Calculate total seconds
                                    const inTotalSeconds =
                                      inHours * 3600 +
                                      inMinutes * 60 +
                                      inSeconds;
                                    const outTotalSeconds =
                                      outHours * 3600 +
                                      outMinutes * 60 +
                                      outSeconds;

                                    // Calculate difference
                                    const diffSeconds =
                                      outTotalSeconds - inTotalSeconds;

                                    // Convert to hours and minutes
                                    const hours = Math.floor(
                                      diffSeconds / 3600
                                    );
                                    const minutes = Math.floor(
                                      (diffSeconds % 3600) / 60
                                    );

                                    // Format duration - show only minutes if less than 1 hour
                                    if (hours === 0) {
                                      duration = `${minutes}m`;
                                    } else {
                                      duration = `${hours}h ${minutes}m`;
                                    }
                                  }
                                } catch {
                                  duration = "Error calculating";
                                }
                              } else if (outTimeStr === "(null)") {
                                duration = "Still in library";
                              }

                              return (
                                <tr
                                  key={visit.id}
                                  className={`hover:bg-orange-50 transition-colors ${
                                    index % 2 === 0
                                      ? "bg-white"
                                      : "bg-orange-50/30"
                                  }`}
                                >
                                  <td className="py-3 px-4 text-sm text-gray-700">
                                    {displayDate}
                                  </td>
                                  <td className="py-3 px-4">
                                    {inTimeStr ? (
                                      <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                                        <span className="text-sm text-gray-700">
                                          {inTimeStr}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-500 italic">
                                        Invalid time
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {outTimeStr && outTimeStr !== "(null)" ? (
                                      <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                                        <span className="text-sm text-gray-700">
                                          {outTimeStr}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Currently In
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <Timer className="h-3.5 w-3.5 text-orange-500 mr-1.5" />
                                      <span className="text-sm text-gray-700">
                                        {duration}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <MapPin className="h-3.5 w-3.5 text-indigo-500 mr-1.5" />
                                      <span className="text-sm text-gray-700">
                                        {visit.libMasterName || "Main Library"}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-8 bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-100">
                      <h3 className="text-lg font-medium text-orange-800 mb-3">
                        Library Usage Summary
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                          <div className="flex items-center">
                            <div className="bg-orange-100 p-3 rounded-lg mr-4">
                              <MapPin className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Total Visits
                              </p>
                              <p className="text-xl font-semibold text-gray-800">
                                {totalVisits || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                          <div className="flex items-center">
                            <div className="bg-orange-100 p-3 rounded-lg mr-4">
                              <Timer className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Total Time
                              </p>
                              <p className="text-xl font-semibold text-gray-800">
                                {totalTimeSpent.toFixed(1)} hours
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                          <div className="flex items-center">
                            <div className="bg-orange-100 p-3 rounded-lg mr-4">
                              <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Average Visit
                              </p>
                              <p className="text-xl font-semibold text-gray-800">
                                {averageTimePerVisit.toFixed(1)} hours
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-orange-50 rounded-xl p-8 max-w-md mx-auto">
                      <MapPin className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No Library Visits
                      </h3>
                      <p className="text-gray-500">
                        You haven&apos;t visited the library yet or no records
                        were found.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Book Detail Modal */}
      {isModalOpen && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-8 animate-fadeIn">
          <div
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">{selectedBook.mainTitle}</h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Book Cover */}
                <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-10 flex items-center justify-center shadow-md relative">
                    <BookOpen className="w-28 h-28 text-indigo-400" />
                    <div className="absolute inset-0 rounded-lg shadow-inner bg-gradient-to-b from-black/5 to-black/10"></div>
                  </div>

                  <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Location
                    </h3>
                    <p className="text-sm">
                      <span className="font-medium">Rack:</span>{" "}
                      {selectedBook.rackName || "Not specified"}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Shelf:</span>{" "}
                      {selectedBook.shelfName || "Not specified"}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Call No:</span>{" "}
                      {selectedBook.callNo}
                    </p>
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex-1">
                  {selectedBook.subTitle && (
                    <p className="text-gray-600 text-lg mb-4">
                      {selectedBook.subTitle}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">
                          Author/Publisher
                        </p>
                        <p className="font-medium">
                          {selectedBook.publisherName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <BookMarked className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Edition</p>
                        <p className="font-medium">
                          {selectedBook.edition}{" "}
                          {selectedBook.editionYear &&
                            `(${selectedBook.editionYear})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Share2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">ISBN</p>
                        <p className="font-medium">
                          {selectedBook.isbn || "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <CalendarIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Language</p>
                        <p className="font-medium">
                          {selectedBook.languageName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-b border-gray-200 py-4 my-4">
                    <h3 className="font-medium text-gray-800 mb-3">
                      Loan Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-xs text-gray-500">Issue Date</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-blue-500" />
                          {new Date(
                            selectedBook.issueDate
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="font-medium flex items-center">
                          <Clock className="w-4 h-4 mr-1.5 text-amber-500" />
                          {new Date(
                            selectedBook.returnDate
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {selectedBook.isReturn && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Return Date</p>
                            <p className="font-medium flex items-center">
                              <History className="w-4 h-4 mr-1.5 text-green-500" />
                              {selectedBook.actualRetDate
                                ? new Date(
                                    selectedBook.actualRetDate
                                  ).toLocaleDateString()
                                : "Not returned"}
                            </p>
                          </div>

                          {selectedBook.fine > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Fine Amount
                              </p>
                              <p className="font-medium text-red-600 flex items-center">
                                <BarChart className="w-4 h-4 mr-1.5 text-red-500" />
                                ₹{selectedBook.fine}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {!selectedBook.isReturn && (
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="font-medium">
                            {(() => {
                              const dueStatus = calculateDueDays(
                                selectedBook.returnDate
                              );
                              if (dueStatus.status === "overdue") {
                                return (
                                  <span className="text-red-600 flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    Overdue by {Math.abs(dueStatus.days)} day
                                    {Math.abs(dueStatus.days) !== 1 ? "s" : ""}
                                  </span>
                                );
                              } else if (dueStatus.status === "critical") {
                                return (
                                  <span className="text-amber-600 flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    Due in {dueStatus.days} day
                                    {dueStatus.days !== 1 ? "s" : ""}
                                  </span>
                                );
                              } else if (dueStatus.status === "warning") {
                                return (
                                  <span className="text-yellow-600 flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    Due soon ({dueStatus.days} days remaining)
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-green-600 flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    {dueStatus.days} days remaining
                                  </span>
                                );
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!selectedBook.isReturn && (
                    <div className="mt-6 flex justify-end">
                      <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center">
                        <Clock className="mr-1.5 h-5 w-5" />
                        Renew Book
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .book-cover-shadow {
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0) 70%
          );
          transform: translateY(10px) rotateX(60deg);
          filter: blur(5px);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
