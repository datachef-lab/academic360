import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
//   Trophy,
  Users,
  FileText,
//   Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
//   Settings,
//   Target,
  Percent,
//   Award,
//   TrendingUp,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";

interface MeritCriteria {
  id: string;
  name: string;
  course: string;
  academicYear: string;
  criteriaType: 'entrance_exam' | 'academic_performance' | 'combined' | 'sports' | 'ncc' | 'other';
  weightage: {
    entranceExam: number;
    academicPerformance: number;
    interview: number;
    sports: number;
    ncc: number;
    other: number;
  };
  minimumScore: number;
  cutoffMarks: number;
  totalSeats: number;
  reservedSeats: {
    sc: number;
    st: number;
    obc: number;
    ews: number;
    general: number;
  };
  status: 'active' | 'inactive' | 'draft';
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalApplicants: number;
  selectedApplicants: number;
}

const dummyMeritCriteria: MeritCriteria[] = [
  {
    id: "MC001",
    name: "B.Tech General Merit",
    course: "B.Tech",
    academicYear: "2024-25",
    criteriaType: "combined",
    weightage: {
      entranceExam: 70,
      academicPerformance: 20,
      interview: 10,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: 60,
    cutoffMarks: 85,
    totalSeats: 120,
    reservedSeats: {
      sc: 18,
      st: 9,
      obc: 32,
      ews: 12,
      general: 49
    },
    status: "active",
    description: "Merit criteria for B.Tech program with 70% weightage to entrance exam",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 450,
    selectedApplicants: 120
  },
  {
    id: "MC002",
    name: "B.Tech SC/ST Merit",
    course: "B.Tech",
    academicYear: "2024-25",
    criteriaType: "combined",
    weightage: {
      entranceExam: 60,
      academicPerformance: 25,
      interview: 15,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: 50,
    cutoffMarks: 70,
    totalSeats: 27,
    reservedSeats: {
      sc: 20,
      st: 7,
      obc: 0,
      ews: 0,
      general: 0
    },
    status: "active",
    description: "Relaxed merit criteria for SC/ST category students",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 85,
    selectedApplicants: 27
  },
  {
    id: "MC003",
    name: "MBA General Merit",
    course: "MBA",
    academicYear: "2024-25",
    criteriaType: "entrance_exam",
    weightage: {
      entranceExam: 80,
      academicPerformance: 10,
      interview: 10,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: 65,
    cutoffMarks: 90,
    totalSeats: 60,
    reservedSeats: {
      sc: 9,
      st: 4,
      obc: 16,
      ews: 6,
      general: 25
    },
    status: "active",
    description: "Merit criteria for MBA program with high weightage to entrance exam",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 180,
    selectedApplicants: 60
  },
  {
    id: "MC004",
    name: "BBA General Merit",
    course: "BBA",
    academicYear: "2024-25",
    criteriaType: "academic_performance",
    weightage: {
      entranceExam: 0,
      academicPerformance: 70,
      interview: 30,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: 55,
    cutoffMarks: 75,
    totalSeats: 80,
    reservedSeats: {
      sc: 12,
      st: 6,
      obc: 21,
      ews: 8,
      general: 33
    },
    status: "active",
    description: "Merit criteria for BBA program based on academic performance",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 220,
    selectedApplicants: 80
  },
  {
    id: "MC005",
    name: "BCA Sports Merit",
    course: "BCA",
    academicYear: "2024-25",
    criteriaType: "sports",
    weightage: {
      entranceExam: 40,
      academicPerformance: 30,
      interview: 10,
      sports: 20,
      ncc: 0,
      other: 0
    },
    minimumScore: 50,
    cutoffMarks: 70,
    totalSeats: 20,
    reservedSeats: {
      sc: 3,
      st: 1,
      obc: 5,
      ews: 2,
      general: 9
    },
    status: "active",
    description: "Merit criteria for BCA program with sports quota",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 45,
    selectedApplicants: 20
  },
  {
    id: "MC006",
    name: "M.Tech General Merit",
    course: "M.Tech",
    academicYear: "2024-25",
    criteriaType: "entrance_exam",
    weightage: {
      entranceExam: 85,
      academicPerformance: 10,
      interview: 5,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: 70,
    cutoffMarks: 95,
    totalSeats: 40,
    reservedSeats: {
      sc: 6,
      st: 3,
      obc: 11,
      ews: 4,
      general: 16
    },
    status: "draft",
    description: "Advanced merit criteria for M.Tech program (Draft)",
    createdAt: "2024-07-15T09:00:00",
    updatedAt: "2024-07-15T09:00:00",
    createdBy: "Admin User",
    totalApplicants: 120,
    selectedApplicants: 35
  }
];

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "secondary" as const, icon: XCircle },
  draft: { label: "Draft", variant: "outline" as const, icon: AlertCircle }
};

const criteriaTypeConfig = {
  entrance_exam: { label: "Entrance Exam", variant: "default" as const },
  academic_performance: { label: "Academic Performance", variant: "secondary" as const },
  combined: { label: "Combined", variant: "outline" as const },
  sports: { label: "Sports", variant: "default" as const },
  ncc: { label: "NCC", variant: "secondary" as const },
  other: { label: "Other", variant: "outline" as const }
};

export default function MeritCriteriaPage() {
  const { year } = useParams<{ year: string }>();
  const [meritCriteria, setMeritCriteria] = useState<MeritCriteria[]>(dummyMeritCriteria);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<MeritCriteria | null>(null);

  const filteredCriteria = meritCriteria.filter(criteria => {
    const matchesSearch = criteria.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         criteria.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || criteria.course === courseFilter;
    const matchesStatus = statusFilter === 'all' || criteria.status === statusFilter;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = [
    {
      title: "Total Criteria",
      value: meritCriteria.length,
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Active Criteria",
      value: meritCriteria.filter(c => c.status === 'active').length,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Total Seats",
      value: meritCriteria.reduce((sum, c) => sum + c.totalSeats, 0),
      icon: Users,
      color: "text-teal-500"
    },
    {
      title: "Selection Rate",
      value: meritCriteria.length > 0 
        ? Math.round((meritCriteria.reduce((sum, c) => sum + c.selectedApplicants, 0) / 
                      meritCriteria.reduce((sum, c) => sum + c.totalSeats, 0)) * 100)
        : 0,
      icon: Percent,
      color: "text-purple-500"
    }
  ];

  const courses = Array.from(new Set(meritCriteria.map(c => c.course)));

  const handleAddCriteria = (newCriteria: Omit<MeritCriteria, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const criteria: MeritCriteria = {
      ...newCriteria,
      id: `MC${String(meritCriteria.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Admin User",
      totalApplicants: 0,
      selectedApplicants: 0
    };
    setMeritCriteria(prev => [...prev, criteria]);
    setIsAddDialogOpen(false);
  };

  const handleEditCriteria = (updatedCriteria: MeritCriteria) => {
    setMeritCriteria(prev => prev.map(c => c.id === updatedCriteria.id ? { ...updatedCriteria, updatedAt: new Date().toISOString() } : c));
    setIsEditDialogOpen(false);
    setSelectedCriteria(null);
  };

  const handleDeleteCriteria = (id: string) => {
    if (confirm('Are you sure you want to delete this merit criteria?')) {
      setMeritCriteria(prev => prev.filter(c => c.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Merit Criteria - {year}</h1>
          <p className="text-gray-600">Manage merit-based selection criteria for different courses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.title === "Selection Rate" ? `${stat.value}%` : stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
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
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Course Filter */}
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Criteria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 border-b pb-2">
                      <DialogTitle>Add New Merit Criteria</DialogTitle>
                      <DialogDescription>Create new merit-based selection criteria for a course.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <AddEditCriteriaForm onSubmit={handleAddCriteria} />
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

        {/* Merit Criteria Table */}
        <Card>
          <CardHeader>
            <CardTitle>Merit Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead>Cutoff</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Selection</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCriteria.map((criteria) => {
                    const StatusIcon = statusConfig[criteria.status].icon;
                    return (
                      <TableRow key={criteria.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{criteria.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{criteria.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{criteria.course}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={criteriaTypeConfig[criteria.criteriaType].variant}>
                            {criteriaTypeConfig[criteria.criteriaType].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {criteria.weightage.entranceExam > 0 && (
                              <div>Exam: {criteria.weightage.entranceExam}%</div>
                            )}
                            {criteria.weightage.academicPerformance > 0 && (
                              <div>Academic: {criteria.weightage.academicPerformance}%</div>
                            )}
                            {criteria.weightage.interview > 0 && (
                              <div>Interview: {criteria.weightage.interview}%</div>
                            )}
                            {criteria.weightage.sports > 0 && (
                              <div>Sports: {criteria.weightage.sports}%</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{criteria.cutoffMarks}%</div>
                            <div className="text-gray-500">Min: {criteria.minimumScore}%</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{criteria.totalSeats}</div>
                            <div className="text-gray-500">
                              Gen: {criteria.reservedSeats.general} | 
                              OBC: {criteria.reservedSeats.obc} | 
                              SC: {criteria.reservedSeats.sc}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{criteria.selectedApplicants}/{criteria.totalSeats}</div>
                            <div className="text-gray-500">
                              {criteria.totalSeats > 0 
                                ? Math.round((criteria.selectedApplicants / criteria.totalSeats) * 100)
                                : 0}% filled
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[criteria.status].variant}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[criteria.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(criteria.createdAt)}
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
                                setSelectedCriteria(criteria);
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
                              <DropdownMenuItem onClick={() => handleDeleteCriteria(criteria.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 border-b">
              <DialogTitle>Edit Merit Criteria</DialogTitle>
              <DialogDescription>Update the merit-based selection criteria.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {selectedCriteria && (
                <AddEditCriteriaForm 
                  onSubmit={handleEditCriteria} 
                  initialData={selectedCriteria}
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

interface AddEditCriteriaFormProps {
  onSubmit: (data: MeritCriteria) => void;
  initialData?: MeritCriteria;
  isEdit?: boolean;
}

function AddEditCriteriaForm({ onSubmit, initialData, isEdit = false }: AddEditCriteriaFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    course: initialData?.course || '',
    academicYear: initialData?.academicYear || '2024-25',
    criteriaType: initialData?.criteriaType || 'combined',
    weightage: initialData?.weightage || {
      entranceExam: 70,
      academicPerformance: 20,
      interview: 10,
      sports: 0,
      ncc: 0,
      other: 0
    },
    minimumScore: initialData?.minimumScore || 60,
    cutoffMarks: initialData?.cutoffMarks || 85,
    totalSeats: initialData?.totalSeats || 100,
    reservedSeats: initialData?.reservedSeats || {
      sc: 15,
      st: 7,
      obc: 27,
      ews: 10,
      general: 41
    },
    status: initialData?.status || 'draft',
    description: initialData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteriaData: MeritCriteria = {
      id: initialData?.id || `MC${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      name: formData.name,
      course: formData.course,
      academicYear: formData.academicYear,
      criteriaType: formData.criteriaType,
      weightage: formData.weightage,
      minimumScore: formData.minimumScore,
      cutoffMarks: formData.cutoffMarks,
      totalSeats: formData.totalSeats,
      reservedSeats: formData.reservedSeats,
      status: formData.status,
      description: formData.description,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: initialData?.createdBy || "Admin User",
      totalApplicants: initialData?.totalApplicants || 0,
      selectedApplicants: initialData?.selectedApplicants || 0
    };
    onSubmit(criteriaData);
  };

  const handleWeightageChange = (field: keyof typeof formData.weightage, value: number) => {
    setFormData(prev => ({
      ...prev,
      weightage: {
        ...prev.weightage,
        [field]: value
      }
    }));
  };

  const handleReservedSeatsChange = (field: keyof typeof formData.reservedSeats, value: number) => {
    setFormData(prev => ({
      ...prev,
      reservedSeats: {
        ...prev.reservedSeats,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Criteria Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., B.Tech General Merit"
              required
            />
          </div>
          <div>
            <Label htmlFor="course">Course</Label>
            <Select value={formData.course} onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B.Tech">B.Tech</SelectItem>
                <SelectItem value="MBA">MBA</SelectItem>
                <SelectItem value="BBA">BBA</SelectItem>
                <SelectItem value="BCA">BCA</SelectItem>
                <SelectItem value="M.Tech">M.Tech</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="criteriaType">Criteria Type</Label>
            <Select value={formData.criteriaType} onValueChange={(value) => setFormData(prev => ({ ...prev, criteriaType: value as MeritCriteria['criteriaType'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select criteria type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrance_exam">Entrance Exam</SelectItem>
                <SelectItem value="academic_performance">Academic Performance</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="ncc">NCC</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as MeritCriteria['status'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="minimumScore">Minimum Score (%)</Label>
            <Input
              id="minimumScore"
              type="number"
              value={formData.minimumScore}
              onChange={(e) => setFormData(prev => ({ ...prev, minimumScore: Number(e.target.value) }))}
              placeholder="60"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <Label htmlFor="cutoffMarks">Cutoff Marks (%)</Label>
            <Input
              id="cutoffMarks"
              type="number"
              value={formData.cutoffMarks}
              onChange={(e) => setFormData(prev => ({ ...prev, cutoffMarks: Number(e.target.value) }))}
              placeholder="85"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <Label htmlFor="totalSeats">Total Seats</Label>
            <Input
              id="totalSeats"
              type="number"
              value={formData.totalSeats}
              onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: Number(e.target.value) }))}
              placeholder="100"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <Label>Weightage Distribution (%)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="entranceExam">Entrance Exam</Label>
              <Input
                id="entranceExam"
                type="number"
                value={formData.weightage.entranceExam}
                onChange={(e) => handleWeightageChange('entranceExam', Number(e.target.value))}
                placeholder="70"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="academicPerformance">Academic Performance</Label>
              <Input
                id="academicPerformance"
                type="number"
                value={formData.weightage.academicPerformance}
                onChange={(e) => handleWeightageChange('academicPerformance', Number(e.target.value))}
                placeholder="20"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="interview">Interview</Label>
              <Input
                id="interview"
                type="number"
                value={formData.weightage.interview}
                onChange={(e) => handleWeightageChange('interview', Number(e.target.value))}
                placeholder="10"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="sports">Sports</Label>
              <Input
                id="sports"
                type="number"
                value={formData.weightage.sports}
                onChange={(e) => handleWeightageChange('sports', Number(e.target.value))}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="ncc">NCC</Label>
              <Input
                id="ncc"
                type="number"
                value={formData.weightage.ncc}
                onChange={(e) => handleWeightageChange('ncc', Number(e.target.value))}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="other">Other</Label>
              <Input
                id="other"
                type="number"
                value={formData.weightage.other}
                onChange={(e) => handleWeightageChange('other', Number(e.target.value))}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Reserved Seats Distribution</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
            <div>
              <Label htmlFor="general">General</Label>
              <Input
                id="general"
                type="number"
                value={formData.reservedSeats.general}
                onChange={(e) => handleReservedSeatsChange('general', Number(e.target.value))}
                placeholder="41"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="obc">OBC</Label>
              <Input
                id="obc"
                type="number"
                value={formData.reservedSeats.obc}
                onChange={(e) => handleReservedSeatsChange('obc', Number(e.target.value))}
                placeholder="27"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="sc">SC</Label>
              <Input
                id="sc"
                type="number"
                value={formData.reservedSeats.sc}
                onChange={(e) => handleReservedSeatsChange('sc', Number(e.target.value))}
                placeholder="15"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="st">ST</Label>
              <Input
                id="st"
                type="number"
                value={formData.reservedSeats.st}
                onChange={(e) => handleReservedSeatsChange('st', Number(e.target.value))}
                placeholder="7"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="ews">EWS</Label>
              <Input
                id="ews"
                type="number"
                value={formData.reservedSeats.ews}
                onChange={(e) => handleReservedSeatsChange('ews', Number(e.target.value))}
                placeholder="10"
                min="0"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the merit criteria..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter className="flex-shrink-0 mt-6">
        <Button type="submit">
          {isEdit ? 'Update Criteria' : 'Create Criteria'}
        </Button>
      </DialogFooter>
    </form>
  );
}
