import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { Course } from '@/types/course-design';
import DatePicker from "react-datepicker";
// import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { fetchAcademicYears, fetchAdmissionSummaries } from "@/services/admissions.service";
import { getAllCourses } from '@/services/course-api';
import { AcademicYear } from "@/types/academics/academic-year";
import { Admission } from "@/types/admissions";

type CreateAdmissionDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCreate: (admission: Admission) => Promise<void>;
};

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
}: CreateAdmissionDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAdmission, setNewAdmission] = useState<{
    academicYear: AcademicYear | null;
    startDate: Date | null;
    lastDate: Date | null;
  }>({
    academicYear: null,
    startDate: null,
    lastDate: null,
  });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);

  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchAcademicYears().then((data) => {
        setAcademicYears(Array.isArray(data) ? data : data?.payload ?? []);
      });
      fetchAdmissionSummaries().then(setAdmissions);
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await getAllCourses();
      const tmpCourses: Course[] = res.payload || [];
      setCourses(tmpCourses);
      const allCourseIds = tmpCourses.map((course) => course.id!).filter((id) => id !== undefined);
      setSelectedCourses(allCourseIds);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Failed to fetch available courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const handleCreate = async () => {
    if (selectedCourses.length === 0) {
      alert("Please select at least one course");
      return;
    }
    if (!newAdmission.startDate) {
      alert("Start date is required");
      return;
    }
    if (isBeforeToday(newAdmission.startDate)) {
      alert("Start date cannot be before today");
      return;
    }
    if (!newAdmission.lastDate) {
      alert("End date is required");
      return;
    }
    if (isBeforeToday(newAdmission.lastDate)) {
      alert("End date cannot be before today");
      return;
    }
    if (!newAdmission.academicYear) {
      alert("Please select an academic year");
      return;
    }
    try {
      setIsCreating(true);
      const admissionData: Admission = {
        academicYear: newAdmission.academicYear,
        startDate: newAdmission.startDate.toISOString(),
        lastDate: newAdmission.lastDate.toISOString(),
        courses: selectedCourses.map(courseId => ({
          admissionId: 0,
          courseId,
          disabled: false,
          isClosed: false,
          remarks: null,
        })),
      };
      await onCreate(admissionData);
      setSelectedCourses([]);
      setNewAdmission({
        academicYear: null,
        startDate: null,
        lastDate: null,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating admission:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setSelectedCourses([]);
    setNewAdmission({
      academicYear: null,
      startDate: null,
      lastDate: null,
    });
    setOpen(false);
  };

  const usedAcademicYearIds = new Set((admissions ?? []).map(a => a.academicYear?.id).filter(id => id !== undefined));
  const availableAcademicYears = (academicYears ?? []).filter(y => !usedAcademicYearIds.has(y.id!));

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
              value={newAdmission.academicYear?.id ?? ""}
              onChange={e => setNewAdmission(prev => ({
                ...prev,
                academicYear: Number(e.target.value) ? academicYears.find(y => y.id === Number(e.target.value)) || null : null
              }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Academic Year</option>
              {(availableAcademicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="grid gap-2 w-1/2">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker
                selected={newAdmission.startDate}
                onChange={(date) => setNewAdmission(prev => ({
                  ...prev,
                  startDate: date
                }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                className="w-full border rounded px-3 py-2 bg-transparent"
              />
            </div>
            <div className="grid gap-2 w-1/2">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker
                selected={newAdmission.lastDate}
                onChange={(date) => setNewAdmission(prev => ({
                  ...prev,
                  lastDate: date
                }))}
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
                <div className="text-center py-8 text-gray-500">No courses available</div>
              ) : (
                <div className="space-y-3">
                  {(courses ?? []).map((course) => (
                    <div key={course.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourses.includes(course.id!)}
                        onCheckedChange={() => handleCourseToggle(course.id!)}
                      />
                      <Label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{course.name}</div>
                        {course.shortName && <div className="text-sm text-gray-500"></div>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`text-sm text-gray-600 ${selectedCourses.length == 0 ? "invisible" : "visible"}`}>
              Selected: {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || selectedCourses.length === 0}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Admission"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
