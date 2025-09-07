import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Download, Check, ChevronsUpDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";

// Mock data - updated with new column structure
const programCourseRelations = [
  {
    id: 1,
    subjectCategory: "MAJOR",
    subject: "Financial Accounting",
    semesters: ["I", "II"],
    cannotCombineWith: ["Advanced Accounting", "Cost Accounting"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 2,
    subjectCategory: "MINOR",
    subject: "Business Mathematics",
    semesters: ["I", "III"],
    cannotCombineWith: ["Statistics", "Operations Research"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 3,
    subjectCategory: "AECC",
    subject: "Marketing Management",
    semesters: ["III", "IV"],
    cannotCombineWith: ["Digital Marketing", "Sales Management"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 4,
    subjectCategory: "DSCC",
    subject: "Corporate Finance",
    semesters: ["I", "II"],
    cannotCombineWith: ["Basic Accounting", "Financial Management"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: true,
  },
  // Additional rows for testing scroll
  {
    id: 5,
    subjectCategory: "MDC",
    subject: "Microeconomics",
    semesters: ["I", "II"],
    cannotCombineWith: ["Macroeconomics", "Economic Theory"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 6,
    subjectCategory: "IDC",
    subject: "Business Statistics",
    semesters: ["II", "III"],
    cannotCombineWith: ["Applied Statistics", "Data Analysis"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: false,
  },
  {
    id: 7,
    subjectCategory: "CVAC",
    subject: "Human Resource Management",
    semesters: ["III", "IV"],
    cannotCombineWith: ["Organizational Behavior", "Personnel Management"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 8,
    subjectCategory: "VAC",
    subject: "Investment Analysis",
    semesters: ["IV", "V"],
    cannotCombineWith: ["Portfolio Management", "Financial Markets"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 9,
    subjectCategory: "MAJOR",
    subject: "Operations Management",
    semesters: ["II", "IV"],
    cannotCombineWith: ["Supply Chain Management", "Quality Management"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 10,
    subjectCategory: "MINOR",
    subject: "Information Systems",
    semesters: ["III", "V"],
    cannotCombineWith: ["Database Management", "System Analysis"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: false,
  },
  {
    id: 11,
    subjectCategory: "AECC",
    subject: "Business Law",
    semesters: ["I", "III"],
    cannotCombineWith: ["Corporate Law", "Commercial Law"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 12,
    subjectCategory: "DSCC",
    subject: "Business Communication",
    semesters: ["I", "II"],
    cannotCombineWith: ["Technical Writing", "Presentation Skills"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 13,
    subjectCategory: "MDC",
    subject: "Business Ethics",
    semesters: ["IV", "V"],
    cannotCombineWith: ["Corporate Governance", "Social Responsibility"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 14,
    subjectCategory: "IDC",
    subject: "Strategic Management",
    semesters: ["V", "VI"],
    cannotCombineWith: ["Business Policy", "Competitive Strategy"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 15,
    subjectCategory: "CVAC",
    subject: "Research Methodology",
    semesters: ["IV", "VI"],
    cannotCombineWith: ["Data Collection", "Statistical Analysis"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: false,
  },
  {
    id: 16,
    subjectCategory: "VAC",
    subject: "International Business",
    semesters: ["V", "VI"],
    cannotCombineWith: ["Global Marketing", "Cross-cultural Management"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 17,
    subjectCategory: "MAJOR",
    subject: "Entrepreneurship Development",
    semesters: ["V", "VII"],
    cannotCombineWith: ["Small Business Management", "Venture Capital"],
    applicableProgramCoursesFor: ["BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 18,
    subjectCategory: "MINOR",
    subject: "Leadership Skills",
    semesters: ["VI", "VII"],
    cannotCombineWith: ["Team Management", "Conflict Resolution"],
    applicableProgramCoursesFor: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
];

// Available options for dropdowns
const availableSubjects = [
  "Financial Accounting",
  "Business Mathematics",
  "Marketing Management",
  "Corporate Finance",
  "Operations Management",
  "Programming Fundamentals",
  "Data Structures & Algorithms",
];

const availableSemesters = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const subjectCategories = ["MAJOR", "MINOR", "AECC", "DSCC", "MDC", "IDC", "CVAC", "VAC"];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

export default function RestrictedGroupingPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New dialog state
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeTab, setActiveTab] = useState("category-program");
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [subjectRules, setSubjectRules] = useState<
    Array<{
      id: number;
      category: string;
      cannotCombineWith: string[];
      semesters: string[];
      applicableProgramCourses: string[];
      studiedIn12th: boolean;
      class12thBoardPassMarks: boolean;
      minMarksOverride: number;
      isActive: boolean;
    }>
  >([
    {
      id: 1,
      category: "",
      cannotCombineWith: [],
      semesters: [],
      applicableProgramCourses: [],
      studiedIn12th: false,
      class12thBoardPassMarks: false,
      minMarksOverride: 0,
      isActive: true,
    },
  ]);

  const [categoryProgramRules, setCategoryProgramRules] = useState<
    Array<{
      id: number;
      category: string;
      cannotCombineWith: string[];
      semesters: string[];
      applicableProgramCourses: string[];
    }>
  >([
    {
      id: 1,
      category: "",
      cannotCombineWith: [],
      semesters: [],
      applicableProgramCourses: [],
    },
  ]);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedData: paginatedRelations,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = useTablePagination({
    data: programCourseRelations,
    searchFields: ["subject", "subjectCategory", "applicableProgramCoursesFor"],
  });

  // Filter the data
  const filteredRelations = paginatedRelations.filter((item) => {
    const programCourseMatch =
      !selectedProgramCourse ||
      selectedProgramCourse === "all" ||
      item.applicableProgramCoursesFor.some((course: string) => course.includes(selectedProgramCourse));
    const categoryMatch = !selectedCategory || selectedCategory === "all" || item.subjectCategory === selectedCategory;
    return programCourseMatch && categoryMatch;
  });

  const addNewRule = () => {
    const currentRules = activeTab === "category-program" ? categoryProgramRules : subjectRules;
    const newRule = {
      id: Math.max(...currentRules.map((r) => r.id), 0) + 1,
      category: "",
      cannotCombineWith: [],
      semesters: [],
      applicableProgramCourses: [],
      studiedIn12th: false,
      class12thBoardPassMarks: false,
      minMarksOverride: 0,
      isActive: true,
    };

    if (activeTab === "category-program") {
      setCategoryProgramRules((rules) => [...rules, newRule]);
    } else {
      setSubjectRules((rules) => [...rules, newRule]);
    }
  };

  const updateRule = (ruleId: number, field: string, value: string | string[] | boolean | number) => {
    if (activeTab === "category-program") {
      setCategoryProgramRules((rules) =>
        rules.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule)),
      );
    } else {
      setSubjectRules((rules) => rules.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule)));
    }
  };

  const deleteRule = (ruleId: number) => {
    if (activeTab === "category-program") {
      setCategoryProgramRules((rules) => rules.filter((rule) => rule.id !== ruleId));
    } else {
      setSubjectRules((rules) => rules.filter((rule) => rule.id !== ruleId));
    }
  };

  const resetDialog = () => {
    setSelectedSubject("");
    setActiveTab("category-program");
    setSubjectRules([
      {
        id: 1,
        category: "",
        cannotCombineWith: [],
        semesters: [],
        applicableProgramCourses: [],
        studiedIn12th: false,
        class12thBoardPassMarks: false,
        minMarksOverride: 0,
        isActive: true,
      },
    ]);
    setCategoryProgramRules([
      {
        id: 1,
        category: "",
        cannotCombineWith: [],
        semesters: [],
        applicableProgramCourses: [],
      },
    ]);
  };

  const handleSaveSubjectRules = () => {
    // Here you would typically save the rules to your backend
    console.log("Saving subject rules:", {
      subject: selectedSubject,
      rules: subjectRules,
    });
    setIsAddDialogOpen(false);
    resetDialog();
  };

  // Helper functions for multi-select
  const togglePopover = (key: string) => {
    setOpenPopovers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMultiSelectChange = (ruleId: number, field: string, value: string, isSelected: boolean) => {
    const currentRules = activeTab === "category-program" ? categoryProgramRules : subjectRules;
    const rule = currentRules.find((r) => r.id === ruleId);
    if (!rule) return;

    const currentArray = rule[field as keyof typeof rule] as string[];
    const newArray = isSelected ? currentArray.filter((item) => item !== value) : [...currentArray, value];

    updateRule(ruleId, field, newArray);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center justify-between mb-4 p-4 border rounded-md bg-background">
          <div>
            <h1 className="text-2xl font-bold text-gray-700">Restricted Groupings</h1>
            <p className="text-gray-600 mt-1">
              Define relationships between programs-courses and subjects. Configure which subjects belong to which
              programs and courses.
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4 mt-4">
          <div className="flex-1">
            <Input
              placeholder="Search categories, programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProgramCourse} onValueChange={setSelectedProgramCourse}>
              <SelectTrigger className="w-48 text-gray-700">
                <SelectValue placeholder="Filter by Program-Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Program-Courses</SelectItem>
                {programCourses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 text-gray-700">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {subjectCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Table with Fixed Header */}
      <div className="flex-1 px-4 min-h-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b-2 border-l border-r border-gray-300">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-16">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-32">
                      Subject Category
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                      Subject
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-24">
                      Semesters
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                      Cannot Combine With
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-40">
                      Applicable Program-Courses For
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-20">
                      Status
                    </TableHead>
                    <TableHead className="text-right bg-gray-100 font-semibold text-gray-700 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto border-l border-r border-gray-300">
              <Table className="table-fixed">
                <TableBody>
                  {filteredRelations.map((relation, index) => (
                    <TableRow key={relation.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="border-r border-gray-300 w-16">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium border-r border-gray-300 w-32">
                        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                          {relation.subjectCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium border-r border-gray-300 w-48">{relation.subject}</TableCell>
                      <TableCell className="border-r border-gray-300 w-24">
                        <div className="flex flex-wrap gap-1">
                          {relation.semesters.map((semester, semIndex) => (
                            <Badge key={semIndex} variant="secondary" className="text-xs">
                              {semester}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-300 w-48">
                        <div className="flex flex-wrap gap-1">
                          {relation.cannotCombineWith.slice(0, 2).map((subject, subjectIndex) => (
                            <Badge
                              key={subjectIndex}
                              variant="outline"
                              className="text-xs border-red-500 text-red-700 bg-red-50"
                            >
                              {subject}
                            </Badge>
                          ))}
                          {relation.cannotCombineWith.length > 2 && (
                            <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                              +{relation.cannotCombineWith.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-300 w-40">
                        <div className="flex flex-wrap gap-1">
                          {relation.applicableProgramCoursesFor.map((course, courseIndex) => (
                            <Badge
                              key={courseIndex}
                              variant="outline"
                              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                            >
                              {course.split(" - ")[0]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-300 w-20">
                        <Badge
                          variant={relation.isActive ? "default" : "secondary"}
                          className={relation.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {relation.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right w-24">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Pagination */}
      <div className="flex-shrink-0 p-4 pt-2">
        <div className=" border rounded-lg">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="max-w-7xl flex flex-col h-[98vh] overflow-y-auto !items-start !justify-start !translate-y-0 top-4 left-1/2 !transform !-translate-x-1/2">
          <DialogHeader className="w-full border-b border-gray-300 mb-2 pb-4">
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <DialogTitle>Subject Relations</DialogTitle>
                <DialogDescription>
                  Configure relations, restrictions, and applicability rules for the selected subject.
                </DialogDescription>
              </div>
              <div className="flex justify-end rounded-md pr-7">
                <div className="flex items-center gap-3">
                  <Label htmlFor="subjectSelect" className="text-sm font-semibold whitespace-nowrap">
                    For Subject:
                  </Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full text-gray-700">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-1 h-full rounded-md">
            {/* Tabs for Rule Types */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-1 pb-4">
                <TabsList className="flex w-auto justify-start">
                  <TabsTrigger value="category-program">Category & Program-Course Specific</TabsTrigger>
                  <TabsTrigger value="subject-specific">Subject Specific</TabsTrigger>
                </TabsList>
                <Button
                  onClick={addNewRule}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedSubject || activeTab === "subject-specific"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              <TabsContent value="category-program" className="mt-0">
                <Card className="flex flex-col">
                  <CardContent className="p-0 flex flex-col">
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 border-b-2 border-l border-r border-gray-300">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-16">
                              Sr. No.
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-40">
                              Subject Category
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-60">
                              Cannot Combine With
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                              Applied For Semesters
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-60">
                              Applicable Program-Courses
                            </TableHead>
                            <TableHead className="text-right bg-gray-100 font-semibold text-gray-700 w-20">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>

                    {/* Table Body */}
                    <div className="border-l border-r border-gray-300">
                      <Table className="table-fixed">
                        <TableBody>
                          {!selectedSubject ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Please select a subject above to configure its rules
                              </TableCell>
                            </TableRow>
                          ) : (
                            categoryProgramRules.map((rule, index) => (
                              <TableRow key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <TableCell className="border-r border-gray-300 w-16">{index + 1}</TableCell>

                                {/* Subject Category Dropdown */}
                                <TableCell className="font-medium border-r border-gray-300 w-40">
                                  <Select
                                    value={rule.category}
                                    onValueChange={(value) => updateRule(rule.id, "category", value)}
                                  >
                                    <SelectTrigger className="w-full text-gray-700">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {subjectCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>

                                {/* Cannot Combine With Multi-Select */}
                                <TableCell className="border-r border-gray-300 w-60">
                                  <Popover
                                    open={openPopovers[`cannot-${rule.id}`] || false}
                                    onOpenChange={() => togglePopover(`cannot-${rule.id}`)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between text-left font-normal h-auto"
                                      >
                                        {rule.cannotCombineWith.length === 0 ? (
                                          <span className="text-muted-foreground">Select subjects...</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1 max-w-full">
                                            {rule.cannotCombineWith.slice(0, 2).map((subject) => (
                                              <Badge
                                                key={subject}
                                                variant="outline"
                                                className="text-xs border-red-500 text-red-700 bg-red-50"
                                              >
                                                {subject}
                                              </Badge>
                                            ))}
                                            {rule.cannotCombineWith.length > 2 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs border-red-500 text-red-700 bg-red-50"
                                              >
                                                +{rule.cannotCombineWith.length - 2} more
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search subjects..." className="text-gray-700" />
                                        <CommandEmpty>No subjects found.</CommandEmpty>
                                        <CommandGroup>
                                          {availableSubjects
                                            .filter((subject) => subject !== selectedSubject)
                                            .map((subject) => (
                                              <CommandItem
                                                key={subject}
                                                onSelect={() =>
                                                  handleMultiSelectChange(
                                                    rule.id,
                                                    "cannotCombineWith",
                                                    subject,
                                                    rule.cannotCombineWith.includes(subject),
                                                  )
                                                }
                                                className="text-gray-700"
                                              >
                                                <Check
                                                  className={`mr-2 h-4 w-4 ${
                                                    rule.cannotCombineWith.includes(subject)
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  }`}
                                                />
                                                {subject}
                                              </CommandItem>
                                            ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>

                                {/* Applied For Semesters Multi-Select */}
                                <TableCell className="border-r border-gray-300 w-48">
                                  <Popover
                                    open={openPopovers[`semester-${rule.id}`] || false}
                                    onOpenChange={() => togglePopover(`semester-${rule.id}`)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between text-left font-normal h-auto"
                                      >
                                        {rule.semesters.length === 0 ? (
                                          <span className="text-muted-foreground">Select semesters...</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1 max-w-full">
                                            {rule.semesters.map((semester) => (
                                              <Badge key={semester} variant="secondary" className="text-xs">
                                                {semester}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search semesters..." className="text-gray-700" />
                                        <CommandEmpty>No semesters found.</CommandEmpty>
                                        <CommandGroup>
                                          {availableSemesters.map((semester) => (
                                            <CommandItem
                                              key={semester}
                                              onSelect={() =>
                                                handleMultiSelectChange(
                                                  rule.id,
                                                  "semesters",
                                                  semester,
                                                  rule.semesters.includes(semester),
                                                )
                                              }
                                              className="text-gray-700"
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${
                                                  rule.semesters.includes(semester) ? "opacity-100" : "opacity-0"
                                                }`}
                                              />
                                              {semester}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>

                                {/* Applicable Program-Courses Multi-Select */}
                                <TableCell className="border-r border-gray-300 w-60">
                                  <Popover
                                    open={openPopovers[`course-${rule.id}`] || false}
                                    onOpenChange={() => togglePopover(`course-${rule.id}`)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between text-left font-normal h-auto"
                                      >
                                        {rule.applicableProgramCourses.length === 0 ? (
                                          <span className="text-muted-foreground">Select courses...</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1 max-w-full">
                                            {rule.applicableProgramCourses.map((course) => (
                                              <Badge
                                                key={course}
                                                variant="outline"
                                                className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                                              >
                                                {course.split(" - ")[0]}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search courses..." className="text-gray-700" />
                                        <CommandEmpty>No courses found.</CommandEmpty>
                                        <CommandGroup>
                                          {programCourses.map((course) => (
                                            <CommandItem
                                              key={course}
                                              onSelect={() =>
                                                handleMultiSelectChange(
                                                  rule.id,
                                                  "applicableProgramCourses",
                                                  course,
                                                  rule.applicableProgramCourses.includes(course),
                                                )
                                              }
                                              className="text-gray-700"
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${
                                                  rule.applicableProgramCourses.includes(course)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                }`}
                                              />
                                              {course}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>

                                {/* Delete Button */}
                                <TableCell className="text-right w-20">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRule(rule.id)}
                                    className="text-red-600 hover:text-red-700"
                                    disabled={categoryProgramRules.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subject-specific" className="mt-0">
                <Card className="flex flex-col">
                  <CardContent className="p-0 flex flex-col">
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 border-b-2 border-l border-r border-gray-300">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-16">
                              Sr. No.
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                              Studied in 12th?
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                              Class 12th Board Pass Marks
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                              Min Marks Override
                            </TableHead>
                            <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-32">
                              Status
                            </TableHead>
                            <TableHead className="text-right bg-gray-100 font-semibold text-gray-700 w-20">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>

                    {/* Table Body */}
                    <div className="border-l border-r border-gray-300">
                      <Table className="table-fixed">
                        <TableBody>
                          {!selectedSubject ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Please select a subject above to configure its rules
                              </TableCell>
                            </TableRow>
                          ) : (
                            subjectRules.map((rule, index) => (
                              <TableRow key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <TableCell className="border-r border-gray-300 w-16">{index + 1}</TableCell>

                                {/* Studied in 12th? Checkbox */}
                                <TableCell className="border-r border-gray-300 w-48">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`studied-12th-${rule.id}`}
                                      checked={rule.studiedIn12th}
                                      onCheckedChange={(checked) => updateRule(rule.id, "studiedIn12th", checked)}
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    <Label
                                      htmlFor={`studied-12th-${rule.id}`}
                                      className={`text-sm font-medium ${
                                        rule.studiedIn12th ? "text-green-600" : "text-gray-700"
                                      }`}
                                    >
                                      {rule.studiedIn12th ? "Yes" : "No"}
                                    </Label>
                                  </div>
                                </TableCell>

                                {/* Class 12th Board Pass Marks Checkbox */}
                                <TableCell className="border-r border-gray-300 w-48">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`board-pass-${rule.id}`}
                                      checked={rule.class12thBoardPassMarks}
                                      onCheckedChange={(checked) =>
                                        updateRule(rule.id, "class12thBoardPassMarks", checked)
                                      }
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    <Label
                                      htmlFor={`board-pass-${rule.id}`}
                                      className={`text-sm font-medium ${
                                        rule.class12thBoardPassMarks ? "text-green-600" : "text-gray-700"
                                      }`}
                                    >
                                      {rule.class12thBoardPassMarks ? "Yes" : "No"}
                                    </Label>
                                  </div>
                                </TableCell>

                                {/* Min Marks Override Input */}
                                <TableCell className="border-r border-gray-300 w-48">
                                  <Input
                                    type="number"
                                    placeholder="Enter marks"
                                    value={rule.minMarksOverride || ""}
                                    onChange={(e) =>
                                      updateRule(rule.id, "minMarksOverride", parseInt(e.target.value) || 0)
                                    }
                                    disabled={rule.class12thBoardPassMarks}
                                    className="w-full text-gray-700"
                                  />
                                </TableCell>

                                {/* Status Toggle */}
                                <TableCell className="border-r border-gray-300 w-32">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`status-${rule.id}`}
                                      checked={rule.isActive}
                                      onCheckedChange={(checked) => updateRule(rule.id, "isActive", checked)}
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    <Label
                                      htmlFor={`status-${rule.id}`}
                                      className={`text-sm font-medium ${
                                        rule.isActive ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {rule.isActive ? "Active" : "Inactive"}
                                    </Label>
                                  </div>
                                </TableCell>

                                {/* Delete Button */}
                                <TableCell className="text-right w-20">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRule(rule.id)}
                                    className="text-red-600 hover:text-red-700"
                                    disabled={subjectRules.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="relative bottom-0 flex justify-end w-full">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubjectRules}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={
                !selectedSubject ||
                (activeTab === "category-program"
                  ? !categoryProgramRules.some((rule) => rule.category)
                  : !subjectRules.some((rule) => rule.category))
              }
            >
              Save Subject Rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
