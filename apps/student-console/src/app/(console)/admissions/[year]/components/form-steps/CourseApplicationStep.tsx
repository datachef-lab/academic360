import { useState, useEffect } from "react";
import { AdmissionCourse, AdmissionCourseApplication, ApplicationForm, Course } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode } from 'react';
import { getAdmissionCourses, getCourses } from "../../action";
import { toast } from "@/components/ui/use-toast";
import { useApplicationForm } from "@/hooks/use-application-form";

interface CourseApplicationStepProps {
  stepNotes: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
  currentStep: number;
}

interface CourseWithSelection extends Course {
  selected: boolean;
  
}

export default function CourseApplicationStep({
  stepNotes,
  onNext,
  onPrev,
  currentStep
}: CourseApplicationStepProps) {
  const {applicationForm} = useApplicationForm();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [admissionCourses, setAdmissionCourses] = useState<AdmissionCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<AdmissionCourseApplication[]>(applicationForm?.courseApplication ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    getCourses()
      .then(data => {
        setAllCourses(data);
      });
  }, []);

  useEffect(() => {
    if (applicationForm?.admissionId) {
      getAdmissionCourses(applicationForm.admissionId)
        .then(data => {
          setAdmissionCourses(data);
        });
    }
  }, [allCourses, applicationForm?.admissionId]);

  useEffect(() => {
    if (allCourses.length > 0 && admissionCourses.length > 0) {
      const tmpCourses = allCourses.filter(ele => admissionCourses.find(admCourse => admCourse.courseId === ele.id));
      setAvailableCourses(tmpCourses);
    }
  }, [allCourses, admissionCourses]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (selectedCourses.length === 0) {
      errors.courses = "Please select at least one course";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
        // onClose: () => {},
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        form: {
          admissionId: applicationForm!.admissionId,
          formStatus: applicationForm!.formStatus,
          ...(selectedCourses.length > 0 && applicationForm && 'currentStep' in applicationForm && 'admissionStep' in applicationForm
            ? { currentStep: (applicationForm as any).currentStep, admissionStep: (applicationForm as any).admissionStep }
            : { currentStep: 3, admissionStep: "ADDITIONAL_INFORMATION" })
        },
        courseApplications: selectedCourses.map(sc => ({
          applicationFormId: sc.applicationFormId,
          admissionCourseId: sc.admissionCourseId
        }))
      };

      const response = await fetch(`/api/admissions/application-forms?id=${applicationForm!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save form");
      }

      // Insert selected courses
      await Promise.all(
        selectedCourses.map(sc =>
          fetch('/api/admissions/course-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sc),
          })
        )
      );

      toast({
        title: "Success",
        description: "Form saved successfully",
        // onClose: () => {},
      });

      onNext();
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form",
        variant: "destructive",
        // onClose: () => {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onPrev();
    }
  };

  const totalAmount = selectedCourses.reduce((sum, sc) => {
    const admissionCourse = admissionCourses.find(ac => ac.id === sc.admissionCourseId);
    const course = allCourses.find(c => c.id === admissionCourse?.courseId);
    return sum + (course ? Number(course.amount) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Step 3 of 5 - Course Application</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-4 text-left">
          {stepNotes}
        </div>
      </div>

      {/* Course Selection */}
      <div className="space-y-4">
        {/* <h3 className="text-lg font-semibold">Select Your Courses</h3> */}
        <div className="overflow-x-auto w-full max-h-[350px] border rounded bg-white">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Select</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8/12">Course</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-3/12">Amount</th>
              </tr>
            </thead>
            <tbody>
              {availableCourses?.map((course) => {
                const admissionCourse = admissionCourses.find(ac => ac.courseId === course.id);
                const selected = selectedCourses.find(sc => sc.admissionCourseId === admissionCourse?.id);
                return (
                  <tr
                    key={course.id}
                    className={`hover:bg-purple-200 transition border-b last:border-b-0 ${selected ? 'bg-purple-200' : ''}`}
                    onClick={() => {
                      if (!admissionCourse) return;
                      if (selected) {
                        setSelectedCourses(selectedCourses.filter(sc => sc.admissionCourseId !== admissionCourse.id));
                      } else {
                        setSelectedCourses([
                          ...selectedCourses,
                          { admissionCourseId: admissionCourse.id as number, applicationFormId: applicationForm!.id! }
                        ]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-4 py-2 align-middle text-center">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={!!selected}
                        onCheckedChange={(checked) => {
                          if (!admissionCourse) return;
                          if (checked) {
                            setSelectedCourses([
                              ...selectedCourses,
                              { id: 0, admissionCourseId: admissionCourse.id as number, applicationFormId: applicationForm!.id! }
                            ]);
                          } else {
                            setSelectedCourses(selectedCourses.filter(sc => sc.admissionCourseId !== admissionCourse.id));
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        className="mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle whitespace-nowrap truncate max-w-xs">
                      <span className="block font-medium text-gray-800">{course.name}</span>
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <span className="block font-medium text-gray-800">₹ {course.amount}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Total Amount below the table */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-lg font-semibold bg-blue-50 border border-blue-200 rounded px-8 py-3 shadow-sm">
            Total Courses Selected: {selectedCourses.length}
          </div>
          <div className="text-lg font-semibold bg-blue-50 border border-blue-200 rounded px-8 py-3 w-[230.25px] shadow-sm">
            Total Amount: <span className="text-blue-700">₹ {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={isSubmitting || selectedCourses.length === 0}
        >
          {isSubmitting ? "Saving..." : "Save & Continue"}
        </Button>
      </div>

      {/* Display validation errors */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside text-red-700">
            {Object.entries(formErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
