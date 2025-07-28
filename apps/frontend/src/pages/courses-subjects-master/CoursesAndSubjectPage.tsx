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


// Import course components
import CoursesTable from '@/components/tables/components/CoursesTable';
import CoursesLoader from '@/components/tables/components/CoursesLoader';
import CourseHeader from '@/components/courses/CourseHeader';
import DeleteCourseDialog from '@/components/courses/DeleteCourseDialog';
import CourseFilters from '@/components/courses/CourseFilters';

// Import services for subjects
import {
  getAllSubjects,
  addSubject,
  deleteSubject,
  updateSubject
} from '@/services/subject-metadata';
import { Course } from '@/types/course-design';

// Import services for courses
import {
  getAllCourses,
  addCourse,
  updateCourse,
  deleteCourse
} from '@/services/course-api';
import { SubjectMetadata, SubjectType } from '@/types/academics/subject-metadata';
import { Degree } from '@/types/resources/degree';
// import { ProgrammeType } from '@/types/enums';
// Define SubjectTypeOption locally if needed
// type SubjectTypeOption = { id: number; name: string; marksheetName: string };

// ProgrammeOption is not exported from subject-types, so define it here
type ProgrammeOption = { id: number; degreeProgramme: string; degreeId: number };

export const CoursesAndSubjectPage: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("courses");

  // Subject states
  const [subjects, setSubjects] = useState<SubjectMetadata[]>([]);
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
  const [newSubject, setNewSubject] = useState<SubjectMetadata>({
    id: 0,
    name: "",
    irpCode: "",
    marksheetCode: "",
    subjectType: null,
    credit: 0,
    fullMarks: 100,
    class: null,
    degree: null,
    isOptional: false,
    programmeType: "HONOURS",
    framework: null,
    specialization: null,
    category: "HONOURS",
    fullMarksInternal: 0,
    fullMarksPractical: 0,
    fullMarksProject: 0,
    fullMarksTheory: 0,
    fullMarksViva: 0,
    internalCredit: 0,
    irpName: '',
    practicalCredit: 0,
    projectCredit: 0,
    theoryCredit: 0,
    vivalCredit: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // New course form state
  const [newCourse, setNewCourse] = useState<Course>({
    name: "",
    shortName: "",
    sequence: 0,
    disabled: false,
    degree: null,
  });

  // Options for dropdowns
  const [subjectTypeOptions, setSubjectTypeOptions] = useState<SubjectType[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<Degree[]>([]);
  const [programmeOptions] = useState<ProgrammeOption[]>([]);

  // Separate subject and course selection states
  const [selectedDegreeId, setSelectedDegreeId] = useState<number>(0);
  const [selectedCoursesDegreeId, setSelectedCoursesDegreeId] = useState<number>(0);

  // Delete dialog states for subjects
  const [isSubjectDeleteDialogOpen, setIsSubjectDeleteDialogOpen] = useState<boolean>(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectMetadata | null>(null);
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
        setCourses(response.payload.map(course => ({
          ...course,
          shortName: course.shortName || '',
        }) as Course));
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

  // Fetch subjects, courses, and dropdown options on component mount or when activeTab changes
  useEffect(() => {
    if (activeTab === "subjects") {
      fetchSubjects();
    } else if (activeTab === "courses") {
      fetchCourses();
    }

    // Fetch dropdown options (subject types, degrees, programmes)
    const fetchDropdownOptions = async () => {
      try {
        const response = await getAllSubjects();
        if (response && Array.isArray(response.payload)) {
          const subjectData = response.payload;

          // Extract unique subject types
          const uniqueSubjectTypes = new Map<number, SubjectType>();
          subjectData.forEach((subject) => {
            if (subject.subjectType && !uniqueSubjectTypes.has(subject.subjectType.id!)) {
              uniqueSubjectTypes.set(subject.subjectType.id!, {
                id: subject.subjectType.id,
                name: subject.subjectType.name,
              });
            }
          });
          setSubjectTypeOptions(Array.from(uniqueSubjectTypes.values()));

          // Extract unique degrees
          const uniqueDegrees = new Map<number, Degree>();
          subjectData.forEach((subject) => {
            if (subject.degree && !uniqueDegrees.has(subject.degree.id!)) {
              uniqueDegrees.set(subject.degree.id!, {
                id: subject.degree.id!,
                name: subject.degree.name,
                level: "UNDER_GRADUATE",
                disabled: false,
                sequence: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          });
          setDegreeOptions(Array.from(uniqueDegrees.values()));

          // Extract unique programmes/streams
          // const uniqueProgrammes = new Map<number, ProgrammeOption>();
          // subjectData.forEach((subject) => {
          //   if (subject && !uniqueProgrammes.has(subject.id)) {
          //     uniqueProgrammes.set(subject.id, {
          //       id: subject.id,
          //       degreeProgramme: subject.degreeProgramme,
          //       degreeId: subject.degree?.id || 0,
          //     });
          //   }
          // });
          // setProgrammeOptions(Array.from(uniqueProgrammes.values()));
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


  // Safe access to subjects array with fallback to empty array
  const uniqueSemesters = useMemo(() => {
    if (!subjects || !subjects.length) return [];
    // If semester is not part of SubjectMetadata, skip or use a fallback
    return [];
  }, [subjects]);

  // Get unique subject types as string[]
  const uniqueSubjectTypes = useMemo(() => {
    if (!subjects || !subjects.length) return [] as string[];
    // If marksheetName is not present, use subject.subjectType?.name
    const types = subjects
      .map((subject) => subject.subjectType?.name)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(types)].sort() as string[];
  }, [subjects]);

  // Get unique degrees as string[]
  const uniqueDegrees = useMemo(() => {
    if (!subjects || !subjects.length) return [] as string[];
    // If degree name is not present, use subject.degree?.name
    const degrees = subjects
      .map((subject) => subject.degree?.name)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(degrees)].sort() as string[];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((subject) => {
      // Remove semester filter if not present
      // Remove degreeFilter using , use subject.degree.name if needed
      if (degreeFilter !== "all" && subject.degree?.name !== degreeFilter) {
        return false;
      }
      return true;
    });
  }, [subjects, degreeFilter]);

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
    setNewSubject((prev: SubjectMetadata) => ({
      ...prev,
      [name]: ["credit", "fullMarks", "semester", "subjectTypeId", "streamId"].includes(name)
        ? Number(value)
        : value,
    }));
  }, []);

  const handleSubjectSelectChange = useCallback((name: string, value: string) => {
    if (value === "") return;
    if (name === "degreeId") {
      const numValue = parseInt(value);
      setSelectedDegreeId(numValue);
      setNewSubject((prev: SubjectMetadata) => ({
        ...prev,
        streamId: 0,
      }));
    } else if (["subjectTypeId", "streamId", "semester"].includes(name)) {
      setNewSubject((prev: SubjectMetadata) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    }
  }, []);

  const handleSubjectCheckboxChange = useCallback((checked: boolean) => {
    setNewSubject((prev: SubjectMetadata) => ({
      ...prev,
      isOptional: checked,
    }));
  }, []);

  // Course form handlers
  const handleCourseInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCourse((prev: Course) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCourseSelectChange = useCallback((name: string, value: string) => {
    if (value === "") return;

    if (name === "degree") {
      const selectedDegree = degreeOptions.find(d => d.id?.toString() === value);
      setNewCourse((prev) => ({
        ...prev,
        degree: selectedDegree || null,
      }));
      setSelectedCoursesDegreeId(Number(value));
    } else if (name === "programmeType") {
      setNewCourse((prev) => ({
        ...prev,
        programmeType: value as 'HONOURS' | 'GENERAL',
      }));
    } else {
      setNewCourse((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }, [degreeOptions]);

  // Handle edit course
  const handleEditCourse = useCallback((course: Course) => {
    setNewCourse({
      name: course.name,
      shortName: course.shortName || "",
      sequence: course.sequence,
      disabled: course.disabled,
      degree: null,
    });

    // Set the degree ID for filtering programmes
    if (course?.degree?.id) {
      setSelectedCoursesDegreeId(course?.degree.id);
    }

    setEditingCourseId(course.id ?? null);
    setIsEditMode(true);
    setIsAddCourseDialogOpen(true);
  }, []);

  // Add or update course handler
  const handleAddCourse = useCallback(async () => {
    try {
      setIsSubmittingCourse(true);

      console.log('Submitting course:', newCourse);
      // Validation checks
      const requiredFields = [
        { field: "name", label: "Course Name" },
        { field: "degree", label: "Degree" },
        { field: "programmeType", label: "Programme" },
      ];

      const missingFields = requiredFields.filter(({ field }) => {
        if (field === "degree") {
          return !newCourse.degree;
        }
        return !newCourse[field as keyof Course];
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
        setCourses(refreshResponse.payload.map(course => ({
          ...course,
          shortName: course.shortName || '',
          sequence: course.sequence,
          disabled: course.disabled,
          degree: course.degree,

        }) as Course));
      }

      // Reset form and close dialog
      setNewCourse({
        name: "",
        shortName: "",
        sequence: 0,
        disabled: false,
        degree: null,
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
      sequence: 0,
      

      disabled: false,
      degree: null,
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
      const response = await deleteSubject(subjectToDelete.id!);

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
      .map((course) => course?.degree?.name)
      .filter((name): name is string => name !== undefined && name !== null);
    return [...new Set(degrees)].sort() as string[];
  }, [courses]);

  // Get unique programmes for courses
  const uniqueCourseProgrammes = useMemo(() => {
    if (!courses || !courses.length) return [] as string[];

    const programmes = courses
      .map((course) => course?.degree?.name)
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

        if (!nameMatch && !shortNameMatch) {
          return false;
        }
      }
      // Filter by degree
      if (courseDegreeFilter !== "all" && course?.degree?.name !== courseDegreeFilter) {
        return false;
      }

      // Filter by programme
      if (courseProgrammeFilter !== "all" && course?.degree?.name !== courseProgrammeFilter) {
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
  const handleEditSubject = useCallback((subject: SubjectMetadata) => {
    setNewSubject({
      id: subject.id,
      name: subject.name || "",
      irpCode: subject.irpCode || "",
      marksheetCode: subject.marksheetCode || "",
      subjectType: subject.subjectType,
      credit: typeof subject.credit === 'number' ? subject.credit : 0,
      fullMarks: typeof subject.fullMarks === 'number' ? subject.fullMarks : 0,
      class: subject.class,
      degree: subject.degree,
      isOptional: !!subject.isOptional,
      programmeType: subject.programmeType,
      framework: subject.framework,
      specialization: subject.specialization,
      category: subject.category,
      irpName: subject.irpName || "",
      theoryCredit: typeof subject.theoryCredit === 'number' ? subject.theoryCredit : 0,
      fullMarksTheory: typeof subject.fullMarksTheory === 'number' ? subject.fullMarksTheory : 0,
      practicalCredit: typeof subject.practicalCredit === 'number' ? subject.practicalCredit : 0,
      fullMarksPractical: typeof subject.fullMarksPractical === 'number' ? subject.fullMarksPractical : 0,
      internalCredit: typeof subject.internalCredit === 'number' ? subject.internalCredit : 0,
      fullMarksInternal: typeof subject.fullMarksInternal === 'number' ? subject.fullMarksInternal : 0,
      projectCredit: typeof subject.projectCredit === 'number' ? subject.projectCredit : 0,
      fullMarksProject: typeof subject.fullMarksProject === 'number' ? subject.fullMarksProject : 0,
      vivalCredit: typeof subject.vivalCredit === 'number' ? subject.vivalCredit : 0,
      fullMarksViva: typeof subject.fullMarksViva === 'number' ? subject.fullMarksViva : 0,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    });
    if (subject.degree && typeof subject.degree.id === 'number') {
      setSelectedDegreeId(subject.degree.id);
    }
    setEditingSubjectId(subject.id!);
    setIsEditSubjectMode(true);
    setIsAddSubjectDialogOpen(true);
  }, []);

  const resetSubjectForm = useCallback(() => {
    setNewSubject({
      id: 0,
      name: "",
      irpCode: "",
      marksheetCode: "",
      subjectType: null,
      credit: 0,
      fullMarks: 100,
      class: null,
      degree: null,
      isOptional: false,
      programmeType: "HONOURS",
      framework: null,
      specialization: null,
      category: "HONOURS",
      irpName: '',
      theoryCredit: 0,
      fullMarksTheory: 0,
      practicalCredit: 0,
      fullMarksPractical: 0,
      internalCredit: 0,
      fullMarksInternal: 0,
      projectCredit: 0,
      fullMarksProject: 0,
      vivalCredit: 0,
      fullMarksViva: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        { field: "semester", label: "Semester" },
        { field: "fullMarks", label: "Full Marks" },
      ];

      const missingFields = requiredFields.filter(({ field }) => {
        return !newSubject[field as keyof SubjectMetadata];
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

  // Use SubjectType[] and Degree[] directly
  const subjectTypeOptionList = subjectTypeOptions;
  const degreeOptionList = degreeOptions;

  if (activeTab === "subjects" && subjectError) {
    return <ErrorDisplay error={subjectError} clearError={clearSubjectError} retry={fetchSubjects} />;
  }

  if (activeTab === "courses" && courseError) {
    return <ErrorDisplay error={courseError} clearError={clearCourseError} retry={fetchCourses} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
      {/* <motion.div
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
      </motion.div> */}

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
                subjectTypeOptions={subjectTypeOptionList}
                degreeOptions={degreeOptionList}
                filteredProgrammes={["HONOURS", "GENERAL"]}
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
                degreeOptions={degreeOptionList}
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
