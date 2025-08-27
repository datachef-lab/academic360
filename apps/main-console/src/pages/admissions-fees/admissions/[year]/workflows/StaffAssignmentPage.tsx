import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
//   Users,
//   UserCheck,
//   FileText,
  MoreHorizontal,
  Eye,
  Copy,
//   Building,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface StaffAssignment {
  id: string;
  staffName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  assignedWorkflow: string;
  responsibilities: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const dummyStaffAssignments: StaffAssignment[] = [
  {
    id: "SA001",
    staffName: "Dr. Priya Sharma",
    email: "priya.sharma@university.edu",
    phone: "+91-9876543210",
    department: "Admissions",
    role: "Admission Officer",
    assignedWorkflow: "Application Processing",
    responsibilities: ["Document Verification", "Eligibility Check", "Interview Coordination"],
    notes: "Highly efficient in document processing",
    createdAt: "2024-05-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "SA002",
    staffName: "Mr. Rajesh Patel",
    email: "rajesh.patel@university.edu",
    phone: "+91-9876543211",
    department: "Finance",
    role: "Fee Coordinator",
    assignedWorkflow: "Fee Collection",
    responsibilities: ["Payment Processing", "Fee Slab Management", "Payment Gateway Integration"],
    notes: "Good at handling payment queries",
    createdAt: "2024-05-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "SA003",
    staffName: "Ms. Anjali Desai",
    email: "anjali.desai@university.edu",
    phone: "+91-9876543212",
    department: "IT",
    role: "System Administrator",
    assignedWorkflow: "Technical Support",
    responsibilities: ["System Maintenance", "User Support", "Data Backup"],
    notes: "Responsive to technical issues",
    createdAt: "2024-05-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "SA004",
    staffName: "Dr. Amit Kumar",
    email: "amit.kumar@university.edu",
    phone: "+91-9876543213",
    department: "Academics",
    role: "Merit List Coordinator",
    assignedWorkflow: "Merit List Generation",
    responsibilities: ["Merit Calculation", "List Publication", "Student Communication"],
    notes: "Excellent analytical skills",
    createdAt: "2024-05-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "SA005",
    staffName: "Ms. Sneha Verma",
    email: "sneha.verma@university.edu",
    phone: "+91-9876543214",
    department: "Student Services",
    role: "Document Coordinator",
    assignedWorkflow: "Document Verification",
    responsibilities: ["Document Collection", "Verification Process", "ID Card Generation"],
    notes: "Detail-oriented in document verification",
    createdAt: "2024-05-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "SA006",
    staffName: "Mr. Suresh Reddy",
    email: "suresh.reddy@university.edu",
    phone: "+91-9876543215",
    department: "Admissions",
    role: "Query Handler",
    assignedWorkflow: "Pre-Admission Queries",
    responsibilities: ["Query Management", "Student Support", "SMS Coordination"],
    notes: "New assignment, needs training",
    createdAt: "2024-07-15T09:00:00",
    updatedAt: "2024-07-15T09:00:00",
    createdBy: "Admin User"
  }
];



