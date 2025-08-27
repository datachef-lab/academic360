import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  IndianRupee,
//   Users,
  Building,
  FileText,
//   Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
//   Settings,
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

interface FeesSlab {
  id: string;
  name: string;
  category: string;
  course: string;
  academicYear: string;
  baseAmount: number;
  discountPercentage: number;
  finalAmount: number;
  maxStudents: number;
  currentEnrolled: number;
  status: 'active' | 'inactive' | 'draft';
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const dummyFeesSlabs: FeesSlab[] = [
  {
    id: "FS001",
    name: "General Category - B.Tech",
    category: "General",
    course: "B.Tech",
    academicYear: "2024-25",
    baseAmount: 50000,
    discountPercentage: 0,
    finalAmount: 50000,
    maxStudents: 100,
    currentEnrolled: 45,
    status: "active",
    description: "Standard fees for General category students in B.Tech program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS002",
    name: "SC/ST Category - B.Tech",
    category: "SC/ST",
    course: "B.Tech",
    academicYear: "2024-25",
    baseAmount: 50000,
    discountPercentage: 25,
    finalAmount: 37500,
    maxStudents: 50,
    currentEnrolled: 28,
    status: "active",
    description: "Discounted fees for SC/ST category students in B.Tech program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS003",
    name: "OBC Category - B.Tech",
    category: "OBC",
    course: "B.Tech",
    academicYear: "2024-25",
    baseAmount: 50000,
    discountPercentage: 15,
    finalAmount: 42500,
    maxStudents: 75,
    currentEnrolled: 52,
    status: "active",
    description: "Discounted fees for OBC category students in B.Tech program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS004",
    name: "General Category - MBA",
    category: "General",
    course: "MBA",
    academicYear: "2024-25",
    baseAmount: 75000,
    discountPercentage: 0,
    finalAmount: 75000,
    maxStudents: 60,
    currentEnrolled: 38,
    status: "active",
    description: "Standard fees for General category students in MBA program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS005",
    name: "SC/ST Category - MBA",
    category: "SC/ST",
    course: "MBA",
    academicYear: "2024-25",
    baseAmount: 75000,
    discountPercentage: 30,
    finalAmount: 52500,
    maxStudents: 30,
    currentEnrolled: 22,
    status: "active",
    description: "Discounted fees for SC/ST category students in MBA program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS006",
    name: "General Category - BBA",
    category: "General",
    course: "BBA",
    academicYear: "2024-25",
    baseAmount: 40000,
    discountPercentage: 0,
    finalAmount: 40000,
    maxStudents: 80,
    currentEnrolled: 65,
    status: "active",
    description: "Standard fees for General category students in BBA program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS007",
    name: "OBC Category - BBA",
    category: "OBC",
    course: "BBA",
    academicYear: "2024-25",
    baseAmount: 40000,
    discountPercentage: 10,
    finalAmount: 36000,
    maxStudents: 60,
    currentEnrolled: 48,
    status: "active",
    description: "Discounted fees for OBC category students in BBA program",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-07-10T14:20:00",
    createdBy: "Admin User"
  },
  {
    id: "FS008",
    name: "General Category - BCA",
    category: "General",
    course: "BCA",
    academicYear: "2024-25",
    baseAmount: 35000,
    discountPercentage: 0,
    finalAmount: 35000,
    maxStudents: 70,
    currentEnrolled: 42,
    status: "draft",
    description: "Standard fees for General category students in BCA program (Draft)",
    createdAt: "2024-07-15T09:00:00",
    updatedAt: "2024-07-15T09:00:00",
    createdBy: "Admin User"
  }
];

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "secondary" as const, icon: XCircle },
  draft: { label: "Draft", variant: "outline" as const, icon: AlertCircle }
};

