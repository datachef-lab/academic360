import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  getSubjects,
  getAffiliations,
  getRegulationTypes,
  getCourses,
  getSubjectTypes,
  createPaper,
  updatePaper,
} from '@/services/course-design.api';
import type {
  Subject,
  Affiliation,
  RegulationType,
  Course,
  SubjectType,
  Paper,
} from '@/types/course-design';

const semesters: Record<string, string> = { 1: "Sem I", 2: "Sem II", 3: "Sem III", 4: "Sem IV", 5: "Sem V", 6: "Sem VI", 7: "Sem VII", 8: "Sem VIII" };
const paperComponents = [
  { key: "TH", label: "TH" },
  { key: "PR", label: "PR" },
  { key: "VIVA", label: "VIVA" },
  { key: "PROJECT", label: "Project" },
];

export const SubjectPaperMappingForm = ({ initialData, onSuccess, onCancel }: { initialData?: Paper, onSuccess: () => void, onCancel: () => void }) => {
  // State for dropdowns
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [subjectTypes, setSubjectTypes] = React.useState<SubjectType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      getSubjects(),
      getAffiliations(),
      getRegulationTypes(),
      getCourses(),
      getSubjectTypes(),
    ])
      .then(([
        subjectsRes,
        affiliationsRes,
        regulationTypesRes,
        coursesRes,
        subjectTypesRes,
      ]) => {
        setSubjects(subjectsRes.data);
        setAffiliations(affiliationsRes);
        setRegulationTypes(regulationTypesRes);
        setCourses(coursesRes);
        setSubjectTypes(subjectTypesRes.data);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, []);

  const [subject, setSubject] = React.useState("1");
  const [affiliation, setAffiliation] = React.useState("1");
  const [regulationType, setRegulationType] = React.useState("1");
  const [academicYear, setAcademicYear] = React.useState("1");
  const [multiCourseOpen, setMultiCourseOpen] = React.useState<number | null>(null);
  const [multiSemesterOpen, setMultiSemesterOpen] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<Array<{
    subjectType: string;
    applicableCourses: string[];
    semesters: string[];
    paperName: string;
    paperCode: string;
    isMandatory: boolean;
    components: Record<string, { marks: string; credit: string }>;
  }>>([
    {
      subjectType: "1",
      applicableCourses: [],
      semesters: [],
      paperName: "",
      paperCode: "",
      isMandatory: false,
      components: Object.fromEntries(paperComponents.map(c => [c.key, { marks: "", credit: "" }]))
    }
  ]);

  function handleRowChange(idx: number, field: string, value: string | boolean | string[]) {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  }
  
  function handleComponentChange(idx: number, comp: string, subfield: "marks" | "credit", value: string) {
    setRows(rows => rows.map((row, i) => i === idx ? {
      ...row,
      components: {
        ...row.components,
        [comp]: { ...row.components[comp], [subfield]: value }
      }
    } : row));
  }
  
  function addRow() {
    setRows(rows => [...rows, {
      subjectType: "1",
      applicableCourses: [],
      semesters: [],
      paperName: "",
      paperCode: "",
      isMandatory: false,
      components: Object.fromEntries(paperComponents.map(c => [c.key, { marks: "", credit: "" }]))
    }]);
  }
  
  function removeRow(idx: number) {
    setRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);
  }

  // On submit, call createPaper or updatePaper
  const handleSubmit = async (formData: Paper) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await updatePaper(initialData.id, formData);
      } else {
        await createPaper(formData);
      }
      onSuccess();
    } catch {
      setError('Failed to save paper');
    } finally {
      setLoading(false);
    }
  };

  // Show loading/error UI
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit({} as Paper); }} className="space-y-6 w-full h-full">
      {/* Top row: all dropdowns in a single row */}
      <div className="grid grid-cols-4 gap-4">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id?.toString() || ""}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={affiliation} onValueChange={setAffiliation}>
          <SelectTrigger><SelectValue placeholder="Select affiliation" /></SelectTrigger>
          <SelectContent>
            {affiliations.map((a) => (
              <SelectItem key={a.id} value={a.id?.toString() || ""}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regulationType} onValueChange={setRegulationType}>
          <SelectTrigger><SelectValue placeholder="Select regulation" /></SelectTrigger>
          <SelectContent>
            {regulationTypes.map((r) => (
              <SelectItem key={r.id} value={r.id?.toString() || ""}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">2022-23</SelectItem>
            <SelectItem value="2">2023-24</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Add/Delete buttons */}
      <div className="flex gap-2 my-2">
        <Button type="button" variant="default" onClick={addRow}>Add</Button>
        <Button type="button" variant="outline" onClick={() => removeRow(rows.length - 1)} disabled={rows.length === 1}>Delete</Button>
      </div>
      {/* Responsive Table for mappings */}
      <div className="overflow-x-auto w-full">
        <Table className="border border-gray-300 rounded-md min-w-full w-full text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sr.</TableHead>
              <TableHead>Subject Type</TableHead>
              <TableHead>Applicable Courses</TableHead>
              <TableHead>Semesters</TableHead>
              <TableHead>Paper Name</TableHead>
              <TableHead>Paper Code</TableHead>
              <TableHead>Is Mandatory</TableHead>
              <TableHead>Components</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-center">{idx + 1}</TableCell>
                <TableCell>
                  <Select value={row.subjectType} onValueChange={(value) => handleRowChange(idx, 'subjectType', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id?.toString() || ""}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Popover open={multiCourseOpen === idx} onOpenChange={(open) => setMultiCourseOpen(open ? idx : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        {row.applicableCourses.length > 0 ? `${row.applicableCourses.length} selected` : "Select courses"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={row.applicableCourses.includes(course.id?.toString() || "")}
                              onCheckedChange={(checked) => {
                                const courseId = course.id?.toString() || "";
                                if (checked) {
                                  handleRowChange(idx, 'applicableCourses', [...row.applicableCourses, courseId]);
                                } else {
                                  handleRowChange(idx, 'applicableCourses', row.applicableCourses.filter(id => id !== courseId));
                                }
                              }}
                            />
                            <label htmlFor={`course-${course.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {course.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Popover open={multiSemesterOpen === idx} onOpenChange={(open) => setMultiSemesterOpen(open ? idx : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        {row.semesters.length > 0 ? `${row.semesters.length} selected` : "Select semesters"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        {Object.entries(semesters).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`semester-${key}`}
                              checked={row.semesters.includes(key)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleRowChange(idx, 'semesters', [...row.semesters, key]);
                                } else {
                                  handleRowChange(idx, 'semesters', row.semesters.filter(s => s !== key));
                                }
                              }}
                            />
                            <label htmlFor={`semester-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.paperName}
                    onChange={(e) => handleRowChange(idx, 'paperName', e.target.value)}
                    placeholder="Paper name"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.paperCode}
                    onChange={(e) => handleRowChange(idx, 'paperCode', e.target.value)}
                    placeholder="Paper code"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.isMandatory}
                    onCheckedChange={(checked) => handleRowChange(idx, 'isMandatory', checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {paperComponents.map((comp) => (
                      <div key={comp.key} className="flex items-center space-x-2">
                        <span className="text-xs w-8">{comp.label}:</span>
                        <Input
                          value={row.components[comp.key]?.marks || ""}
                          onChange={(e) => handleComponentChange(idx, comp.key, 'marks', e.target.value)}
                          placeholder="Marks"
                          className="w-16 text-xs"
                        />
                        <Input
                          value={row.components[comp.key]?.credit || ""}
                          onChange={(e) => handleComponentChange(idx, comp.key, 'credit', e.target.value)}
                          placeholder="Credit"
                          className="w-16 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
