import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { Admission, AdmissionCourse, Course } from "../types";

interface AdmissionConfigureDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetchData: () => Promise<void>;
  admissionId: number;
  allCourses: Course[];
}

async function getAdmission(id: number): Promise<Admission | null> {
  // This is a placeholder. In a real application, you would fetch this from your API.
  console.log(id);
  const admission: Admission = {
    id: 1,
    year: 2025,
    startDate: "2025-07-01",
    lastDate: "2025-08-31",
    isClosed: false,
    courses: [
      {
        id: 1,
        admissionId: 1,
        courseId: 1,
        disabled: false,
        isClosed: false,
        createdAt: null,
        updatedAt: null,
        remarks: null,
      },
      {
        id: 2,
        admissionId: 1,
        courseId: 2,
        disabled: false,
        isClosed: false,
        createdAt: null,
        updatedAt: null,
        remarks: null,
      },
    ],
  };
  return Promise.resolve(admission);
}

export default function AdmissionConfigureDialog({
  open,
  setOpen,
  admissionId,
  refetchData,
  allCourses,
}: AdmissionConfigureDialogProps) {
  const [localAdmission, setLocalAdmission] = useState<Admission | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && admissionId) {
      setLoading(true);
      getAdmission(admissionId)
        .then((data) => {
          setLocalAdmission(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading admission:", error);
          alert("Failed to load admission data");
          setLoading(false);
        });
    }
  }, [admissionId, open]);

  const isBeforeToday = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const availableToAdd = allCourses.filter(
    (c) => !localAdmission?.courses.some((m) => m.courseId === c.id) && !c.disabled,
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!localAdmission?.startDate) {
        alert("Start date is required");
        setSaving(false);
        return;
      }
      if (isBeforeToday(new Date(localAdmission?.startDate))) {
        alert("Start date cannot be before today");
        setSaving(false);
        return;
      }
      if (!localAdmission.lastDate) {
        alert("End date is required");
        setSaving(false);
        return;
      }
      if (isBeforeToday(new Date(localAdmission.lastDate))) {
        alert("End date cannot be before today");
        setSaving(false);
        return;
      }

      // This is a placeholder for the API call.
      console.log("Saving admission:", localAdmission);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Admission and course map updated successfully");
      setOpen(false);
      await refetchData();
    } catch (e) {
      console.error("Error saving admission:", e);
      alert(e instanceof Error ? e.message : "Failed to update admission");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmissionClosed = async () => {
    if (!localAdmission) return;
    const newClosed = !localAdmission.isClosed;
    setLocalAdmission((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isClosed: newClosed,
        courses: prev.courses.map((course) => ({
          ...course,
          isClosed: newClosed,
        })),
      };
    });

    // This is a placeholder for the API call.
    console.log("Toggling admission closed:", newClosed);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert(`Admission ${newClosed ? "closed" : "opened"} successfully`);
    setOpen(false);
    await refetchData();
  };

  const handleCourseToggle = (id: number | undefined, field: "disabled" | "isClosed") => {
    if (!localAdmission || !id) return;
    setLocalAdmission((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        courses: prev.courses.map((item) => (item.id === id ? { ...item, [field]: !item[field] } : item)),
      };
    });
  };

  const handleAddCourse = (course: Course) => {
    if (!localAdmission) return;
    setLocalAdmission((prev) => {
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
            remarks: null,
          } as AdmissionCourse,
        ],
      };
    });
  };

  const handleRemoveNewCourse = (courseId: number) => {
    if (!localAdmission) return;

    setLocalAdmission((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        courses: prev.courses.filter((item) => !(item.id === undefined && item.courseId === courseId)),
      };
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = e.target.value.replace(/[^0-9]/g, "");
    setLocalAdmission((prev) => (prev ? { ...prev, year: parseInt(year) || 0 } : null));
  };

  const handleStartDateChange = (date: Date | null) => {
    setLocalAdmission((prev) =>
      prev
        ? {
            ...prev,
            startDate: date ? format(date, "yyyy-MM-dd") : null,
          }
        : null,
    );
  };

  const handleEndDateChange = (date: Date | null) => {
    setLocalAdmission((prev) =>
      prev
        ? {
            ...prev,
            lastDate: date ? format(date, "yyyy-MM-dd") : null,
          }
        : null,
    );
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
                  <Input
                    type="text"
                    value={localAdmission?.year || ""}
                    onChange={handleYearChange}
                    placeholder="e.g. 2026"
                  />
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
                <div className="flex-1 min-w-[300px]">
                  <Label>Mapped Courses ({localAdmission.courses.length})</Label>
                  <div className="border rounded-lg p-3 mt-2 bg-muted max-h-[350px] overflow-auto thin-scrollbar">
                    {localAdmission?.courses.length === 0 ? (
                      <div className="text-gray-500 text-xs">No courses mapped</div>
                    ) : (
                      localAdmission?.courses.map((item) => (
                        <div
                          key={item.id || item.courseId}
                          className="flex items-center gap-2 py-2 border-b last:border-b-0 text-xs"
                        >
                          <div className="flex-1 text-[13px]">
                            {allCourses.find((ele) => ele.id == item.courseId)?.name}
                          </div>
                          {item.id === undefined ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveNewCourse(item.courseId)}
                            >
                              Remove
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!item.disabled}
                                onChange={() => handleCourseToggle(item.id, "disabled")}
                              />
                              <span className="text-xs">Enabled</span>
                              <input
                                type="checkbox"
                                checked={!!item.isClosed}
                                onChange={() => handleCourseToggle(item.id, "isClosed")}
                              />
                              <span className="text-xs">Closed</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Admission"}
              </Button>
              <Button
                variant={localAdmission.isClosed ? "default" : "destructive"}
                style={localAdmission.isClosed ? { backgroundColor: "#22c55e", color: "white" } : {}}
                onClick={handleToggleAdmissionClosed}
                disabled={saving}
              >
                {localAdmission.isClosed ? "Open Admission" : "Close Admission"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