export default function FeesSlabMappingPage() {
  const { year } = useParams<{ year: string }>();
  const [feesSlabs, setFeesSlabs] = useState<FeesSlab[]>(dummyFeesSlabs);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState<FeesSlab | null>(null);

  const filteredSlabs = feesSlabs.filter(slab => {
    const matchesSearch = slab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slab.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || slab.category === categoryFilter;
    const matchesCourse = courseFilter === 'all' || slab.course === courseFilter;
    const matchesStatus = statusFilter === 'all' || slab.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesCourse && matchesStatus;
  });

  const stats = [
    {
      title: "Total Slabs",
      value: feesSlabs.length,
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Active Slabs",
      value: feesSlabs.filter(s => s.status === 'active').length,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Total Revenue",
      value: feesSlabs.reduce((sum, slab) => sum + (slab.finalAmount * slab.currentEnrolled), 0),
      icon: IndianRupee,
      color: "text-teal-500"
    },
    {
      title: "Average Fee",
      value: feesSlabs.length > 0 ? Math.round(feesSlabs.reduce((sum, slab) => sum + slab.finalAmount, 0) / feesSlabs.length) : 0,
      icon: Building,
      color: "text-purple-500"
    }
  ];

  const categories = Array.from(new Set(feesSlabs.map(s => s.category)));
  const courses = Array.from(new Set(feesSlabs.map(s => s.course)));

  const handleAddSlab = (newSlab: Omit<FeesSlab, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const slab: FeesSlab = {
      ...newSlab,
      id: `FS${String(feesSlabs.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Admin User"
    };
    setFeesSlabs(prev => [...prev, slab]);
    setIsAddDialogOpen(false);
  };

  const handleEditSlab = (updatedSlab: FeesSlab) => {
    setFeesSlabs(prev => prev.map(s => s.id === updatedSlab.id ? { ...updatedSlab, updatedAt: new Date().toISOString() } : s));
    setIsEditDialogOpen(false);
    setSelectedSlab(null);
  };

  const handleDeleteSlab = (id: string) => {
    if (confirm('Are you sure you want to delete this fees slab?')) {
      setFeesSlabs(prev => prev.filter(s => s.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fees Slab Mapping - {year}</h1>
          <p className="text-gray-600">Manage fee structures for different categories and courses</p>
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
                  {stat.title === "Total Revenue" || stat.title === "Average Fee" 
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()}
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

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                      Add Slab
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Fees Slab</DialogTitle>
                      <DialogDescription>Create a new fee structure for a category and course combination.</DialogDescription>
                    </DialogHeader>
                    <AddEditSlabForm onSubmit={handleAddSlab} />
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

        {/* Fees Slabs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fees Slabs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final Amount</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlabs.map((slab) => {
                    const StatusIcon = statusConfig[slab.status].icon;
                    return (
                      <TableRow key={slab.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{slab.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{slab.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{slab.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{slab.course}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(slab.baseAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {slab.discountPercentage > 0 ? (
                              <Badge variant="secondary" className="text-green-700 bg-green-100">
                                -{slab.discountPercentage}%
                              </Badge>
                            ) : (
                              <span className="text-gray-500">No discount</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-green-600">{formatCurrency(slab.finalAmount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{slab.currentEnrolled}/{slab.maxStudents}</div>
                            <div className="text-gray-500">
                              {Math.round((slab.currentEnrolled / slab.maxStudents) * 100)}% filled
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[slab.status].variant}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[slab.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(slab.createdAt)}
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
                                setSelectedSlab(slab);
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
                              <DropdownMenuItem onClick={() => handleDeleteSlab(slab.id)}>
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Fees Slab</DialogTitle>
              <DialogDescription>Update the fee structure details.</DialogDescription>
            </DialogHeader>
            {selectedSlab && (
              <AddEditSlabForm 
                onSubmit={handleEditSlab} 
                initialData={selectedSlab}
                isEdit={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface AddEditSlabFormProps {
  onSubmit: (data: FeesSlab) => void;
  initialData?: FeesSlab;
  isEdit?: boolean;
}

function AddEditSlabForm({ onSubmit, initialData, isEdit = false }: AddEditSlabFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    course: initialData?.course || '',
    academicYear: initialData?.academicYear || '2024-25',
    baseAmount: initialData?.baseAmount || 0,
    discountPercentage: initialData?.discountPercentage || 0,
    maxStudents: initialData?.maxStudents || 100,
    status: initialData?.status || 'draft',
    description: initialData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = formData.baseAmount * (1 - formData.discountPercentage / 100);
    const slabData: FeesSlab = {
      id: initialData?.id || `FS${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      name: formData.name,
      category: formData.category,
      course: formData.course,
      academicYear: formData.academicYear,
      baseAmount: formData.baseAmount,
      discountPercentage: formData.discountPercentage,
      finalAmount: Math.round(finalAmount),
      maxStudents: formData.maxStudents,
      currentEnrolled: initialData?.currentEnrolled || 0,
      status: formData.status,
      description: formData.description,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: initialData?.createdBy || "Admin User"
    };
    onSubmit(slabData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Slab Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., General Category - B.Tech"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="OBC">OBC</SelectItem>
              <SelectItem value="SC/ST">SC/ST</SelectItem>
              <SelectItem value="EWS">EWS</SelectItem>
            </SelectContent>
          </Select>
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
          <Label htmlFor="baseAmount">Base Amount (₹)</Label>
          <Input
            id="baseAmount"
            type="number"
            value={formData.baseAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, baseAmount: Number(e.target.value) }))}
            placeholder="50000"
            required
          />
        </div>
        <div>
          <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
          <Input
            id="discountPercentage"
            type="number"
            value={formData.discountPercentage}
            onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
            placeholder="0"
            min="0"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="maxStudents">Maximum Students</Label>
          <Input
            id="maxStudents"
            type="number"
            value={formData.maxStudents}
            onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: Number(e.target.value) }))}
            placeholder="100"
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'draft' }))}>
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
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the fee structure..."
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit">
          {isEdit ? 'Update Slab' : 'Create Slab'}
        </Button>
      </DialogFooter>
    </form>
  );
}
