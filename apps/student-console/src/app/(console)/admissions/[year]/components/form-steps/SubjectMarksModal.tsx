import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentAcademicSubject, subjectStatus } from "@/db/schema";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SubjectMark {
  subject: string;
  totalMarks: number | '';
  marksObtained: number | '';
  resultStatus: string;
}

// Define a type for Academic Subject for fetching (can be moved to a shared types file)
interface AcademicSubject { id: number; name: string; }

interface SubjectMarksModalProps {
  onSave: (subjects: StudentAcademicSubject[]) => void;
  onClose: () => void;
  academicSubjects: AcademicSubject[]; // Added academicSubjects prop
  initialSubjects: StudentAcademicSubject[]; // Added initialSubjects prop
}

export default function SubjectMarksModal({ onSave, onClose, academicSubjects, initialSubjects }: SubjectMarksModalProps) {
  // Initialize state with initialSubjects prop
  const [subjects, setSubjects] = useState<StudentAcademicSubject[]>(initialSubjects);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  console.log('academicSubjects in SubjectMarksModal:', academicSubjects);

  useEffect(() => {
    // If initialSubjects change (e.g., when editing a saved form), update the modal's state
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    // Scroll to the bottom when subjects array changes (new row added)
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
    }
  }, [subjects]);

  const handleAddRow = () => {
    setSubjects([...subjects, {
      academicSubjectId: 0, // Default or placeholder - needs actual ID
      fullMarks: '',
      totalMarks: '100',
      resultStatus: "PASS", // Default status
      admissionAcademicInfoId: 0, // Placeholder - should be set in parent
      // Add other required fields from StudentAcademicSubjects with default values if necessary
    }]);
  };

  const handleRemoveRow = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  // Update handleInputChange to work with StudentAcademicSubjects type
  const handleInputChange = (index: number, field: keyof StudentAcademicSubject, value: any) => {
    const newSubjects = [...subjects];
    // Basic type checking and conversion for numeric values
    if (field === 'fullMarks' || field === 'totalMarks') {
      // Validate if the value is numeric before updating
      if (!isNaN(Number(value)) || value === '') {
        (newSubjects[index][field] as any) = value.toString(); // Store as string as per schema
      }
    } else if (field === 'academicSubjectId') {
       (newSubjects[index][field] as any) = parseInt(value); // Store as number
    } else if (field === 'resultStatus') {
       (newSubjects[index][field] as any) = value as "PASS" | "FAIL" | "FAIL IN THEORY" | "FAIL IN PRACTICAL"; // Type assertion
    } else {
       (newSubjects[index][field] as any) = value;
    }
    setSubjects(newSubjects);
  };

  const handleSave = () => {
    // Ensure academicSubjectId is set before saving, maybe add validation
    // Ensure admissionAcademicInfoId is set in the parent component before saving the overall form
    onSave(subjects);
    onClose();
  };

  // Helper to find subject name by ID
  const getSubjectName = (id: number) => {
    const subject = (academicSubjects || []).find(sub => sub.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  // Helper to check if all subject rows are valid
  const isAllSubjectsValid = () => {
    // All fields must be filled and no duplicate subjects
    const seenSubjects = new Set();
    for (const subject of subjects) {
      if (!subject.academicSubjectId || subject.academicSubjectId === 0) return false;
      if (!subject.fullMarks || subject.fullMarks === '' || subject.fullMarks === '0') return false;
      if (!subject.totalMarks || subject.totalMarks === '' || subject.totalMarks === '0') return false;
      if (seenSubjects.has(subject.academicSubjectId)) return false;
      seenSubjects.add(subject.academicSubjectId);
    }
    return true;
  };

  return (
    <div className="space-y-4 p-2 sm:p-4 flex flex-col h-full">
      <h3 className="text-lg sm:text-xl font-semibold">Marks Entry</h3>
      <div className="flex flex-col gap-4 flex-grow">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-3 sm:p-4 text-left text-xs sm:text-sm">
          <p className="font-semibold mb-2">Please Note:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Please enter all Subjects Marks as per Class XII Board MarkSheet</li>
            <li>For Example : If you have Five Subjects then Marks of Five Subjects have to be Entered.</li>
            <li>Applicants with theory and practical division of marks, need to add the marks before entering but select the subject result status as per the marksheet only, as applicable.</li>
            <li>Marks entered with "Subject Result Status" as "Fail / Fail in Theory / Fail in Practical" will not be considered for calculation of BO4.</li>
            <li>English Marks must be Entered.</li>
            <li>For students, who have studied more than 1 (One) English subject with 100 marks each, they can select "Additional English" in row no. 2 & give their 2nd English subject marks.</li>
            <li>Please do not Enter SUPW / SUPW & Community Services Marks / Grade.</li>
            <li>In case if you cannot find your subject in the dropdown, please mail us your scanned copy of marksheet at <a href="mailto:admission@thebges.edu.in" className="underline text-blue-600">admission@thebges.edu.in</a></li>
          </ol>
        </div>
        <div className="flex flex-col">
          <div className="overflow-x-auto border rounded-md">
            <div className="min-w-[800px] max-h-[230px] overflow-y-auto" ref={tableBodyRef}>
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Sl</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Subject</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Total Marks</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Marks Obtained</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Status</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Remove</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-7 text-xs sm:text-sm"
                            >
                              {subject.academicSubjectId !== 0
                                ? getSubjectName(subject.academicSubjectId)
                                : "Select Subject"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Search subject..." />
                              <CommandEmpty>No subject found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {(academicSubjects || [])
                                    .filter(sub => !subjects.some((s, i) => i !== index && s.academicSubjectId === sub.id))
                                    .map(sub => (
                                      <CommandItem
                                        key={sub.id}
                                        value={sub.name}
                                        onSelect={() => {
                                          handleInputChange(index, "academicSubjectId", sub.id);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            subject.academicSubjectId === sub.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {sub.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <Input
                          type="text"
                          value={subject.fullMarks}
                          onChange={(e) => handleInputChange(index, 'fullMarks', e.target.value)}
                          className="w-full h-7 text-xs sm:text-sm"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <Input
                          type="text"
                          value={subject.totalMarks}
                          onChange={(e) => handleInputChange(index, 'totalMarks', e.target.value)}
                          className="w-full h-7 text-xs sm:text-sm"
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <Select 
                          value={subject.resultStatus}
                          onValueChange={val => handleInputChange(index, "resultStatus", val)}
                        >
                          <SelectTrigger className="h-7 text-xs sm:text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                          <SelectContent>
                            {subjectStatus.enumValues.map(value => (
                              <SelectItem key={value} value={value} className="text-xs sm:text-sm">{value}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 sm:px-3 py-1 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRemoveRow(index)} 
                          className="h-7 px-2 py-1 flex items-center justify-center"
                          disabled={subjects.length <= 4}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between my-6 items-center">
          <div className="flex justify-center ">
            <Button 
              onClick={handleAddRow} 
              className="w-auto min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-10"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>
      
      <div className="flex justify-end gap-3  ">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="w-auto min-w-[100px] h-10 border-gray-300 hover:bg-gray-50"
        >
          Close
        </Button>
        <Button 
          onClick={handleSave} 
          className="w-auto min-w-[100px] h-10 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!isAllSubjectsValid()}
        >
          Done
        </Button>
      </div>
      </div>
    </div>
  );
} 