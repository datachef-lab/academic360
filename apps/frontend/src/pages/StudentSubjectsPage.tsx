import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import SubjectsTable, { Subject } from '@/components/tables/components/SubjectsTable';
import SubjectsLoader from '@/components/tables/components/SubjectsLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Filter, Search, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiResponse {
  httpStatusCode: number;
  payload: Subject[];
  httpStatus: string;
  message: string;
}

interface NewSubject {
  name: string;
  irpCode: string;
  marksheetCode: string;
  subjectTypeId: number;
  credit: number;
  fullMarks: number;
  semester: number;
  streamId: number;
  isOptional: boolean;
}

// Interface for subject type dropdown
interface SubjectTypeOption {
  id: number;
  marksheetName: string;
}

// Interface for degree dropdown
interface DegreeOption {
  id: number;
  name: string;
}

// Interface for programme dropdown
interface ProgrammeOption {
  id: number;
  degreeProgramme: string;
  degreeId: number;
}

export const StudentSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentSemester, setCurrentSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectType, setSubjectType] = useState<string>('all');
  const [isOptionalFilter, setIsOptionalFilter] = useState<string>('all');
  const [degreeFilter, setDegreeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  // New subject form state
  const [newSubject, setNewSubject] = useState<NewSubject>({
    name: '',
    irpCode: '',
    marksheetCode: '',
    subjectTypeId: 0,
    credit: 0,
    fullMarks: 100,
    semester: 1,
    streamId: 0,
    isOptional: false,
  });

  // Options for dropdowns
  const [subjectTypeOptions, setSubjectTypeOptions] = useState<SubjectTypeOption[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<DegreeOption[]>([]);
  const [programmeOptions, setProgrammeOptions] = useState<ProgrammeOption[]>([]);
  const [selectedDegreeId, setSelectedDegreeId] = useState<number>(0);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // User can delete subjects state
  const [userCanDeleteSubjects, setUserCanDeleteSubjects] = useState<boolean>(true);

  // Function to clear error state
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Fetch subjects data function
  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>('http://localhost:8080/api/subject-metadatas');
      if (response.data && Array.isArray(response.data.payload)) {
        setSubjects(response.data.payload);
        setError(''); // Clear any previous error when successful
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format. Please check the console for details.');
      }
    } catch (error: unknown) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch subjects and dropdown options on component mount
  useEffect(() => {
    // Fetch subjects data
    fetchSubjects();

    // Define fetchDropdownOptions directly inside the useEffect
    const fetchDropdownOptions = async () => {
      try {
        // Since the separate API endpoints for subject types, degrees, and streams are not working,
        // we'll extract this information from the subjects data we already have
        console.log('Using subject-metadatas endpoint to extract dropdown options...');
        
        // Re-fetch the subjects data to ensure we have the most up-to-date information
        const response = await axios.get<ApiResponse>('http://localhost:8080/api/subject-metadatas');
        
        if (response.data && Array.isArray(response.data.payload)) {
          const subjectData = response.data.payload;
          
          // Extract unique subject types
          const uniqueSubjectTypes = new Map<number, SubjectTypeOption>();
          subjectData.forEach(subject => {
            if (subject.subjectType && !uniqueSubjectTypes.has(subject.subjectType.id)) {
              uniqueSubjectTypes.set(subject.subjectType.id, {
                id: subject.subjectType.id,
                marksheetName: subject.subjectType.marksheetName
              });
            }
          });
          setSubjectTypeOptions(Array.from(uniqueSubjectTypes.values()));
          console.log('Extracted subject types:', Array.from(uniqueSubjectTypes.values()));
          
          // Extract unique degrees
          const uniqueDegrees = new Map<number, DegreeOption>();
          subjectData.forEach(subject => {
            if (subject.stream?.degree && !uniqueDegrees.has(subject.stream.degree.id)) {
              uniqueDegrees.set(subject.stream.degree.id, {
                id: subject.stream.degree.id,
                name: subject.stream.degree.name
              });
            }
          });
          setDegreeOptions(Array.from(uniqueDegrees.values()));
          console.log('Extracted degrees:', Array.from(uniqueDegrees.values()));
          
          // Extract unique programmes/streams
          const uniqueProgrammes = new Map<number, ProgrammeOption>();
          subjectData.forEach(subject => {
            if (subject.stream && !uniqueProgrammes.has(subject.stream.id)) {
              uniqueProgrammes.set(subject.stream.id, {
                id: subject.stream.id,
                degreeProgramme: subject.stream.degreeProgramme,
                degreeId: subject.stream.degree?.id || 0
              });
            }
          });
          setProgrammeOptions(Array.from(uniqueProgrammes.values()));
          console.log('Extracted programmes:', Array.from(uniqueProgrammes.values()));
        } else {
          console.error('Failed to extract dropdown options from subjects:', response);
          toast({
            variant: 'destructive',
            title: 'Data Error',
            description: 'Could not extract necessary options from subject data.',
          });
        }
      } catch (error: unknown) {
        console.error('Error fetching dropdown options:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch dropdown options. Please check the console for details.',
        });
      }
    };

    fetchDropdownOptions();
  }, [fetchSubjects, toast]); // Add fetchSubjects to dependencies

  // Filter programmes based on selected degree
  const filteredProgrammes = useMemo(() => {
    if (!selectedDegreeId) return programmeOptions;
    return programmeOptions.filter(programme => programme.degreeId === selectedDegreeId);
  }, [programmeOptions, selectedDegreeId]);

  // Safe access to subjects array with fallback to empty array
  const uniqueSemesters = useMemo(() => {
    if (!subjects || !subjects.length) return [];
    
    const semesters = subjects.map((subject) => subject.semester);
    return [...new Set(semesters)].sort((a, b) => a - b);
  }, [subjects]);

  // Get unique subject types
  const uniqueSubjectTypes = useMemo(() => {
    if (!subjects || !subjects.length) return [];
    
    const types = subjects.map((subject) => subject.subjectType?.marksheetName).filter(Boolean);
    return [...new Set(types)].sort();
  }, [subjects]);

  // Get unique degrees
  const uniqueDegrees = useMemo(() => {
    if (!subjects || !subjects.length) return [];
    
    const degrees = subjects
      .map((subject) => subject.stream?.degree?.name)
      .filter(Boolean);
    
    return [...new Set(degrees)].sort();
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    
    return subjects.filter(subject => {
      // Filter by semester
      if (currentSemester !== 'all' && subject.semester !== parseInt(currentSemester)) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !subject.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !subject.irpCode.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by subject type
      if (subjectType !== 'all' && subject.subjectType?.marksheetName !== subjectType) {
        return false;
      }
      
      // Filter by optional status
      if (isOptionalFilter !== 'all') {
        const isOptional = isOptionalFilter === 'true';
        if (subject.isOptional !== isOptional) {
          return false;
        }
      }
      
      // Filter by degree
      if (degreeFilter !== 'all' && subject.stream?.degree?.name !== degreeFilter) {
        return false;
      }
      
      return true;
    });
  }, [subjects, currentSemester, searchQuery, subjectType, isOptionalFilter, degreeFilter]);

  const resetFilters = () => {
    setCurrentSemester('all');
    setSearchQuery('');
    setSubjectType('all');
    setIsOptionalFilter('all');
    setDegreeFilter('all');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (['credit', 'fullMarks', 'semester'].includes(name)) {
      setNewSubject(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setNewSubject(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (value === '') return;
    
    if (name === 'degreeId') {
      const numValue = parseInt(value);
      setSelectedDegreeId(numValue);
      
      // Reset streamId when degree changes
      setNewSubject(prev => ({
        ...prev,
        streamId: 0
      }));
    } else if (['subjectTypeId', 'streamId', 'semester'].includes(name)) {
      setNewSubject(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setNewSubject(prev => ({
      ...prev,
      isOptional: checked
    }));
  };

  const handleAddSubject = async () => {
    try {
      setIsSubmitting(true);
      
      // Validation checks
      const requiredFields = [
        { field: 'name', label: 'Subject Name' },
        { field: 'irpCode', label: 'Subject Code' },
        { field: 'subjectTypeId', label: 'Subject Type' },
        { field: 'credit', label: 'Credit' },
        { field: 'streamId', label: 'Programme' },
        { field: 'semester', label: 'Semester' },
        { field: 'fullMarks', label: 'Full Marks' }
      ];
      
      const missingFields = requiredFields.filter(
        ({ field }) => !newSubject[field as keyof NewSubject]
      );
      
      if (missingFields.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `Please fill in the following fields: ${missingFields.map(f => f.label).join(', ')}`,
        });
        return;
      }

      console.log('Submitting subject data:', newSubject);
      
      // Submit the new subject to the API
      const response = await axios.post('http://localhost:8080/api/subject-metadatas', newSubject);
      
      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Success',
          description: 'Subject added successfully',
        });
        
        // Refresh the subjects list and close the dialog
        const refreshResponse = await axios.get<ApiResponse>('http://localhost:8080/api/subject-metadatas');
        if (refreshResponse.data && Array.isArray(refreshResponse.data.payload)) {
          setSubjects(refreshResponse.data.payload);
        }
        
        // Reset form and close dialog
        setNewSubject({
          name: '',
          irpCode: '',
          marksheetCode: '',
          subjectTypeId: 0,
          credit: 0,
          fullMarks: 100,
          semester: 1,
          streamId: 0,
          isOptional: false,
        });
        setSelectedDegreeId(0);
        setIsAddDialogOpen(false);
      }
    } catch (error: unknown) {
      console.error('Error adding subject:', error);
      
      let errorMessage = 'Failed to add subject. Please try again.';
      
      // Try to extract more specific error message
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete subject
  const handleDeleteSubject = async (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setSubjectToDelete(subject);
      setIsDeleteDialogOpen(true);
    }
  };

  // Confirm delete subject
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(`http://localhost:8080/api/subject-metadatas/${subjectToDelete.id}`);
      
      if (response.status === 200) {
        toast({
          title: 'Success',
          description: `Subject "${subjectToDelete.name}" deleted successfully`,
        });
        
        // Remove the deleted subject from the state
        setSubjects(prevSubjects => prevSubjects.filter(subject => subject.id !== subjectToDelete.id));
      }
    } catch (error: unknown) {
      console.error('Error deleting subject:', error);
      
      let errorMessage = 'Failed to delete subject. Please try again.';
      
      // Try to extract more specific error message
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSubjectToDelete(null);
    }
  };

  // In a real app, this would come from auth context or a user role check
  useEffect(() => {
    // For example, check user permissions from API or auth context
    // This is a placeholder - in a real app, this would be based on the user's role
    setUserCanDeleteSubjects(true);
  }, []);

  if (error) {
    return (
      <div className="w-full p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => {
            clearError();
            fetchSubjects(); // Use the extracted function
          }}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <Card className="mb-6">
        <CardHeader className="bg-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Subjects List</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={newSubject.name}
                      onChange={handleInputChange}
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="irpCode">Subject Code <span className="text-red-500">*</span></Label>
                    <Input
                      id="irpCode"
                      name="irpCode"
                      value={newSubject.irpCode}
                      onChange={handleInputChange}
                      placeholder="Enter subject code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectTypeId">Subject Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={newSubject.subjectTypeId ? newSubject.subjectTypeId.toString() : ''}
                      onValueChange={(value) => handleSelectChange('subjectTypeId', value)}
                    >
                      <SelectTrigger id="subjectTypeId">
                        <SelectValue placeholder="Select subject type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectTypeOptions.length > 0 ? (
                          subjectTypeOptions.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.marksheetName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled>
                            No subject types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit">Credit <span className="text-red-500">*</span></Label>
                    <Input
                      id="credit"
                      name="credit"
                      type="number"
                      value={newSubject.credit || ''}
                      onChange={handleInputChange}
                      placeholder="Enter credit value"
                      min={0}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">Degree <span className="text-red-500">*</span></Label>
                    <Select
                      value={selectedDegreeId ? selectedDegreeId.toString() : ''}
                      onValueChange={(value) => handleSelectChange('degreeId', value)}
                    >
                      <SelectTrigger id="degreeId">
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {degreeOptions.length > 0 ? (
                          degreeOptions.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id.toString()}>
                              {degree.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled>
                            No degrees available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streamId">Programme <span className="text-red-500">*</span></Label>
                    <Select
                      value={newSubject.streamId ? newSubject.streamId.toString() : ''}
                      onValueChange={(value) => handleSelectChange('streamId', value)}
                      disabled={!selectedDegreeId || filteredProgrammes.length === 0}
                    >
                      <SelectTrigger id="streamId">
                        <SelectValue placeholder={!selectedDegreeId ? "Select a degree first" : 
                          filteredProgrammes.length === 0 ? "No programmes for selected degree" : "Select programme"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProgrammes.length > 0 ? (
                          filteredProgrammes.map((programme) => (
                            <SelectItem key={programme.id} value={programme.id.toString()}>
                              {programme.degreeProgramme}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled>
                            {!selectedDegreeId ? "Select a degree first" : "No programmes available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester <span className="text-red-500">*</span></Label>
                    <Select
                      value={newSubject.semester.toString()}
                      onValueChange={(value) => handleSelectChange('semester', value)}
                    >
                      <SelectTrigger id="semester">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullMarks">Full Marks <span className="text-red-500">*</span></Label>
                    <Input
                      id="fullMarks"
                      name="fullMarks"
                      type="number"
                      value={newSubject.fullMarks || ''}
                      onChange={handleInputChange}
                      placeholder="Enter full marks"
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marksheetCode">Marksheet Code</Label>
                  <Input
                    id="marksheetCode"
                    name="marksheetCode"
                    value={newSubject.marksheetCode}
                    onChange={handleInputChange}
                    placeholder="Enter marksheet code"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isOptional" 
                    checked={newSubject.isOptional}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="isOptional">Optional Subject</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSubject} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Subject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or code..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Select value={currentSemester} onValueChange={setCurrentSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {uniqueSemesters.map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>
                        Semester {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Degree</label>
                <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Degrees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Degrees</SelectItem>
                    {uniqueDegrees.map((degree) => (
                      <SelectItem key={degree} value={degree}>
                        {degree}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Type</label>
                <Select value={subjectType} onValueChange={setSubjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueSubjectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Optional</label>
                <Select value={isOptionalFilter} onValueChange={setIsOptionalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="true">Optional Only</SelectItem>
                    <SelectItem value="false">Required Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters Applied</span>
                {currentSemester !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    Semester {currentSemester}
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                {degreeFilter !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    {degreeFilter}
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                {subjectType !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    {subjectType}
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                {isOptionalFilter !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    {isOptionalFilter === 'true' ? 'Optional' : 'Required'}
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    Search: {searchQuery}
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Badge variant="secondary">
                  Total: {filteredSubjects.length} subjects
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Loading subjects data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    {Array(8).fill(null).map((_, i) => (
                      <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
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
        <Card>
          <CardContent className="p-0">
            <SubjectsTable 
              subjects={filteredSubjects} 
              onDelete={handleDeleteSubject} 
              canDelete={userCanDeleteSubjects}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Subject Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete the following subject?</p>
              {subjectToDelete && (
                <div className="bg-slate-50 p-3 rounded-md border">
                  <p className="font-medium">{subjectToDelete.name}</p>
                  <div className="flex gap-2 mt-1 text-sm text-slate-600">
                    <span>Code: {subjectToDelete.irpCode}</span>
                    <span>•</span>
                    <span>Semester: {subjectToDelete.semester}</span>
                  </div>
                </div>
              )}
              <p className="mt-2 text-red-500">This action cannot be undone and may affect student records that reference this subject.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSubject}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Subject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentSubjectsPage;
