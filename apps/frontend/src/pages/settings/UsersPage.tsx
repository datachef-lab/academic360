"use client";

import { useEffect, useState } from "react";
import { User as LucideUser } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddUserModal } from "./add-user-modal";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user/user"; // adjust path
import { findAllUsers } from "@/services/user";
import { UserAvatar } from "@/hooks/UserAvatar";
import { Badge } from "@/components/ui/badge";
import EditUserModal from "./edit-user-modal";

const usersPerPage = 5;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    findAllUsers(page, 10, "ADMIN").then((data) => setUsers(data.payload.content));
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

  const paginatedUsers = users.slice((page - 1) * usersPerPage, page * usersPerPage);
  const totalPages = Math.ceil(users.length / usersPerPage);

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
          <AddUserModal onAdd={handleAddUser} />
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="flex items-center gap-3">
                  <UserAvatar user={{ ...user, id: String(user.id) }} className="" />
                  {user.name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.whatsappNumber || "-"}</TableCell>
                <TableCell>
                  <Badge>Active</Badge>
                </TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  <EditUserModal key={`user-${user.id}`} onUpdate={handleUpdateUser} user={user} />
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
