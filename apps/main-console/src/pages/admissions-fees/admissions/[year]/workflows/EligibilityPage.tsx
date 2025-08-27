import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
//   GraduationCap,
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
//   BookOpen,
//   Target,
  Percent,
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
import { Checkbox } from "@/components/ui/checkbox";

interface EligibilityCriteria {
  id: string;
  name: string;
  course: string;
  academicYear: string;
  minimumPercentage: number;
  requiredSubjects: string[];
  ageLimit: {
    min: number;
    max: number;
  };
  categorySpecific: boolean;
  categories: string[];
  entranceExam: boolean;
  examName?: string;
  examScore?: number;
  status: 'active' | 'inactive' | 'draft';
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalApplicants: number;
  eligibleApplicants: number;
}

const dummyEligibilityCriteria: EligibilityCriteria[] = [
  {
    id: "EC001",
    name: "B.Tech General Eligibility",
    course: "B.Tech",
    academicYear: "2024-25",
    minimumPercentage: 60,
    requiredSubjects: ["Physics", "Chemistry", "Mathematics"],
    ageLimit: { min: 17, max: 25 },
    categorySpecific: false,
    categories: ["General", "OBC", "SC", "ST"],
    entranceExam: true,
    examName: "JEE Main",
    examScore: 75,
    status: "active",
    description: "Standard eligibility criteria for B.Tech program with JEE Main requirement",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 250,
    eligibleApplicants: 180
  },
  {
    id: "EC002",
    name: "B.Tech SC/ST Eligibility",
    course: "B.Tech",
    academicYear: "2024-25",
    minimumPercentage: 55,
    requiredSubjects: ["Physics", "Chemistry", "Mathematics"],
    ageLimit: { min: 17, max: 28 },
    categorySpecific: true,
    categories: ["SC", "ST"],
    entranceExam: true,
    examName: "JEE Main",
    examScore: 60,
    status: "active",
    description: "Relaxed eligibility criteria for SC/ST category students",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 80,
    eligibleApplicants: 65
  },
  {
    id: "EC003",
    name: "MBA General Eligibility",
    course: "MBA",
    academicYear: "2024-25",
    minimumPercentage: 50,
    requiredSubjects: ["Any"],
    ageLimit: { min: 20, max: 30 },
    categorySpecific: false,
    categories: ["General", "OBC", "SC", "ST"],
    entranceExam: true,
    examName: "CAT",
    examScore: 80,
    status: "active",
    description: "Eligibility criteria for MBA program with CAT requirement",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 120,
    eligibleApplicants: 95
  },
  {
    id: "EC004",
    name: "BBA General Eligibility",
    course: "BBA",
    academicYear: "2024-25",
    minimumPercentage: 45,
    requiredSubjects: ["Any"],
    ageLimit: { min: 17, max: 25 },
    categorySpecific: false,
    categories: ["General", "OBC", "SC", "ST"],
    entranceExam: false,
    status: "active",
    description: "Basic eligibility criteria for BBA program without entrance exam",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 180,
    eligibleApplicants: 150
  },
  {
    id: "EC005",
    name: "BCA General Eligibility",
    course: "BCA",
    academicYear: "2024-25",
    minimumPercentage: 50,
    requiredSubjects: ["Mathematics"],
    ageLimit: { min: 17, max: 25 },
    categorySpecific: false,
    categories: ["General", "OBC", "SC", "ST"],
    entranceExam: false,
    status: "active",
    description: "Eligibility criteria for BCA program with Mathematics requirement",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User",
    totalApplicants: 95,
    eligibleApplicants: 78
  },
  {
    id: "EC006",
    name: "M.Tech General Eligibility",
    course: "M.Tech",
    academicYear: "2024-25",
    minimumPercentage: 65,
    requiredSubjects: ["Engineering"],
    ageLimit: { min: 20, max: 30 },
    categorySpecific: false,
    categories: ["General", "OBC", "SC", "ST"],
    entranceExam: true,
    examName: "GATE",
    examScore: 85,
    status: "draft",
    description: "Advanced eligibility criteria for M.Tech program (Draft)",
    createdAt: "2024-07-15T09:00:00",
    updatedAt: "2024-07-15T09:00:00",
    createdBy: "Admin User",
    totalApplicants: 45,
    eligibleApplicants: 32
  }
];

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "secondary" as const, icon: XCircle },
  draft: { label: "Draft", variant: "outline" as const, icon: AlertCircle }
};

