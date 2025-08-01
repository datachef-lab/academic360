import  { useState } from 'react';
import { 
  Search, 
  // Filter, 
  Mail, 
  Phone, 
  // Calendar, 
  // User, 
  // BookOpen, 
  MessageSquare,
  Eye,
  Reply,
  Archive,
  Download,
  MoreHorizontal,
  // ChevronDown,
  CheckCircle,
  Clock,
  // AlertCircle
} from 'lucide-react';
// import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PreAdmissionQuery {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  course: string;
  session: string;
  query: string;
  status: 'pending' | 'replied' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high';
  submittedAt: string;
  repliedAt?: string;
  assignedTo?: string;
  tags: string[];
}

const dummyQueries: PreAdmissionQuery[] = [
  {
    id: "Q001",
    studentName: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    phone: "+91 98765 43210",
    course: "B.Sc (Computer Science)",
    session: "2024-25",
    query: "What are the eligibility criteria for B.Sc Computer Science? I have completed 12th with PCM.",
    status: "pending",
    priority: "high",
    submittedAt: "2024-07-28T10:30:00",
    tags: ["eligibility", "computer-science"]
  },
  {
    id: "Q002",
    studentName: "Priya Patel",
    email: "priya.patel@email.com",
    phone: "+91 87654 32109",
    course: "B.A. English",
    session: "2024-25",
    query: "Is there any scholarship available for B.A English course? I belong to SC category.",
    status: "replied",
    priority: "medium",
    submittedAt: "2024-07-27T14:20:00",
    repliedAt: "2024-07-28T09:15:00",
    assignedTo: "Admission Team",
    tags: ["scholarship", "sc-category"]
  },
  {
    id: "Q003",
    studentName: "Amit Kumar",
    email: "amit.kumar@email.com",
    phone: "+91 76543 21098",
    course: "B.Com",
    session: "2024-25",
    query: "What documents are required for admission? Can I submit them online?",
    status: "resolved",
    priority: "low",
    submittedAt: "2024-07-26T16:45:00",
    repliedAt: "2024-07-27T11:30:00",
    assignedTo: "Document Team",
    tags: ["documents", "online-submission"]
  },
  {
    id: "Q004",
    studentName: "Neha Singh",
    email: "neha.singh@email.com",
    phone: "+91 65432 10987",
    course: "B.Sc (Physics)",
    session: "2024-25",
    query: "I want to know about the hostel facilities and fee structure for outstation students.",
    status: "pending",
    priority: "high",
    submittedAt: "2024-07-28T08:15:00",
    tags: ["hostel", "fee-structure", "outstation"]
  },
  {
    id: "Q005",
    studentName: "Vikram Mehta",
    email: "vikram.mehta@email.com",
    phone: "+91 54321 09876",
    course: "BBA",
    session: "2024-25",
    query: "What is the admission process for BBA? When will the application form be available?",
    status: "replied",
    priority: "medium",
    submittedAt: "2024-07-25T12:30:00",
    repliedAt: "2024-07-26T10:45:00",
    assignedTo: "Admission Team",
    tags: ["admission-process", "application-form"]
  },
  {
    id: "Q006",
    studentName: "Sneha Reddy",
    email: "sneha.reddy@email.com",
    phone: "+91 43210 98765",
    course: "B.A. Economics",
    session: "2024-25",
    query: "I have a gap year after 12th. Will this affect my admission chances?",
    status: "pending",
    priority: "medium",
    submittedAt: "2024-07-28T11:45:00",
    tags: ["gap-year", "eligibility"]
  },
  {
    id: "Q007",
    studentName: "Rajesh Verma",
    email: "rajesh.verma@email.com",
    phone: "+91 32109 87654",
    course: "B.Sc (Chemistry)",
    session: "2024-25",
    query: "What are the career prospects after B.Sc Chemistry? Do you provide placement assistance?",
    status: "resolved",
    priority: "low",
    submittedAt: "2024-07-24T15:20:00",
    repliedAt: "2024-07-25T13:10:00",
    assignedTo: "Career Team",
    tags: ["career-prospects", "placement"]
  },
  {
    id: "Q008",
    studentName: "Anjali Desai",
    email: "anjali.desai@email.com",
    phone: "+91 21098 76543",
    course: "B.A. Psychology",
    session: "2024-25",
    query: "Is there any entrance exam for B.A Psychology? What is the selection criteria?",
    status: "replied",
    priority: "high",
    submittedAt: "2024-07-27T09:30:00",
    repliedAt: "2024-07-28T08:20:00",
    assignedTo: "Admission Team",
    tags: ["entrance-exam", "selection-criteria"]
  }
];

// const statusConfig = {
//   pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
//   replied: { label: "Replied", variant: "default" as const, icon: CheckCircle },
//   resolved: { label: "Resolved", variant: "default" as const, icon: CheckCircle },
//   archived: { label: "Archived", variant: "secondary" as const, icon: Archive }
// };

const priorityConfig = {
  low: { label: "Low", variant: "secondary" as const },
  medium: { label: "Medium", variant: "default" as const },
  high: { label: "High", variant: "destructive" as const }
};

export default function PreAdmissionQueriesPage() {
  const [queries, setQueries] = useState<PreAdmissionQuery[]>(dummyQueries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || query.priority === priorityFilter;
    const matchesCourse = courseFilter === 'all' || query.course === courseFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCourse;
  });

  const handleSelectQuery = (queryId: string) => {
    setSelectedQueries(prev => 
      prev.includes(queryId) 
        ? prev.filter(id => id !== queryId)
        : [...prev, queryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQueries.length === filteredQueries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries(filteredQueries.map(q => q.id));
    }
  };

  const handleStatusChange = (queryId: string, newStatus: PreAdmissionQuery['status']) => {
    setQueries(prev => prev.map(q => 
      q.id === queryId 
        ? { ...q, status: newStatus, repliedAt: newStatus === 'replied' ? new Date().toISOString() : q.repliedAt }
        : q
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = [
    {
      title: "Total Queries",
      value: queries.length,
      icon: MessageSquare,
      color: "text-blue-500"
    },
    {
      title: "Pending",
      value: queries.filter(q => q.status === 'pending').length,
      icon: Clock,
      color: "text-yellow-500"
    },
    {
      title: "Replied",
      value: queries.filter(q => q.status === 'replied').length,
      icon: CheckCircle,
      color: "text-blue-500"
    },
    {
      title: "Resolved",
      value: queries.filter(q => q.status === 'resolved').length,
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Admission Queries</h1>
          <p className="text-gray-600">Manage and respond to student inquiries about admissions</p>
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
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or query..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              {/* Course Filter */}
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {Array.from(new Set(queries.map(q => q.course))).map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Button>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply Selected
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedQueries.length === filteredQueries.length && filteredQueries.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Query</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueries.map((query) => {
                    // const StatusIcon = statusConfig[query.status].icon;
                    return (
                      <TableRow key={query.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedQueries.includes(query.id)}
                            onCheckedChange={() => handleSelectQuery(query.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{query.studentName}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {query.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {query.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{query.course}</div>
                            <div className="text-sm text-gray-500">{query.session}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm line-clamp-2">{query.query}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {query.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={query.status}
                            onValueChange={(value) => handleStatusChange(query.id, value as PreAdmissionQuery['status'])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityConfig[query.priority].variant}>
                            {priorityConfig[query.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(query.submittedAt)}
                          </div>
                          {query.repliedAt && (
                            <div className="text-xs text-gray-500">
                              Replied: {formatDate(query.repliedAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {query.assignedTo || '-'}
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
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
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

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredQueries.length} of {queries.length} queries
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button size="sm">1</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
