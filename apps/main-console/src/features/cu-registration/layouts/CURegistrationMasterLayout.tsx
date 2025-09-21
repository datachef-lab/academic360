import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Play, Square, Filter, User, FileText, Settings } from "lucide-react";
import { useState } from "react";

export default function CURegistrationMasterLayout() {
  const navigate = useNavigate();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // Mock search results
  const searchResults = [
    { uid: "2024001", name: "John Doe", rollNumber: "CS2024001", program: "B.Tech Computer Science", shift: "Morning" },
    {
      uid: "2024002",
      name: "Jane Smith",
      rollNumber: "CS2024002",
      program: "B.Tech Computer Science",
      shift: "Evening",
    },
    { uid: "2024003", name: "Mike Johnson", rollNumber: "EC2024003", program: "B.Tech Electronics", shift: "Morning" },
  ];

  const filteredSearchResults = searchResults.filter(
    (student) =>
      student.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const rightBarHeader = (
    <div className="flex items-center gap-2">
      <Settings className="h-5 w-5" />
      <span className="text-base font-semibold">CU Registration Controls</span>
    </div>
  );

  const rightBarContent = (
    <div className="space-y-4">
      {/* Search Student */}
      <div>
        <div className="p-3">
          <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-8 bg-slate-100 hover:bg-slate-200 border-slate-200"
              >
                <Search className="h-3 w-3 mr-2" />
                Search by UID, Roll No, or Name
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Search Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Query</Label>
                  <Input
                    id="search"
                    placeholder="Enter UID, Roll Number, or Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((student) => (
                      <div
                        key={student.uid}
                        className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          // Navigate to student detail page using React Router
                          navigate(`/dashboard/cu-registration/${student.uid}`);
                          setSearchDialogOpen(false); // Close the dialog
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-slate-600">UID: {student.uid}</p>
                            <p className="text-xs text-slate-500">
                              {student.rollNumber} • {student.program}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No students found</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Process Controls */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <Settings className="h-4 w-4" />
            Process Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <Label className="text-xs text-slate-600 mb-1 block">Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="cs">B.Tech Computer Science</SelectItem>
                <SelectItem value="ec">B.Tech Electronics</SelectItem>
                <SelectItem value="me">B.Tech Mechanical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-slate-600 mb-1 block">Shift</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-7 text-xs">
              <Play className="h-3 w-3 mr-1" />
              Start Subject Selection
            </Button>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs">
              <Square className="h-3 w-3 mr-1" />
              Close Subject Selection
            </Button>
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 h-7 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Start CU Registration
            </Button>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs">
              <Square className="h-3 w-3 mr-1" />
              Close CU Registration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <Filter className="h-4 w-4" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Subject Selection</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              80% Complete
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">CU Registration</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              57% Complete
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Pending Corrections</span>
            <Badge variant="outline" className="text-xs text-orange-600 px-2 py-0.5">
              100
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MasterLayout rightBarHeader={rightBarHeader} rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
