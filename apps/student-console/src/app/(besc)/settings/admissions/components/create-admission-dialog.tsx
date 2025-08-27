import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getCourses } from '../action'
import { Course } from '@/db/schema'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'

type CreateAdmissionDialogProps = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    onCreate: (courseIds: number[], startDate: string, endDate: string) => Promise<void>;
    academicYears: { id: number; year: string }[];
    academicYearId: number | null;
    onAcademicYearChange: (id: number) => void;
}

// Utility functions
function ddmmyyyyToISO(date: string): string {
  const [dd, mm, yyyy] = date.split('/');
  if (!dd || !mm || !yyyy) return '';
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
function isoToDDMMYYYY(date: string): string {
  if (!date) return '';
  const [yyyy, mm, dd] = date.split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}/${mm}/${yyyy}`;
}
function isValidDDMMYYYY(date: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
}
function isNotBeforeToday(date: string): boolean {
  const iso = ddmmyyyyToISO(date);
  if (!iso) return false;
  const today = new Date();
  const d = new Date(iso);
  return d >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

const isBeforeToday = (date: Date | null) => {
  if (!date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

export default function CreateAdmissionDialog({
    open,
    setOpen,
    onCreate,
    academicYears,
    academicYearId,
    onAcademicYearChange
}: CreateAdmissionDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // Fetch available courses when dialog opens
  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const { courses: tmpCourses, totalCount } = (await getCourses()) as {courses: Course[], totalCount: number};
      console.log(tmpCourses);
      // Filter out disabled courses
      const activeCourses = tmpCourses.filter((course: Course) => !course.disabled);
      setCourses(activeCourses);
      // Select all courses by default
      const allCourseIds = activeCourses.map(course => course.id!).filter(id => id !== undefined);
      setSelectedCourses(allCourseIds);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch available courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (courseId: number) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleCreate = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }
    if (!startDate) {
      toast.error('Start date is required');
      return;
    }
    if (isBeforeToday(startDate)) {
      toast.error('Start date cannot be before today');
      return;
    }
    if (!endDate) {
      toast.error('End date is required');
      return;
    }
    if (isBeforeToday(endDate)) {
      toast.error('End date cannot be before today');
      return;
    }
    try {
      setIsCreating(true);
      await onCreate(
        selectedCourses,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setSelectedCourses([]);
      setStartDate(null);
      setEndDate(null);
      setOpen(false);
    } catch (error) {
      console.error('Error creating admission:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setSelectedCourses([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Admission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start Admission Process For</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="year">Admission Year</Label>
            <select
              id="year"
              value={academicYearId || ''}
              onChange={e => onAcademicYearChange(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 bg-transparent"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.year}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="grid gap-2 w-1/2">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                className="w-full border rounded px-3 py-2 bg-transparent"
              />
            </div>
            <div className="grid gap-2 w-1/2">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker
              
                selected={endDate}
                onChange={date => setEndDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                className="w-full border rounded px-3 py-2 bg-transparent"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Select Courses</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading courses...
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courses available
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourses.includes(course.id!)}
                        onCheckedChange={() => handleCourseToggle(course.id!)}
                      />
                      <Label 
                        htmlFor={`course-${course.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{course.name}</div>
                        {course.shortName && (
                          <div className="text-sm text-gray-500">
                            
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`text-sm text-gray-600 ${selectedCourses.length == 0 ? "invisible" : "visible"}`}>
                Selected: {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}
            </div>
            
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isCreating || selectedCourses.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Admission'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