export default function EligibilityPage() {
  const { year } = useParams<{ year: string }>();
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriteria[]>(dummyEligibilityCriteria);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<EligibilityCriteria | null>(null);

  const filteredCriteria = eligibilityCriteria.filter(criteria => {
    const matchesSearch = criteria.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         criteria.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || criteria.course === courseFilter;
    const matchesStatus = statusFilter === 'all' || criteria.status === statusFilter;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = [
    {
      title: "Total Criteria",
      value: eligibilityCriteria.length,
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Active Criteria",
      value: eligibilityCriteria.filter(c => c.status === 'active').length,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Total Applicants",
      value: eligibilityCriteria.reduce((sum, c) => sum + c.totalApplicants, 0),
      icon: Users,
      color: "text-teal-500"
    },
    {
      title: "Eligible Rate",
      value: eligibilityCriteria.length > 0 
        ? Math.round((eligibilityCriteria.reduce((sum, c) => sum + c.eligibleApplicants, 0) / 
                      eligibilityCriteria.reduce((sum, c) => sum + c.totalApplicants, 0)) * 100)
        : 0,
      icon: Percent,
      color: "text-purple-500"
    }
  ];

  const courses = Array.from(new Set(eligibilityCriteria.map(c => c.course)));

  const handleAddCriteria = (newCriteria: Omit<EligibilityCriteria, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const criteria: EligibilityCriteria = {
      ...newCriteria,
      id: `EC${String(eligibilityCriteria.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Admin User",
      totalApplicants: 0,
      eligibleApplicants: 0
    };
    setEligibilityCriteria(prev => [...prev, criteria]);
    setIsAddDialogOpen(false);
  };

  const handleEditCriteria = (updatedCriteria: EligibilityCriteria) => {
    setEligibilityCriteria(prev => prev.map(c => c.id === updatedCriteria.id ? { ...updatedCriteria, updatedAt: new Date().toISOString() } : c));
    setIsEditDialogOpen(false);
    setSelectedCriteria(null);
  };

  const handleDeleteCriteria = (id: string) => {
    if (confirm('Are you sure you want to delete this eligibility criteria?')) {
      setEligibilityCriteria(prev => prev.filter(c => c.id !== id));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Eligibility Criteria - {year}</h1>
          <p className="text-gray-600">Manage eligibility requirements for different courses and categories</p>
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
                  {stat.title === "Eligible Rate" ? `${stat.value}%` : stat.value.toLocaleString()}
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
                  <DialogContent className="sm:max-w-2xl max-h-[70vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 border-b pb-2">
                      <DialogTitle>Add New Eligibility Criteria</DialogTitle>
                      <DialogDescription>Create new eligibility requirements for a course.</DialogDescription>
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

        {/* Eligibility Criteria Table */}
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Minimum %</TableHead>
                    <TableHead>Age Limit</TableHead>
                    <TableHead>Entrance Exam</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Applicants</TableHead>
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
                          <div className="font-medium">{criteria.minimumPercentage}%</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {criteria.ageLimit.min}-{criteria.ageLimit.max} years
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {criteria.entranceExam ? (
                              <div>
                                <div className="font-medium">{criteria.examName}</div>
                                <div className="text-gray-500">Min: {criteria.examScore}%</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not required</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {criteria.categories.map(category => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{criteria.eligibleApplicants}/{criteria.totalApplicants}</div>
                            <div className="text-gray-500">
                              {criteria.totalApplicants > 0 
                                ? Math.round((criteria.eligibleApplicants / criteria.totalApplicants) * 100)
                                : 0}% eligible
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
          <DialogContent className="sm:max-w-2xl max-h-[70vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 border-b pb-2">
              <DialogTitle>Edit Eligibility Criteria</DialogTitle>
              <DialogDescription>Update the eligibility requirements.</DialogDescription>
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
  onSubmit: (data: EligibilityCriteria) => void;
  initialData?: EligibilityCriteria;
  isEdit?: boolean;
}

function AddEditCriteriaForm({ onSubmit, initialData, isEdit = false }: AddEditCriteriaFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    course: initialData?.course || '',
    academicYear: initialData?.academicYear || '2024-25',
    minimumPercentage: initialData?.minimumPercentage || 50,
    requiredSubjects: initialData?.requiredSubjects || [],
    ageLimit: initialData?.ageLimit || { min: 17, max: 25 },
    categorySpecific: initialData?.categorySpecific || false,
    categories: initialData?.categories || [],
    entranceExam: initialData?.entranceExam || false,
    examName: initialData?.examName || '',
    examScore: initialData?.examScore || 0,
    status: initialData?.status || 'draft',
    description: initialData?.description || ''
  });

  const availableSubjects = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Engineering", "Any"];
  const availableCategories = ["General", "OBC", "SC", "ST", "EWS"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteriaData: EligibilityCriteria = {
      id: initialData?.id || `EC${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      name: formData.name,
      course: formData.course,
      academicYear: formData.academicYear,
      minimumPercentage: formData.minimumPercentage,
      requiredSubjects: formData.requiredSubjects,
      ageLimit: formData.ageLimit,
      categorySpecific: formData.categorySpecific,
      categories: formData.categories,
      entranceExam: formData.entranceExam,
      examName: formData.examName,
      examScore: formData.examScore,
      status: formData.status,
      description: formData.description,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: initialData?.createdBy || "Admin User",
      totalApplicants: initialData?.totalApplicants || 0,
      eligibleApplicants: initialData?.eligibleApplicants || 0
    };
    onSubmit(criteriaData);
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSubjects: prev.requiredSubjects.includes(subject)
        ? prev.requiredSubjects.filter(s => s !== subject)
        : [...prev.requiredSubjects, subject]
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
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
              placeholder="e.g., B.Tech General Eligibility"
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
            <Label htmlFor="minimumPercentage">Minimum Percentage (%)</Label>
            <Input
              id="minimumPercentage"
              type="number"
              value={formData.minimumPercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, minimumPercentage: Number(e.target.value) }))}
              placeholder="60"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as EligibilityCriteria['status'] }))}>
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
            <Label htmlFor="ageMin">Minimum Age</Label>
            <Input
              id="ageMin"
              type="number"
              value={formData.ageLimit.min}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                ageLimit: { ...prev.ageLimit, min: Number(e.target.value) }
              }))}
              placeholder="17"
              min="15"
              max="30"
              required
            />
          </div>
          <div>
            <Label htmlFor="ageMax">Maximum Age</Label>
            <Input
              id="ageMax"
              type="number"
              value={formData.ageLimit.max}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                ageLimit: { ...prev.ageLimit, max: Number(e.target.value) }
              }))}
              placeholder="25"
              min="15"
              max="35"
              required
            />
          </div>
        </div>

        <div>
          <Label>Required Subjects</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {availableSubjects.map(subject => (
              <div key={subject} className="flex items-center space-x-2">
                <Checkbox
                  id={subject}
                  checked={formData.requiredSubjects.includes(subject)}
                  onCheckedChange={() => handleSubjectToggle(subject)}
                />
                <Label htmlFor={subject} className="text-sm">{subject}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Applicable Categories</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {availableCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={formData.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label htmlFor={category} className="text-sm">{category}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="entranceExam"
              checked={formData.entranceExam}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, entranceExam: checked as boolean }))}
            />
            <Label htmlFor="entranceExam">Requires Entrance Exam</Label>
          </div>

          {formData.entranceExam && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examName">Exam Name</Label>
                <Input
                  id="examName"
                  value={formData.examName}
                  onChange={(e) => setFormData(prev => ({ ...prev, examName: e.target.value }))}
                  placeholder="e.g., JEE Main"
                />
              </div>
              <div>
                <Label htmlFor="examScore">Minimum Score (%)</Label>
                <Input
                  id="examScore"
                  type="number"
                  value={formData.examScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, examScore: Number(e.target.value) }))}
                  placeholder="75"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the eligibility criteria..."
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
