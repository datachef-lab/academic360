import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import SubjectsTable from '@/components/tables/components/SubjectsTable';
import SubjectsLoader from '@/components/tables/components/SubjectsLoader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SubjectFilters from '@/components/subjects/SubjectFilters';
import SubjectHeader from '@/components/subjects/SubjectHeader';
import DeleteSubjectDialog from '@/components/subjects/DeleteSubjectDialog';
import ErrorDisplay from '@/components/subjects/ErrorDisplay';
import { motion } from 'framer-motion';
import { Notebook } from 'lucide-react';

// Import course components
import CoursesTable from '@/components/tables/components/CoursesTable';
import CoursesLoader from '@/components/tables/components/CoursesLoader';
import CourseHeader from '@/components/courses/CourseHeader';
import DeleteCourseDialog from '@/components/courses/DeleteCourseDialog';
import CourseFilters from '@/components/courses/CourseFilters';

// Import services for subjects
import { 
  Subject, 
  NewSubject, 
  getAllSubjects, 
  addSubject, 
  deleteSubject,
  updateSubject 
} from '@/services/subject-metadata';
import { Course } from '@/types/academics/course';

// Import services for courses
import {
  // Course,
  NewCourse,
  getAllCourses,
  addCourse,
  updateCourse,
  deleteCourse
} from '@/services/course-api';

// Define interfaces for type safety
interface SubjectTypeOption {
  id: number;
  marksheetName: string;
}

interface DegreeOption {
  id: number;
  name: string;
}

interface ProgrammeOption {
  id: number;
  degreeProgramme: string;
  degreeId: number;
}

