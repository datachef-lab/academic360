import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { AdmissionCourse, Course } from '@/db/schema';
import { AdmissionDto } from '@/types/admissions/index';
import { getAdmission } from '../action';

// interface CourseMapItem {
//   id: number | undefined;
//   courseId: number;
//   courseName: string;
//   disabled: boolean;
//   isClosed: boolean;
// }

// interface CourseOption {
//   id: number;
//   name: string;
//   disabled: boolean;
// }


interface AdmissionConfigureDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    refetchData: () => Promise<void>;
    admissionId: number;
    allCourses: Course[];
    allAcademicYears: { id: number; year: string }[];
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

export default function AdmissionConfigureDialog({
    open,
    setOpen,
    admissionId,
    refetchData,
    allCourses,
    allAcademicYears,
}: AdmissionConfigureDialogProps) {
    const [admission, setAdmission] = useState<AdmissionDto | null>(null);
    const [localAdmission, setLocalAdmission] = useState<AdmissionDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [closing, setClosing] = useState(false);
    const [loading, setLoading] = useState(false);
    const mappedCoursesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && admissionId) {
            setLoading(true);
            getAdmission(admissionId).then(data => {
                setAdmission(data);
                setLocalAdmission(data);
                setLoading(false);
            }).catch(error => {
                console.error('Error loading admission:', error);
                toast.error('Failed to load admission data');
                setLoading(false);
            });
        }
    }, [admissionId, open]);

    const parseDate = (val: string | null | undefined): Date | null => {
        if (!val) return null;
        // Try ISO first
        let d = new Date(val);
        if (!isNaN(d.getTime())) return d;
        // Try dd/mm/yyyy
        const match = val.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
        if (match) {
            const dd = match[1];
            const mm = match[2];
            const yyyy = match[3];
            d = new Date(`${yyyy}-${mm}-${dd}`);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };
    // const [startDate, setStartDate] = useState<Date | null>(parseDate(initialStartDate));
    // const [endDate, setEndDate] = useState<Date | null>(parseDate(initialEndDate));
    // const [localCourseMap, setLocalCourseMap] = useState<CourseMapItem[]>(courseMap);

    const today = new Date().toISOString().split('T')[0];

    const isBeforeToday = (date: Date | null) => {
        if (!date) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    // useEffect(() => {
    //     setYear(initialYear.toString());
    //     setStartDate(parseDate(initialStartDate));
    //     setEndDate(parseDate(initialEndDate));
    //     setLocalCourseMap(courseMap);
    // }, [open, initialYear, initialStartDate, initialEndDate, courseMap]);

    // Only show courses that are not mapped and not disabled
    const availableToAdd = allCourses.filter(
        (c) => !localAdmission?.courses.some((m) => m.courseId === c.id) && !c.disabled
    );


    const handleSave = async () => {
        setSaving(true);
        try {
            if (!localAdmission?.startDate) {
                toast.error('Start date is required');
                setSaving(false);
                return;
            }
            if (isBeforeToday(new Date(localAdmission?.startDate))) {
                toast.error('Start date cannot be before today');
                setSaving(false);
                return;
            }
            if (!localAdmission.lastDate) {
                toast.error('End date is required');
                setSaving(false);
                return;
            }
            if (isBeforeToday(new Date(localAdmission.lastDate))) {
                toast.error('End date cannot be before today');
                setSaving(false);
                return;
            }

            // Prepare the data for the API call
            const updateData = {
                id: localAdmission.id,
                academicYearId: localAdmission.academicYearId,
                startDate: localAdmission.startDate,
                endDate: localAdmission.lastDate, // API expects endDate
                isClosed: localAdmission.isClosed,
                courses: localAdmission.courses.map(course => ({
                    courseId: course.courseId,
                    disabled: course.disabled || false,
                    isClosed: course.isClosed || false
                }))
            };

            // Call the API to update the admission
            const response = await fetch('/api/admissions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update admission');
            }

            toast.success('Admission and course map updated successfully');
            setOpen(false);
            await refetchData();
        } catch (e) {
            console.error('Error saving admission:', e);
            toast.error(e instanceof Error ? e.message : 'Failed to update admission');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAdmissionClosed = async () => {
        if (!localAdmission) return;
        const newClosed = !localAdmission.isClosed;
        // Optimistically update UI
        setLocalAdmission(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                isClosed: newClosed,
                courses: prev.courses.map(course => ({
                    ...course,
                    isClosed: newClosed
                }))
            };
        });

        // Prepare data for API
        const updateData = {
            id: localAdmission.id,
            isClosed: newClosed,
            courses: localAdmission.courses.map(course => ({
                courseId: course.courseId,
                disabled: course.disabled || false,
                isClosed: newClosed
            }))
        };

        try {
            const response = await fetch('/api/admissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update admission');
            }
            toast.success(`Admission ${newClosed ? 'closed' : 'opened'} successfully`);
            setOpen(false);
            await refetchData();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update admission');
        }
    };

    const handleCourseToggle = (id: number | undefined, field: 'disabled' | 'isClosed') => {
        if (!localAdmission || !id) return;
        setLocalAdmission(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                courses: prev.courses.map(item =>
                    item.id === id ? { ...item, [field]: !item[field] } : item
                )
            };
        });
    };

    const handleAddCourse = (course: Course) => {
        if (!localAdmission) return;
        setLocalAdmission(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                courses: [
                    ...prev.courses,
                    {
                        id: undefined,
                        admissionId: prev.id!,
                        courseId: course.id,
                        disabled: false,
                        isClosed: false,
                        createdAt: null,
                        updatedAt: null,
                        remarks: null
                    } as AdmissionCourse
                ]
            };
        });
        setTimeout(() => {
            if (mappedCoursesRef.current) {
                mappedCoursesRef.current.scrollTop = mappedCoursesRef.current.scrollHeight;
            }
        }, 100);
    };

    const handleRemoveNewCourse = (courseId: number) => {
        if (!localAdmission) return;
        
        setLocalAdmission(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                courses: prev.courses.filter(item => !(item.id === undefined && item.courseId === courseId))
            };
        });
    };

    const handleStartDateChange = (date: Date | null) => {
        setLocalAdmission(prev => prev ? { 
            ...prev, 
            startDate: date ? format(date, 'yyyy-MM-dd') : null 
        } : null);
    };

    const handleEndDateChange = (date: Date | null) => {
        setLocalAdmission(prev => prev ? { 
            ...prev, 
            lastDate: date ? format(date, 'yyyy-MM-dd') : null 
        } : null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Configure Admission</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                        <div className="text-lg text-gray-700">Loading admission data...</div>
                    </div>
                ) : !localAdmission ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-lg text-red-500">Failed to load admission data</div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 py-2">
                            <div className="flex justify-between items-center gap-2">
                                <div className="grid gap-2 w-1/3">
                                    <Label>Admission Year</Label>
                                    <select
                                        value={localAdmission?.academicYearId || ''}
                                        onChange={e => setLocalAdmission(prev => prev ? { ...prev, academicYearId: Number(e.target.value) } : null)}
                                        className="w-full border rounded px-3 py-2 bg-transparent"
                                    >
                                        <option value="">Select Academic Year</option>
                                        {allAcademicYears.map(year => (
                                            <option key={year.id} value={year.id}>{year.year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2 w-1/3">
                                    
                                    <Label>Start Date</Label>
                                    <DatePicker
                                        selected={localAdmission?.startDate ? new Date(localAdmission.startDate) : null}
                                        onChange={handleStartDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="dd/mm/yyyy"
                                        minDate={new Date()}
                                        className="w-full border rounded px-3 py-2 bg-transparent"
                                    />
                                </div>
                                <div className="grid gap-2 w-1/3">
                                    <Label>End Date</Label>
                                
                                    <DatePicker
                                        selected={localAdmission?.lastDate ? new Date(localAdmission.lastDate) : null}
                                        onChange={handleEndDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="dd/mm/yyyy"
                                        minDate={new Date()}
                                        className="w-full border rounded px-3 py-2 bg-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 mt-4">
                                {/* Mapped Courses */}
                                <div className="flex-1 min-w-[300px]">
                                    <Label>Mapped Courses ({localAdmission.courses.length})</Label>
                                    <div className="border rounded-lg p-3 mt-2 bg-muted max-h-[350px] overflow-auto thin-scrollbar" ref={mappedCoursesRef}>
                                        {localAdmission?.courses.length === 0 ? (
                                            <div className="text-gray-500 text-xs">No courses mapped</div>
                                        ) : (
                                            localAdmission?.courses.map((item) => (
                                                <div key={item.id || item.courseId} className="flex items-center gap-2 py-2 border-b last:border-b-0 text-xs">
                                                    <div className="flex-1 text-[13px]">{allCourses.find(ele => ele.id == item.courseId)?.name}</div>
                                                    {item.id === undefined ? (
                                                        <Button size="sm" variant="destructive" onClick={() => handleRemoveNewCourse(item.courseId)}>
                                                            Remove
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={!item.disabled}
                                                                onCheckedChange={() => handleCourseToggle(item.id, 'disabled')}
                                                                className="border-primary"
                                                            />
                                                            <span className="text-xs">Enabled</span>
                                                            <Checkbox
                                                                checked={!!item.isClosed}
                                                                onCheckedChange={() => handleCourseToggle(item.id, 'isClosed')}
                                                                className="border-primary"
                                                            />
                                                            <span className="text-xs">Closed</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {/* Add Courses */}
                                <div className="flex-1 min-w-[300px]">
                                    <Label>Add Courses ({availableToAdd.length.toString()})</Label>
                                    <div className="border rounded-lg p-3 mt-2 bg-muted max-h-[350px] overflow-auto thin-scrollbar">
                                        {availableToAdd.length === 0 ? (
                                            <div className="text-gray-500 text-[13px]">No more courses to add</div>
                                        ) : (
                                            availableToAdd.map((c) => (
                                                <div key={c.id} className="flex items-center gap-2 py-2 text-xs">
                                                    <span className="flex-1 text-[13px]">{c.name}</span>
                                                    <Button size="sm" variant="secondary" onClick={() => handleAddCourse(c)}>
                                                        Add
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving || closing}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving || closing}>
                                {saving ? 'Saving...' : 'Save Admission'}
                            </Button>
                            <Button
                                variant={localAdmission.isClosed ? 'default' : 'destructive'}
                                style={localAdmission.isClosed ? { backgroundColor: '#22c55e', color: 'white' } : {}}
                                onClick={handleToggleAdmissionClosed}
                                disabled={saving || closing}
                            >
                                {localAdmission.isClosed ? 'Open Admission' : 'Close Admission'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
} 