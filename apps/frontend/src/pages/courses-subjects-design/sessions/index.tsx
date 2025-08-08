import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Search, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Session } from "@/types/academics/session";
import { AcademicYear } from "@/types/academics/academic-year";
import { findAllSessions, deleteSession } from "@/services/session.service";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { SessionForm } from "./session-form";

const SessionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Fetch sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await findAllSessions();
      return response.payload || [];
    },
  });

  // Fetch academic years for display
  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const response = await getAllAcademicYears();
      return response.payload || [];
    },
  });

  // Create academic year lookup map
  const academicYearMap = useMemo(() => {
    const map = new Map<number, AcademicYear>();
    academicYears.forEach((year) => {
      if (year.id) {
        map.set(year.id, year);
      }
    });
    return map;
  }, [academicYears]);

  // Filter sessions based on search term and status
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(
        (session) =>
          session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.codePrefix?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          academicYearMap.get(session.academicYearId)?.year.includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) =>
        statusFilter === "active" ? session.isCurrentSession : !session.isCurrentSession,
      );
    }

    return filtered;
  }, [sessions, searchTerm, statusFilter, academicYearMap]);

  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format academic year for display (YYYY-YY format)
  const formatAcademicYear = (year: string) => {
    const startYear = parseInt(year);
    const endYear = (startYear + 1).toString().slice(-2);
    return `${startYear}-${endYear}`;
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setShowEditDialog(true);
  };

  const handleDelete = (session: Session) => {
    setDeletingSession(session);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingSession?.id) return;

    try {
      await deleteSession(deletingSession.id);
      toast.success("Session deleted successfully");
      refetchSessions();
      setShowDeleteDialog(false);
      setDeletingSession(null);
    } catch (error) {
      toast.error("Failed to delete session");
      console.error("Delete session error:", error);
    }
  };

  const handleFormSuccess = () => {
    refetchSessions();
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingSession(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-1">Manage academic sessions and their schedules</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
            </DialogHeader>
            <SessionForm
              academicYears={academicYears}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sessions by name, code prefix, or academic year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sessions ({filteredSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sr. No</TableHead>
                  <TableHead className="w-32">Academic Year</TableHead>
                  <TableHead className="w-24">Session</TableHead>
                  <TableHead className="w-48">From / To</TableHead>
                  <TableHead className="w-24">Is Active?</TableHead>
                  <TableHead className="w-32">Code Prefix</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSessions ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session, index) => {
                    const academicYear = academicYearMap.get(session.academicYearId);
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{academicYear ? formatAcademicYear(academicYear.year) : "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {session.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(session.from)} - {formatDate(session.to)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={session.isCurrentSession ? "default" : "secondary"}
                            className={session.isCurrentSession ? "bg-green-100 text-green-800" : ""}
                          >
                            {session.isCurrentSession ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{session.codePrefix || "N/A"}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(session)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(session)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Session</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the session "{deletingSession?.name}"? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <SessionForm
              session={editingSession}
              academicYears={academicYears}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingSession(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPage;