export const CoursesAndSubjectPage: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("subjects");

  // Subject states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState<boolean>(true);
  const [subjectError, setSubjectError] = useState<string>("");
  const [currentSemester, setCurrentSemester] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [subjectType, setSubjectType] = useState<string>("all");
  const [isOptionalFilter, setIsOptionalFilter] = useState<string>("all");
  const [degreeFilter, setDegreeFilter] = useState<string>("all");
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState<boolean>(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState<boolean>(false);

  // Course states
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(true);
  const [courseError, setCourseError] = useState<string>("");
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState<boolean>(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  // Course filter states
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>("");
  const [courseDegreeFilter, setCourseDegreeFilter] = useState<string>("all");
  const [courseProgrammeFilter, setCourseProgrammeFilter] = useState<string>("all");

  const { toast } = useToast();

  // New subject form state
  const [newSubject, setNewSubject] = useState<NewSubject>({
    name: "",
    irpCode: "",
    marksheetCode: "",
    subjectTypeId: 0,
    credit: 0,
    fullMarks: 100,
    semester: 1,
    streamId: 0,
    isOptional: false,
  });

  // New course form state
  const [newCourse, setNewCourse] = useState<NewCourse>({
    name: "",
    shortName: "",
    codePrefix: "",
    universityCode: "",
    streamId: undefined,
  });

  // Options for dropdowns
  const [subjectTypeOptions, setSubjectTypeOptions] = useState<SubjectTypeOption[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<DegreeOption[]>([]);
  const [programmeOptions, setProgrammeOptions] = useState<ProgrammeOption[]>([]);
  
  // Separate subject and course selection states
  const [selectedDegreeId, setSelectedDegreeId] = useState<number>(0);
  const [selectedCoursesDegreeId, setSelectedCoursesDegreeId] = useState<number>(0);

  // Delete dialog states for subjects
  const [isSubjectDeleteDialogOpen, setIsSubjectDeleteDialogOpen] = useState<boolean>(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState<boolean>(false);

  // Delete dialog states for courses
  const [isCourseDeleteDialogOpen, setIsCourseDeleteDialogOpen] = useState<boolean>(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState<boolean>(false);

  // User permissions state
  const [userCanDelete, setUserCanDelete] = useState<boolean>(true);

  // Add these new states for subject editing
  const [isEditSubjectMode, setIsEditSubjectMode] = useState<boolean>(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  // Function to clear error states
  const clearSubjectError = useCallback(() => {
    setSubjectError("");
  }, []);

  const clearCourseError = useCallback(() => {
    setCourseError("");
  }, []);

  // Fetch subjects data function
  const fetchSubjects = useCallback(async () => {
    setIsSubjectsLoading(true);
    try {
      const response = await getAllSubjects();
      if (response && Array.isArray(response.payload)) {
        setSubjects(response.payload);
        setSubjectError(""); // Clear any previous error when successful
      } else {
        console.error("Invalid response format:", response);
        setSubjectError("Invalid response format. Please check the console for details.");
      }
    } catch (error: unknown) {
      console.error("Error fetching subjects:", error);
      setSubjectError("Failed to fetch subjects. Please check the console for details.");
    } finally {
      setIsSubjectsLoading(false);
    }
  }, []);

  // Fetch courses data function
  const fetchCourses = useCallback(async () => {
    setIsCoursesLoading(true);
    try {
      const response = await getAllCourses();
      if (response && Array.isArray(response.payload)) {
        setCourses(response.payload);
        setCourseError(""); // Clear any previous error when successful
      } else {
        console.error("Invalid response format:", response);
        setCourseError("Invalid response format. Please check the console for details.");
      }
    } catch (error: unknown) {
      console.error("Error fetching courses:", error);
      setCourseError("Failed to fetch courses. Please check the console for details.");
    } finally {
      setIsCoursesLoading(false);
    }
  }, []);

  // Fetch subjects, courses, and dropdown options on component mount
  useEffect(() => {
    // Fetch data based on active tab
    if (activeTab === "subjects") {
      fetchSubjects();
    } else if (activeTab === "courses") {
      fetchCourses();
    }

    // Define fetchDropdownOptions directly inside the useEffect
    const fetchDropdownOptions = async () => {
      try {
        // Fetch subjects data to extract options
        const response = await getAllSubjects();

        if (response && Array.isArray(response.payload)) {
          const subjectData = response.payload;

          // Extract unique subject types
          const uniqueSubjectTypes = new Map<number, SubjectTypeOption>();
          subjectData.forEach((subject) => {
            if (subject.subjectType && !uniqueSubjectTypes.has(subject.subjectType.id)) {
              uniqueSubjectTypes.set(subject.subjectType.id, {
                id: subject.subjectType.id,
                marksheetName: subject.subjectType.marksheetName,
              });
            }
          });
          setSubjectTypeOptions(Array.from(uniqueSubjectTypes.values()));

          // Extract unique degrees
          const uniqueDegrees = new Map<number, DegreeOption>();
          subjectData.forEach((subject) => {
            if (subject.stream?.degree && !uniqueDegrees.has(subject.stream.degree.id)) {
              uniqueDegrees.set(subject.stream.degree.id, {
                id: subject.stream.degree.id,
                name: subject.stream.degree.name,
              });
            }
          });
          setDegreeOptions(Array.from(uniqueDegrees.values()));

          // Extract unique programmes/streams
          const uniqueProgrammes = new Map<number, ProgrammeOption>();
          subjectData.forEach((subject) => {
            if (subject.stream && !uniqueProgrammes.has(subject.stream.id)) {
              uniqueProgrammes.set(subject.stream.id, {
                id: subject.stream.id,
                degreeProgramme: subject.stream.degreeProgramme,
                degreeId: subject.stream.degree?.id || 0,
              });
            }
          });
          setProgrammeOptions(Array.from(uniqueProgrammes.values()));
        } else {
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Could not extract necessary options from subject data.",
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching dropdown options:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch dropdown options. Please check the console for details.",
        });
      }
    };

    fetchDropdownOptions();
  }, [activeTab, fetchSubjects, fetchCourses, toast]);

  // Effect to load data when tab changes
  useEffect(() => {
    if (activeTab === "subjects" && subjects.length === 0 && !isSubjectsLoading) {
      fetchSubjects();
    } else if (activeTab === "courses" && courses.length === 0 && !isCoursesLoading) {
      fetchCourses();
    }
  }, [activeTab, subjects.length, courses.length, isSubjectsLoading, isCoursesLoading, fetchSubjects, fetchCourses]);

  // Filter programmes based on selected degree
  const filteredProgrammes = useMemo(() => {
    if (!selectedCoursesDegreeId) return programmeOptions;
    return programmeOptions.filter((programme) => programme.degreeId === selectedCoursesDegreeId);
  }, [programmeOptions, selectedCoursesDegreeId]);

  // Safe access to subjects array with fallback to empty array
  const uniqueSemesters = useMemo(() => {
    if (!subjects || !subjects.length) return [];

    const semesters = subjects.map((subject) => subject.semester);
    return [...new Set(semesters)].sort((a, b) => a - b);
  }, [subjects]);

  // Get unique subject types as string[]
  const uniqueSubjectTypes = useMemo(() => {
    if (!subjects || !subjects.length) return [] as string[];

    const types = subjects
      .map((subject) => subject.subjectType?.marksheetName)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(types)].sort() as string[];
  }, [subjects]);

  // Get unique degrees as string[]
  const uniqueDegrees = useMemo(() => {
    if (!subjects || !subjects.length) return [] as string[];

    const degrees = subjects
      .map((subject) => subject.stream?.degree?.name)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(degrees)].sort() as string[];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];

    return subjects.filter((subject) => {
      // Filter by semester
      if (currentSemester !== "all" && subject.semester !== parseInt(currentSemester)) {
        return false;
      }

      // Filter by search query
      if (
        searchQuery &&
        !subject.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !subject.irpCode.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filter by subject type
      if (subjectType !== "all" && subject.subjectType?.marksheetName !== subjectType) {
        return false;
      }

      // Filter by optional status
      if (isOptionalFilter !== "all") {
        const isOptional = isOptionalFilter === "true";
        if (subject.isOptional !== isOptional) {
          return false;
        }
      }

      // Filter by degree
      if (degreeFilter !== "all" && subject.stream?.degree?.name !== degreeFilter) {
        return false;
      }

      return true;
    });
  }, [subjects, currentSemester, searchQuery, subjectType, isOptionalFilter, degreeFilter]);

  const resetFilters = useCallback(() => {
    setCurrentSemester("all");
    setSearchQuery("");
    setSubjectType("all");
    setIsOptionalFilter("all");
    setDegreeFilter("all");
  }, []);

  // Subject form handlers
  const handleSubjectInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle numeric values
    if (["credit", "fullMarks", "semester"].includes(name)) {
      setNewSubject((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setNewSubject((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  const handleSubjectSelectChange = useCallback((name: string, value: string) => {
    if (value === "") return;

    if (name === "degreeId") {
      const numValue = parseInt(value);
      setSelectedDegreeId(numValue);

      // Reset streamId when degree changes
      setNewSubject((prev) => ({
        ...prev,
        streamId: 0,
      }));
    } else if (["subjectTypeId", "streamId", "semester"].includes(name)) {
      setNewSubject((prev) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    }
  }, []);

  const handleSubjectCheckboxChange = useCallback((checked: boolean) => {
    setNewSubject((prev) => ({
      ...prev,
      isOptional: checked,
    }));
  }, []);

  // Course form handlers
  const handleCourseInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCourseSelectChange = useCallback((name: string, value: string) => {
    if (value === "") return;

    if (name === "degreeId") {
      const numValue = parseInt(value);
      setSelectedCoursesDegreeId(numValue);
    } else if (name === "streamId") {
      setNewCourse((prev) => ({
        ...prev,
        streamId: parseInt(value),
      }));
    }
  }, []);

  // Handle edit course
  const handleEditCourse = useCallback((course: Course) => {
    setNewCourse({
      name: course.name,
      shortName: course.shortName || "",
      codePrefix: course.codePrefix || "",
      universityCode: course.universityCode || "",
      streamId: course.stream?.id || 0
    });
    
    // Set the degree ID for filtering programmes
    if (course.stream?.degree?.id) {
      setSelectedCoursesDegreeId(course.stream.degree.id);
    }
    
    setEditingCourseId(course.id ?? null);
    setIsEditMode(true);
    setIsAddCourseDialogOpen(true);
  }, []);

  // Add or update course handler
  const handleAddCourse = useCallback(async () => {
    try {
      setIsSubmittingCourse(true);

      // Validation checks
      const requiredFields = [
        { field: "name", label: "Course Name" },
        { field: "streamId", label: "Programme" },
      ];

      const missingFields = requiredFields.filter(({ field }) => {
        if (field === "streamId") {
          return !newCourse.streamId;
        }
        return !newCourse[field as keyof NewCourse];
      });

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Please fill in the following fields: ${missingFields.map((f) => f.label).join(", ")}`,
        });
        return;
      }

      let response;
      
      if (isEditMode && editingCourseId) {
        // Update existing course
        response = await updateCourse(editingCourseId, newCourse);
        
        if (response) {
          toast({
            title: "Success",
            description: "Course updated successfully",
          });
        }
      } else {
        // Add new course
        response = await addCourse(newCourse);
        
        if (response) {
          toast({
            title: "Success",
            description: "Course added successfully",
          });
        }
      }

      // Refresh the courses list and close the dialog
      const refreshResponse = await getAllCourses();
      if (refreshResponse && Array.isArray(refreshResponse.payload)) {
        setCourses(refreshResponse.payload);
      }

      // Reset form and close dialog
      setNewCourse({
        name: "",
        shortName: "",
        codePrefix: "",
        universityCode: "",
        streamId: undefined,
      });
      setIsAddCourseDialogOpen(false);
      setIsEditMode(false);
      setEditingCourseId(null);
      setSelectedCoursesDegreeId(0);
    } catch (error: unknown) {
      console.error("Error processing course:", error);

      let errorMessage = "Failed to process course. Please try again.";

      // Try to extract more specific error message
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmittingCourse(false);
    }
  }, [newCourse, toast, isEditMode, editingCourseId]);
  
  // Cancel edit/add course
  const handleCancelCourse = useCallback(() => {
    setIsAddCourseDialogOpen(false);
    setIsEditMode(false);
    setEditingCourseId(null);
    setSelectedCoursesDegreeId(0);
    setNewCourse({
      name: "",
      shortName: "",
      codePrefix: "",
      universityCode: "",
      streamId: undefined,
    });
  }, []);

  // Handle delete subject
  const handleDeleteSubject = useCallback((subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject) {
      setSubjectToDelete(subject);
      setIsSubjectDeleteDialogOpen(true);
    }
  }, [subjects]);

  // Handle delete course
  const handleDeleteCourse = useCallback((courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setCourseToDelete(course);
      setIsCourseDeleteDialogOpen(true);
    }
  }, [courses]);

  // Confirm delete subject
  const confirmDeleteSubject = useCallback(async () => {
    if (!subjectToDelete) return;

    setIsDeletingSubject(true);
    try {
      const response = await deleteSubject(subjectToDelete.id);

      if (response) {
        toast({
          title: "Success",
          description: `Subject "${subjectToDelete.name}" deleted successfully`,
        });

        // Remove the deleted subject from the state
        setSubjects((prevSubjects) => prevSubjects.filter((subject) => subject.id !== subjectToDelete.id));
      }
    } catch (error: unknown) {
      console.error("Error deleting subject:", error);

      let errorMessage = "Failed to delete subject. Please try again.";

      // Try to extract more specific error message
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsDeletingSubject(false);
      setIsSubjectDeleteDialogOpen(false);
      setSubjectToDelete(null);
    }
  }, [subjectToDelete, toast]);

  // Confirm delete course
  const confirmDeleteCourse = useCallback(async () => {
    if (!courseToDelete || courseToDelete.id === undefined) return;

    setIsDeletingCourse(true);
    try {
      const response = await deleteCourse(courseToDelete.id!);

      if (response) {
        toast({
          title: "Success",
          description: `Course "${courseToDelete.name}" deleted successfully`,
        });

        // Remove the deleted course from the state
        setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseToDelete.id));
      }
    } catch (error: unknown) {
      console.error("Error deleting course:", error);

      let errorMessage = "Failed to delete course. Please try again.";

      // Try to extract more specific error message
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsDeletingCourse(false);
      setIsCourseDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  }, [courseToDelete, toast]);

  // In a real app, this would come from auth context or a user role check
  useEffect(() => {
    // For example, check user permissions from API or auth context
    // This is a placeholder - in a real app, this would be based on the user's role
    setUserCanDelete(true);
  }, []);

  // Get unique degrees for courses
  const uniqueCourseDegreesNames = useMemo(() => {
    if (!courses || !courses.length) return [] as string[];

    const degrees = courses
      .map((course) => course.stream?.degree?.name)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(degrees)].sort() as string[];
  }, [courses]);
  
  // Get unique programmes for courses
  const uniqueCourseProgrammes = useMemo(() => {
    if (!courses || !courses.length) return [] as string[];

    const programmes = courses
      .map((course) => course.stream?.degreeProgramme)
      .filter((name) => typeof name === 'string');
    return [...new Set(programmes)].sort() as string[];
  }, [courses]);
  
  // Filter courses based on filter criteria
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses.filter((course) => {
      // Filter by search query (look at all text fields that might match)
      if (courseSearchQuery) {
        const searchTermLower = courseSearchQuery.toLowerCase();
        const nameMatch = (course.name || '').toLowerCase().includes(searchTermLower);
        const shortNameMatch = (course.shortName || '').toLowerCase().includes(searchTermLower);
        const codePrefixMatch = (course.codePrefix || '').toLowerCase().includes(searchTermLower);
        const universityCodeMatch = (course.universityCode || '').toLowerCase().includes(searchTermLower);
        
        if (!nameMatch && !shortNameMatch && !codePrefixMatch && !universityCodeMatch) {
          return false;
        }
      }

      // Filter by degree
      if (courseDegreeFilter !== "all" && course.stream?.degree?.name !== courseDegreeFilter) {
        return false;
      }

      // Filter by programme
      if (courseProgrammeFilter !== "all" && course.stream?.degreeProgramme !== courseProgrammeFilter) {
        return false;
      }

      return true;
    });
  }, [courses, courseSearchQuery, courseDegreeFilter, courseProgrammeFilter]);
  
  // Reset course filters
  const resetCourseFilters = useCallback(() => {
    setCourseSearchQuery("");
    setCourseDegreeFilter("all");
    setCourseProgrammeFilter("all");
  }, []);

  // Handle edit subject
  const handleEditSubject = useCallback((subject: Subject) => {
    setNewSubject({
      name: subject.name,
      irpCode: subject.irpCode,
      marksheetCode: subject.marksheetCode || "",
      subjectTypeId: subject.subjectType?.id || 0,
      credit: subject.credit,
      fullMarks: subject.fullMarks,
      semester: subject.semester,
      streamId: subject.stream?.id || 0,
      isOptional: subject.isOptional,
    });
    
    // Set the degree ID for filtering programmes
    if (subject.stream?.degree?.id) {
      setSelectedDegreeId(subject.stream.degree.id);
    }
    
    setEditingSubjectId(subject.id);
    setIsEditSubjectMode(true);
    setIsAddSubjectDialogOpen(true);
  }, []);

  // Update the handleAddSubject function to support updating existing subjects
    const resetSubjectForm = useCallback(() => {
    setNewSubject({
      name: "",
      irpCode: "",
      marksheetCode: "",
      subjectTypeId: 0,
      credit: 0,
      fullMarks: 100,
      semester: 1,
      streamId: 0,
      isOptional: false,
    });
    setSelectedDegreeId(0);
    setIsAddSubjectDialogOpen(false);
    setIsEditSubjectMode(false);
    setEditingSubjectId(null);
  }, [setNewSubject, setSelectedDegreeId, setIsAddSubjectDialogOpen, setIsEditSubjectMode, setEditingSubjectId]);

  const handleAddSubject = useCallback(async () => {
    try {
      setIsSubmittingSubject(true);

      // Validation checks
      const requiredFields = [
        { field: "name", label: "Subject Name" },
        { field: "irpCode", label: "Subject Code" },
        { field: "subjectTypeId", label: "Subject Type" },
        { field: "credit", label: "Credit" },
        { field: "streamId", label: "Programme" },
        { field: "semester", label: "Semester" },
        { field: "fullMarks", label: "Full Marks" },
      ];

      const missingFields = requiredFields.filter(({ field }) => {
        if (field === "streamId") {
          return !newSubject.streamId;
        }
        return !newSubject[field as keyof NewSubject];
      });

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Please fill in the following fields: ${missingFields.map((f) => f.label).join(", ")}`,
        });
        return;
      }

      let response;
      
      if (isEditSubjectMode && editingSubjectId) {
        // Update existing subject
        response = await updateSubject(editingSubjectId, newSubject);
        
        if (response) {
          toast({
            title: "Success",
            description: `Subject "${newSubject.name}" updated successfully`,
          });
        }
      } else {
        // Add new subject
        response = await addSubject(newSubject);
        
        if (response) {
          toast({
            title: "Success",
            description: `Subject "${newSubject.name}" added successfully`,
          });
        }
      }

      // Refresh the subjects list and close the dialog
      const refreshResponse = await getAllSubjects();
      if (refreshResponse && Array.isArray(refreshResponse.payload)) {
        setSubjects(refreshResponse.payload);
      }

      // Reset form and close dialog
      resetSubjectForm();
    } catch (error: unknown) {
      console.error("Error processing subject:", error);

      let errorMessage = "Failed to process subject. Please try again.";

      // Try to extract more specific error message
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmittingSubject(false);
    }
  }, [isEditSubjectMode, editingSubjectId, newSubject, toast]);


  const handleCancelSubject = useCallback(() => {
    resetSubjectForm();
  }, [resetSubjectForm]);

  if (activeTab === "subjects" && subjectError) {
    return <ErrorDisplay error={subjectError} clearError={clearSubjectError} retry={fetchSubjects} />;
  }

  if (activeTab === "courses" && courseError) {
    return <ErrorDisplay error={courseError} clearError={clearCourseError} retry={fetchCourses} />;
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="grid grid-cols-1 mt-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-6"
         >
           <div className="grid grid-cols-[auto_1fr] items-center gap-4">
             <motion.div
               whileHover={{ scale: 1.05, rotate: -5 }}
               whileTap={{ scale: 0.95 }}
               className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
             >
               <Notebook className="h-8 w-8 drop-shadow-xl text-white" />
             </motion.div>
             <div>
               <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Courses & Subjects</h2>
               <p className="text-sm text-purple-600 font-medium">
               Access and administer the full course and subject registry
               </p>
             </div>
           </div>
   
           <motion.div
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
           />
         </motion.div>
   
         {/* content */}
       <div className=" px-8 py-6">
      <Tabs defaultValue="subjects" value={activeTab} onValueChange={setActiveTab} className="w-full ">
        <TabsList className="mb-4 bg-white border border-purple-100">
          <TabsTrigger value="subjects" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900">
            Subjects
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900">
            Courses
          </TabsTrigger>
        </TabsList>

        {/* Subjects Content */}
        <TabsContent value="subjects" className="mt-0">
          <Card className="mb-6 shadow-sm border-purple-300">
            <SubjectHeader 
              isAddDialogOpen={isAddSubjectDialogOpen}
              setIsAddDialogOpen={setIsAddSubjectDialogOpen}
              newSubject={newSubject}
              selectedDegreeId={selectedDegreeId}
              subjectTypeOptions={subjectTypeOptions}
              degreeOptions={degreeOptions}
              filteredProgrammes={filteredProgrammes}
              isSubmitting={isSubmittingSubject}
              handleInputChange={handleSubjectInputChange}
              handleSelectChange={handleSubjectSelectChange}
              handleCheckboxChange={handleSubjectCheckboxChange}
              handleAddSubject={handleAddSubject}
              isEditMode={isEditSubjectMode}
              onCancel={handleCancelSubject}
            />
            <CardContent className="pt-6">
              <SubjectFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentSemester={currentSemester}
                setCurrentSemester={setCurrentSemester}
                degreeFilter={degreeFilter}
                setDegreeFilter={setDegreeFilter}
                subjectType={subjectType}
                setSubjectType={setSubjectType}
                isOptionalFilter={isOptionalFilter}
                setIsOptionalFilter={setIsOptionalFilter}
                uniqueSemesters={uniqueSemesters}
                uniqueDegrees={uniqueDegrees}
                uniqueSubjectTypes={uniqueSubjectTypes}
                resetFilters={resetFilters}
                filteredSubjectsCount={filteredSubjects.length}
              />
            </CardContent>
          </Card>

          {isSubjectsLoading ? (
            <Card className="shadow-sm border-purple-300">
              <CardContent className="p-0">
                <div className="p-4 text-lg font-semibold text-purple-900">Loading subjects data...</div>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b border-purple-200 transition-colors hover:bg-purple-50/50">
                        {Array(8).fill(null).map((_, i) => (
                          <th key={i} className="h-12 px-4 text-left align-middle font-medium text-purple-800">
                            <div className="h-4 w-32 bg-purple-200 rounded animate-pulse"></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <SubjectsLoader rowCount={10} columnCount={8} />
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-purple-300">
              <CardContent className="p-0">
                <SubjectsTable
                  subjects={filteredSubjects}
                  onDelete={handleDeleteSubject}
                  onEdit={handleEditSubject}
                  canDelete={userCanDelete}
                  canEdit={userCanDelete}
                />
              </CardContent>
            </Card>
          )}

          {/* Delete Subject Confirmation Dialog */}
          <DeleteSubjectDialog 
            isOpen={isSubjectDeleteDialogOpen}
            setIsOpen={setIsSubjectDeleteDialogOpen}
            subject={subjectToDelete}
            isDeleting={isDeletingSubject}
            onConfirmDelete={confirmDeleteSubject}
          />
        </TabsContent>

        {/* Courses Content */}
        <TabsContent value="courses" className="mt-0">
          <Card className="mb-6 shadow-sm border-purple-300">
            <CourseHeader 
              isAddDialogOpen={isAddCourseDialogOpen}
              setIsAddDialogOpen={setIsAddCourseDialogOpen}
              newCourse={newCourse}
              degreeOptions={degreeOptions}
              programmeOptions={programmeOptions}
              selectedDegreeId={selectedCoursesDegreeId}
              isSubmitting={isSubmittingCourse}
              handleInputChange={handleCourseInputChange}
              handleSelectChange={handleCourseSelectChange}
              handleAddCourse={handleAddCourse}
              isEditMode={isEditMode}
              onCancel={handleCancelCourse}
            />
            <CardContent className="pt-6">
              <CourseFilters
                searchQuery={courseSearchQuery}
                setSearchQuery={setCourseSearchQuery}
                degreeFilter={courseDegreeFilter}
                setDegreeFilter={setCourseDegreeFilter}
                programmeFilter={courseProgrammeFilter}
                setProgrammeFilter={setCourseProgrammeFilter}
                resetFilters={resetCourseFilters}
                uniqueDegrees={uniqueCourseDegreesNames}
                uniqueProgrammes={uniqueCourseProgrammes}
                filteredCoursesCount={filteredCourses.length}
              />
            </CardContent>
          </Card>

          {isCoursesLoading ? (
            <Card className="shadow-sm border-purple-300">
              <CardContent className="p-0">
                <div className="p-4 text-lg font-semibold text-purple-900">Loading courses data...</div>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b border-purple-200 transition-colors hover:bg-purple-50/50">
                        {Array(5).fill(null).map((_, i) => (
                          <th key={i} className="h-12 px-4 text-left align-middle font-medium text-purple-800">
                            <div className="h-4 w-32 bg-purple-200 rounded animate-pulse"></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <CoursesLoader rowCount={10} columnCount={5} />
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-purple-300">
              <CardContent className="p-0">
                <CoursesTable
                  courses={filteredCourses}
                  onDelete={handleDeleteCourse}
                  onEdit={handleEditCourse}
                  canDelete={userCanDelete}
                  canEdit={userCanDelete}
                />
              </CardContent>
            </Card>
          )}

          {/* Delete Course Confirmation Dialog */}
          <DeleteCourseDialog 
            isOpen={isCourseDeleteDialogOpen}
            setIsOpen={setIsCourseDeleteDialogOpen}
            course={courseToDelete}
            isDeleting={isDeletingCourse}
            onConfirmDelete={confirmDeleteCourse}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default CoursesAndSubjectPage;