export default function StaffAssignmentPage() {
  const { year } = useParams<{ year: string }>();
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>(dummyStaffAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
//   const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null);

  const departments = Array.from(new Set(staffAssignments.map(s => s.department)));
  const workflows = Array.from(new Set(staffAssignments.map(s => s.assignedWorkflow)));

  const filteredAssignments = staffAssignments.filter(assignment => {
    const matchesSearch = assignment.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || assignment.department === departmentFilter;
    const matchesWorkflow = workflowFilter === 'all' || assignment.assignedWorkflow === workflowFilter;
    
    return matchesSearch && matchesDepartment && matchesWorkflow;
  });

//   const stats = [
//     {
//       title: "Total Assignments",
//       value: staffAssignments.length,
//       icon: Users,
//       color: "text-blue-500"
//     },
//     {
//       title: "Departments",
//       value: departments.length,
//       icon: Building,
//       color: "text-teal-500"
//     },
//     {
//       title: "Workflows",
//       value: workflows.length,
//       icon: FileText,
//       color: "text-purple-500"
//     }
//   ];

  const handleAddAssignment = (newAssignment: Omit<StaffAssignment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const assignment: StaffAssignment = {
      ...newAssignment,
      id: `SA${String(staffAssignments.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Admin User"
    };
    setStaffAssignments(prev => [...prev, assignment]);
    setIsAddDialogOpen(false);
  };

  const handleEditAssignment = (updatedAssignment: StaffAssignment) => {
    setStaffAssignments(prev => prev.map(s => s.id === updatedAssignment.id ? { ...updatedAssignment, updatedAt: new Date().toISOString() } : s));
    setIsEditDialogOpen(false);
    setSelectedAssignment(null);
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Are you sure you want to delete this staff assignment?')) {
      setStaffAssignments(prev => prev.filter(s => s.id !== id));
    }
  };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Assignment - {year}</h1>
          <p className="text-gray-600">Manage staff roles and responsibilities for admission workflow</p>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Workflow Filter */}
              <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Workflows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workflows</SelectItem>
                  {workflows.map(workflow => (
                    <SelectItem key={workflow} value={workflow}>{workflow}</SelectItem>
                  ))}
                </SelectContent>
              </Select>



              {/* Actions */}
              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl min-w-[80vw] h-[80vh] overflow-y-auto flex flex-col">
                    <DialogHeader className="flex-shrink-0 border-b pb-2">
                      <DialogTitle>Assign Staff Member</DialogTitle>
                      <DialogDescription>Create new staff assignment for admission workflow.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <AddEditAssignmentForm onSubmit={handleAddAssignment} />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Responsibilities</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.staffName}</div>
                          <div className="text-sm text-gray-500">{assignment.email}</div>
                          <div className="text-xs text-gray-400">{assignment.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.department}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.role}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{assignment.assignedWorkflow}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-600">
                            {assignment.responsibilities.slice(0, 2).join(", ")}
                            {assignment.responsibilities.length > 2 && "..."}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {assignment.notes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAssignment(assignment.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[70vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 border-b pb-2">
              <DialogTitle>Edit Staff Assignment</DialogTitle>
              <DialogDescription>Update the staff assignment details.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {selectedAssignment && (
                <AddEditAssignmentForm 
                  onSubmit={handleEditAssignment} 
                  initialData={selectedAssignment}
                  isEdit={true}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface AddEditAssignmentFormProps {
  onSubmit: (data: StaffAssignment) => void;
  initialData?: StaffAssignment;
  isEdit?: boolean;
}

function AddEditAssignmentForm({ onSubmit, initialData, isEdit = false }: AddEditAssignmentFormProps) {
  const [formData, setFormData] = useState({
    staffName: initialData?.staffName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    department: initialData?.department || '',
    role: initialData?.role || '',
    assignedWorkflow: initialData?.assignedWorkflow || '',
    responsibilities: initialData?.responsibilities || [],
    notes: initialData?.notes || ''
  });

  const availableDepartments = ["Admissions", "Finance", "IT", "Academics", "Student Services", "HR"];
  const availableWorkflows = ["Application Processing", "Fee Collection", "Technical Support", "Merit List Generation", "Document Verification", "Pre-Admission Queries"];
  const availableResponsibilities = [
    "Document Verification", "Eligibility Check", "Interview Coordination", "Payment Processing", 
    "Fee Slab Management", "Payment Gateway Integration", "System Maintenance", "User Support", 
    "Data Backup", "Merit Calculation", "List Publication", "Student Communication", 
    "Document Collection", "Verification Process", "ID Card Generation", "Query Management", 
    "Student Support", "SMS Coordination"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as unknown as StaffAssignment);
  };

  const handleResponsibilityToggle = (responsibility: string) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.includes(responsibility)
        ? prev.responsibilities.filter(r => r !== responsibility)
        : [...prev.responsibilities, responsibility]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="staffName">Staff Name</Label>
            <Input
              id="staffName"
              value={formData.staffName}
              onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
              placeholder="e.g., Dr. Priya Sharma"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="staff@university.edu"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91-9876543210"
              required
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {availableDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Admission Officer"
              required
            />
          </div>
          <div>
            <Label htmlFor="assignedWorkflow">Assigned Workflow</Label>
            <Select value={formData.assignedWorkflow} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedWorkflow: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkflows.map(workflow => (
                  <SelectItem key={workflow} value={workflow}>{workflow}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div>
          <Label>Responsibilities</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {availableResponsibilities.map(responsibility => (
              <div key={responsibility} className="flex items-center space-x-2">
                <Checkbox
                  id={responsibility}
                  checked={formData.responsibilities.includes(responsibility)}
                  onCheckedChange={() => handleResponsibilityToggle(responsibility)}
                />
                <Label htmlFor={responsibility} className="text-sm">{responsibility}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about the assignment..."
            rows={3}
          />
        </div>
      </div>
      <DialogFooter className="flex-shrink-0 mt-6">
        <Button type="submit">
          {isEdit ? 'Update Assignment' : 'Create Assignment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
