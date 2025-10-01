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
    <div className="p-4 space-y-4">
      {/* Header Card */}
      <Card className="bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between p-4 sticky top-0 z-30 bg-background">
          <div className="space-y-3">
            <CardTitle className="flex items-center text-xl font-semibold">
              <LucideUser className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Users
            </CardTitle>
            <CardDescription>Manage users in your system.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage(1);
                setSearch("");
                // re-fetch
                findAdminsAndStaff(1, 100).then((list) => setUsers(list));
              }}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Refresh Data
            </button>
            <AddUserModal onAdd={handleAddUser} />
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="text-sm text-slate-600">Filters:</div>
          <label className="text-sm text-slate-600">Status</label>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
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
          <label className="text-sm text-slate-600">Type</label>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
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
          <label className="text-sm text-slate-600">Staging</label>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
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
          <div className="ml-auto flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search..."
              className="w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </Card>

      {/* Users List - fixed header, scrollable body (mirrors master pages) */}
      <Card className="border-none">
        <div className="relative z-50 bg-white" style={{ height: "600px" }}>
          <div className="overflow-y-auto text-[14px] overflow-x-auto h-full border rounded-md">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 text-slate-600 bg-slate-100 border-b" style={{ minWidth: "950px" }}>
              <div className="flex">
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "6%" }}
                >
                  Sr. No.
                </div>
                <div className="flex-shrink-0 font-semibold p-3 border-r flex items-center" style={{ width: "16%" }}>
                  Name
                </div>
                <div className="flex-shrink-0 font-semibold p-3 border-r flex items-center" style={{ width: "22%" }}>
                  Email
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "12%" }}
                >
                  Phone
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "12%" }}
                >
                  WhatsApp
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "8%" }}
                >
                  Status
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "8%" }}
                >
                  Type
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 border-r flex items-center justify-center"
                  style={{ width: "10%" }}
                >
                  Staging Notifs
                </div>
                <div
                  className="flex-shrink-0 font-semibold p-3 flex items-center justify-center"
                  style={{ width: "6%" }}
                >
                  Action
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white relative">
              {paginatedUsers.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-slate-500" style={{ minWidth: "950px" }}>
                  No users found.
                </div>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const isActive = (user as { isActive?: boolean }).isActive !== false;
                  const sendStaging =
                    (user as { sendStagingNotifications?: boolean }).sendStagingNotifications === true;
                  const sr = (page - 1) * usersPerPage + idx + 1;
                  return (
                    <div key={user.id} className="flex border-b hover:bg-slate-50 group" style={{ minWidth: "950px" }}>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "6%" }}
                      >
                        {sr}
                      </div>
                      <div className="flex-shrink-0 p-3 border-r flex items-center gap-3" style={{ width: "16%" }}>
                        <UserAvatar
                          user={
                            { name: (user as { name?: string }).name, image: (user as { image?: string }).image } as {
                              name?: string;
                              image?: string;
                            }
                          }
                          className=""
                        />
                        <span className="text-slate-800">{user.name}</span>
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center text-slate-700"
                        style={{ width: "22%" }}
                      >
                        {user.email}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center text-slate-700"
                        style={{ width: "12%" }}
                      >
                        {user.phone}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center text-slate-700"
                        style={{ width: "12%" }}
                      >
                        {user.whatsappNumber || "-"}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "8%" }}
                      >
                        {isActive ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "8%" }}
                      >
                        {user.type === "ADMIN" ? (
                          <span className="inline-flex items-center rounded-full border border-violet-300 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                            Admin
                          </span>
                        ) : user.type === "STAFF" ? (
                          <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                            Staff
                          </span>
                        ) : user.type === "STUDENT" ? (
                          <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            Student
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {user.type}
                          </span>
                        )}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "10%" }}
                      >
                        {sendStaging ? (
                          <span className="inline-flex items-center rounded-full border border-lime-300 bg-lime-50 px-2.5 py-0.5 text-xs font-medium text-lime-700">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 p-3 flex items-center justify-center" style={{ width: "6%" }}>
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
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * usersPerPage + 1} to {Math.min(page * usersPerPage, filteredUsers.length)} of{" "}
            {filteredUsers.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 p-0 ${page === pageNum ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600" : ""}`}
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
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
