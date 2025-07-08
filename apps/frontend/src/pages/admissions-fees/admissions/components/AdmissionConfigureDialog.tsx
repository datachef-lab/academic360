import  { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { updateAdmission, fetchAcademicYears, findAdmissionById } from "@/services/admissions.service";
import { Course } from "@/types/academics/course";
import { AcademicYear } from "@/types/academics/academic-year";
import { Admission } from "@/types/admissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

interface AdmissionConfigureDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  admissionId: number;
  allCourses: Course[];
  // admission: Admission;
  refetchData?: () => Promise<void>;
}

export default function AdmissionConfigureDialog({ open = true, setOpen = () => {}, admissionId, allCourses = [], refetchData }: AdmissionConfigureDialogProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [saving, setSaving] = useState(false);
  const focusTrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && focusTrapRef.current) {
      focusTrapRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    findAdmissionById(admissionId).then(data => {
      console.log("fetched admission:", data.payload);
      setAdmission(data.payload);
    });
  }, [admissionId]);

  useEffect(() => {
    fetchAcademicYears().then((data) => {
      setAcademicYears(data.payload);
    });
  }, []);

  // Add course to admission.courses
  const handleAddCourse = (courseId: number) => {
    setAdmission(prev => prev ? {
      ...prev,
      courses: [
        ...(prev.courses || []),
        {
          admissionId: prev.id!,
          courseId,
          disabled: false,
          isClosed: false,
          remarks: '',
        }
      ]
    } : prev);
  };

  // Remove course from admission.courses (only for new ones)
  const handleRemoveCourse = (courseId: number) => {
    setAdmission(prev => prev ? {
      ...prev,
      courses: prev.courses.filter(c => c.courseId !== courseId)
    } : prev);
  };

  // Toggle enabled/disabled
  const handleToggleEnabled = (idx: number) => {
    setAdmission(prev => prev ? {
      ...prev,
      courses: prev.courses.map((c, i) => i === idx ? { ...c, disabled: !c.disabled } : c)
    } : prev);
  };

  // Toggle closed
  const handleToggleClosed = (idx: number) => {
    setAdmission(prev => prev ? {
      ...prev,
      courses: prev.courses.map((c, i) => i === idx ? { ...c, isClosed: !c.isClosed } : c)
    } : prev);
  };

  // Toggle admission isClosed
  const handleToggleAdmissionClosed = () => {
    setAdmission(prev => prev ? { ...prev, isClosed: !prev.isClosed } : prev);
  };

  // Change start date
  const handleStartDateChange = (date: Date | null) => {
    setAdmission(prev => prev ? { ...prev, startDate: date || prev.startDate } : prev);
  };

  // Change end date
  const handleEndDateChange = (date: Date | null) => {
    setAdmission(prev => prev ? { ...prev, lastDate: date || prev.lastDate } : prev);
  };

  const getIsoDate = (value: string | Date | undefined) => {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    // Try to parse string as date
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
    return undefined;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!admission) throw new Error('No admission data');
      const payload: Admission = {
        ...admission,
        startDate: getIsoDate(admission.startDate),
        lastDate: getIsoDate(admission.lastDate)
      };
      console.log('Update Admission Payload:', payload);
      const res = await updateAdmission(admissionId, payload);
      console.log('Update Admission Config:', res)
      setOpen(false);
      if (refetchData) await refetchData();
    } catch (error) {
      alert("Failed to update admission");
      console.error("Error updating admission:", error);
    } finally {
      setSaving(false);
    }
  };

  // Courses not yet mapped
  const mappedCourses = admission?.courses || [];
  const originalCourseIds = admission?.courses?.filter(c => c.id).map(c => c.courseId) || [];
  const unmappedCourses = allCourses.filter(c => !mappedCourses.some(mc => mc.courseId === c.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl overflow-hidden">
        <div ref={focusTrapRef} tabIndex={0} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        <DialogHeader>
          <DialogTitle>Configure Admission</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex justify-between items-center gap-2">
            {admission?.academicYear.id && <div className="grid gap-2 w-1/3">
              <Label>Admission Year</Label>
              <select
                value={admission?.academicYear?.id ?? ''}
                className="w-full border rounded px-3 py-2"
                disabled
              >
                {(academicYears).map((y) => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            </div>}
            <div className="grid gap-2 w-1/3">
              <Label>Start Date</Label>
              <DatePicker
                selected={admission?.startDate ? (admission.startDate instanceof Date ? admission.startDate : new Date(admission.startDate)) : null}
                onChange={handleStartDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                className="w-full border rounded px-3 py-2 bg-transparent"
                customInput={<Input />}
                autoFocus={false}
              />
            </div>
            <div className="grid gap-2 w-1/3">
              <Label>End Date</Label>
              <DatePicker
                selected={admission?.lastDate ? (admission.lastDate instanceof Date ? admission.lastDate : new Date(admission.lastDate)) : null}
                onChange={handleEndDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                className="w-full border rounded px-3 py-2 bg-transparent"
                customInput={<Input />}
                autoFocus={false}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex-1 min-w-[300px]">
              <Label>Mapped Courses ({mappedCourses.length})</Label>
              <div className="border rounded-lg p-3 mt-2 bg-muted min-h-[350px] overflow-auto thin-scrollbar">
                {mappedCourses.length === 0 ? (
                  <div className="text-gray-500 text-xs">No courses mapped</div>
                ) : (
                  mappedCourses.map((item, idx) => (
                    <div
                      key={item.courseId}
                      className="flex items-center gap-2 py-2 border-b last:border-b-0 text-xs"
                    >
                      <div className="flex-1 text-[13px]">{allCourses.find(ele => ele.id === item.courseId)?.name}</div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!item.disabled}
                          onCheckedChange={() => handleToggleEnabled(idx)}
                          className="border-gray-400"
                          id={`enabled-${item.courseId}`}
                        />
                        <label htmlFor={`enabled-${item.courseId}`} className="text-xs select-none cursor-pointer">Enabled</label>
                        <Checkbox
                          checked={item.isClosed}
                          onCheckedChange={() => handleToggleClosed(idx)}
                          className="border-gray-400"
                          id={`closed-${item.courseId}`}
                        />
                        <label htmlFor={`closed-${item.courseId}`} className="text-xs select-none cursor-pointer">Closed</label>
                        {originalCourseIds.indexOf(item.courseId) === -1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCourse(item.courseId)}
                            className="ml-2 p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 min-w-[300px]">
              <Label>Add Courses ({unmappedCourses.length})</Label>
              <div className="border rounded-lg p-3 mt-2 bg-muted max-h-[350px] overflow-auto thin-scrollbar">
                {unmappedCourses.length === 0 ? (
                <div className="text-gray-500 text-[13px]">No more courses to add</div>
                ) : (
                  unmappedCourses.map(course => (
                    course.id !== undefined && (
                      <div key={course.id} className="flex items-center gap-2 py-1 text-xs">
                        <div className="flex-1 text-[13px]">{course.name}</div>
                        <Button size="sm" variant="outline" onClick={() => handleAddCourse(course.id!)}>Add</Button>
                      </div>
                    )
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Admission"}</Button>
          <Button
            variant={admission?.isClosed ? "default" : "destructive"}
            style={admission?.isClosed ? { backgroundColor: "#22c55e", color: "white" } : {}}
            onClick={handleToggleAdmissionClosed}
            disabled={saving}
          >
            {admission?.isClosed ? "Open Admission" : "Close Admission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
