import { useState, useEffect } from "react";
import { Course, CourseComponent } from "../../types/gradeCard";
import { calculateGrade, calculateStatus } from "../../utils/gradeUtils";
import { TableCell, TableRow } from "@/components/ui/table";
import EditableCell from "./EditableCell";
import DeleteCourseDialog from "./DeleteCourseDialog";

interface CourseRowProps {
  course: Course;
  onCourseUpdate: (course: Course) => void;
  onCourseDelete: (courseId: string) => void;
}

const CourseRow = ({ course, onCourseUpdate, onCourseDelete }: CourseRowProps) => {
  const [components, setComponents] = useState<CourseComponent[]>(course.components);
  const [isNewCourse, setIsNewCourse] = useState(false);

  useEffect(() => {
    setComponents(course.components);
    setIsNewCourse(course.courseCode === "NEW");
  }, [course]);

  const handleComponentChange = (componentId: string, field: keyof CourseComponent, value: string | number) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return { ...comp, [field]: value };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    
    const updatedCourse = {
      ...course,
      components: updatedComponents
    };
    
    onCourseUpdate(updatedCourse);
  };

  const handleCourseChange = (field: keyof Course, value: string | number) => {
    const updatedCourse = {
      ...course,
      [field]: value
    };
    
    onCourseUpdate(updatedCourse);
  };

  // Calculate totals
  const totalFullMarks = components.reduce((sum, comp) => sum + comp.fullMarks, 0);
  const totalMarksObtained = components.reduce((sum, comp) => sum + comp.marksObtained, 0);
  const totalCredit = components.reduce((sum, comp) => sum + comp.credit, 0);
  
  const percentage = totalFullMarks > 0 ? (totalMarksObtained / totalFullMarks) * 100 : 0;
  const grade = calculateGrade(percentage);
  const status = calculateStatus(percentage);

  return (
    <>
      {components.map((component, index) => (
        <TableRow key={component.id} className={index === 0 ? "border-t" : ""}>
          {index === 0 && (
            <>
              <TableCell rowSpan={components.length + 1} className="border-r align-middle">
                <EditableCell 
                  value={`${course.courseCode} ${course.courseType}`}
                  onChange={(value) => {
                    const parts = String(value).split(" ");
                    const code = parts.shift() || "";
                    const type = parts.join(" ");
                    handleCourseChange("courseCode", code);
                    handleCourseChange("courseType", type);
                  }}
                  className="text-left"
                  disabled={!isNewCourse}
                />
              </TableCell>
              <TableCell rowSpan={components.length + 1} className="border-r align-middle">
                <EditableCell 
                  value={course.courseName}
                  onChange={(value) => handleCourseChange("courseName", value)}
                  className="text-left"
                  disabled={!isNewCourse}
                />
              </TableCell>
            </>
          )}
          <TableCell className="border-r">
            <EditableCell 
              value={course.year}
              onChange={(value) => handleCourseChange("year", value)}
              disabled={!isNewCourse}
            />
          </TableCell>
          <TableCell className="border-r">
            <EditableCell 
              value={component.componentType}
              onChange={(value) => handleComponentChange(component.id, "componentType", value)}
              disabled={!isNewCourse}
            />
          </TableCell>
          <TableCell className="border-r ">
            <EditableCell 
              value={component.fullMarks}
              onChange={(value) => handleComponentChange(component.id, "fullMarks", Number(value))}
              type="number"
              disabled={!isNewCourse}
            />
          </TableCell>
          <TableCell className="border-r">
            <EditableCell 
              value={component.marksObtained}
              onChange={(value) => handleComponentChange(component.id, "marksObtained", Number(value))}
              type="number"
              max={component.fullMarks}
            />
          </TableCell>
          <TableCell className="border-r">
            <EditableCell 
              value={component.credit}
              onChange={(value) => handleComponentChange(component.id, "credit", Number(value))}
              type="number"
              disabled={!isNewCourse}
            />
          </TableCell>
          {index === 0 && (
            <>
              <TableCell rowSpan={components.length + 1} className="border-r align-middle">
                <div className="px-2 py-1">{grade}</div>
              </TableCell>
              <TableCell rowSpan={components.length + 1} className="align-middle">
                <div className="px-2 py-1">{status}</div>
              </TableCell>
              <TableCell rowSpan={components.length + 1} className="align-middle">
                <DeleteCourseDialog 
                  courseName={course.courseName} 
                  onDelete={() => onCourseDelete(course.id)}
                  isNewCourse={isNewCourse}
                />
              </TableCell>
            </>
          )}
        </TableRow>
      ))}

      {/* Total Row */}
      <TableRow className="bg-gray-100 border-b font-semibold">
        <TableCell colSpan={2} className="border-r text-center">Total</TableCell>
        <TableCell className="border-r text-start">
          <div className="px-2 py-1">{totalFullMarks}</div>
        </TableCell>
        <TableCell className="border-r text-start">
          <div className="px-2 py-1">{totalMarksObtained}</div>
        </TableCell>
        <TableCell className="border-r text-start">
          <div className="px-2 py-1">{totalCredit}</div>
        </TableCell>
      </TableRow>
    </>
  );
};

export default CourseRow;
