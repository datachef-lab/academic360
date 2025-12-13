"use client";

import { useEffect, useState } from "react";
import { User as LucideUser } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddUserModal } from "../components/add-user-modal";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user/user"; // adjust path
import { findAdminsAndStaff } from "@/services/user";
import { UserAvatar } from "@/hooks/UserAvatar";
// import { Badge } from "@/components/ui/badge";
import EditUserModal from "../components/edit-user-modal";

const usersPerPage = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ADMIN" | "STAFF" | "STUDENT">("ALL");
  const [stagingFilter, setStagingFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // fetch page-wise, but we merge admin+staff; backend already paginates by type,
    // so we fetch a larger window and slice client-side to compose like master pages
    findAdminsAndStaff(1, 100).then((list) => setUsers(list));
  }, []);

  const handleAddUser = (newUserData: Omit<User, "id" | "createdAt" | "updatedAt" | "disabled">) => {
    const newUser: User = {
      ...newUserData,
      id: users.length + 1,
      disabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUsers([newUser, ...users]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedList = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedList);
  };

  const filteredUsers = users.filter((u) => {
    const isActive = (u as { isActive?: boolean }).isActive !== false;
    const sendStaging = (u as { sendStagingNotifications?: boolean }).sendStagingNotifications === true;
    const statusOk = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? isActive : !isActive);
    const typeOk = typeFilter === "ALL" || u.type === typeFilter;
    const stagingOk = stagingFilter === "ALL" || (stagingFilter === "ENABLED" ? sendStaging : !sendStaging);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      [u.name, u.email, u.phone, (u as unknown as { whatsappNumber?: string }).whatsappNumber]
        .filter((x): x is string => typeof x === "string")
        .some((v) => v.toLowerCase().includes(q));
    return statusOk && typeOk && stagingOk && matchesSearch;
  });
  const paginatedUsers = filteredUsers.slice((page - 1) * usersPerPage, page * usersPerPage);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Header Card */}
      <Card className="bg-transparent">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 p-3 sm:p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-2 sm:space-y-3 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl font-semibold">
              <LucideUser className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400" />
              Users
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Manage users in your system.</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <button
              onClick={() => {
                setPage(1);
                setSearch("");
                // re-fetch
                findAdminsAndStaff(1, 100).then((list) => setUsers(list));
              }}
              className="rounded-md border border-slate-200 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex-shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <div className="flex-shrink-0">
              <AddUserModal onAdd={handleAddUser} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center">
          <div className="text-xs sm:text-sm text-slate-600 font-medium">Filters:</div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Status</label>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm text-slate-700 flex-1 sm:flex-initial"
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1);
                  setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE");
                }}
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Type</label>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm text-slate-700 flex-1 sm:flex-initial"
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1);
                  setTypeFilter(e.target.value as "ALL" | "ADMIN" | "STAFF" | "STUDENT");
                }}
              >
                <option value="ALL">All</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Staging</label>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm text-slate-700 flex-1 sm:flex-initial"
                value={stagingFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1);
                  setStagingFilter(e.target.value as "ALL" | "ENABLED" | "DISABLED");
                }}
              >
                <option value="ALL">All</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search..."
              className="w-full sm:w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </Card>

      {/* Users List - fixed header, scrollable body (mirrors master pages) */}
      <Card className="border-none">
        <div className="relative z-50 bg-white" style={{ height: "600px" }}>
          <div className="overflow-y-auto text-xs sm:text-sm overflow-x-auto h-full border rounded-md">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 text-slate-600 bg-slate-100 border-b min-w-max">
              <div className="flex">
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "60px", minWidth: "60px" }}
                >
                  Sr. No.
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center text-xs sm:text-sm"
                  style={{ width: "160px", minWidth: "160px" }}
                >
                  Name
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center text-xs sm:text-sm"
                  style={{ width: "220px", minWidth: "220px" }}
                >
                  Email
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "120px", minWidth: "120px" }}
                >
                  Phone
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "120px", minWidth: "120px" }}
                >
                  WhatsApp
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "80px", minWidth: "80px" }}
                >
                  Status
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "80px", minWidth: "80px" }}
                >
                  Type
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "100px", minWidth: "100px" }}
                >
                  Staging Notifs
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-2 sm:p-3 flex items-center justify-center text-xs sm:text-sm"
                  style={{ width: "60px", minWidth: "60px" }}
                >
                  Action
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white relative min-w-max">
              {paginatedUsers.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-slate-500 min-w-max">No users found.</div>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const isActive = (user as { isActive?: boolean }).isActive !== false;
                  const sendStaging =
                    (user as { sendStagingNotifications?: boolean }).sendStagingNotifications === true;
                  const sr = (page - 1) * usersPerPage + idx + 1;
                  return (
                    <div key={user.id} className="flex border-b hover:bg-slate-50 group min-w-max">
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center text-xs sm:text-sm"
                        style={{ width: "60px", minWidth: "60px" }}
                      >
                        {sr}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center gap-2 sm:gap-3"
                        style={{ width: "160px", minWidth: "160px" }}
                      >
                        <UserAvatar
                          user={
                            { name: (user as { name?: string }).name, image: (user as { image?: string }).image } as {
                              name?: string;
                              image?: string;
                            }
                          }
                          className=""
                        />
                        <span className="text-slate-800 text-xs sm:text-sm truncate">{user.name}</span>
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center text-slate-700 text-xs sm:text-sm truncate"
                        style={{ width: "220px", minWidth: "220px" }}
                      >
                        {user.email}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center text-slate-700 text-xs sm:text-sm"
                        style={{ width: "120px", minWidth: "120px" }}
                      >
                        {user.phone}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center text-slate-700 text-xs sm:text-sm"
                        style={{ width: "120px", minWidth: "120px" }}
                      >
                        {user.whatsappNumber || "-"}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center"
                        style={{ width: "80px", minWidth: "80px" }}
                      >
                        {isActive ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-rose-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center"
                        style={{ width: "80px", minWidth: "80px" }}
                      >
                        {user.type === "ADMIN" ? (
                          <span className="inline-flex items-center rounded-full border border-violet-300 bg-violet-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-violet-700">
                            Admin
                          </span>
                        ) : user.type === "STAFF" ? (
                          <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-orange-700">
                            Staff
                          </span>
                        ) : user.type === "STUDENT" ? (
                          <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            Student
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {user.type}
                          </span>
                        )}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 border-r flex items-center justify-center"
                        style={{ width: "100px", minWidth: "100px" }}
                      >
                        {sendStaging ? (
                          <span className="inline-flex items-center rounded-full border border-lime-300 bg-lime-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-lime-700">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-50 px-1.5 sm:px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div
                        className="flex-shrink-0 p-2 sm:p-3 flex items-center justify-center"
                        style={{ width: "60px", minWidth: "60px" }}
                      >
                        <EditUserModal key={`user-${user.id}`} onUpdate={handleUpdateUser} user={user} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Pagination - master style */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-slate-600">
            <span className="hidden sm:inline">
              Showing {(page - 1) * usersPerPage + 1} to {Math.min(page * usersPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} results
            </span>
            <span className="sm:hidden">
              Page {page} of {totalPages} ({filteredUsers.length} total)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 p-0 flex-shrink-0 ${page === pageNum ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600" : ""}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex-shrink-0"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
