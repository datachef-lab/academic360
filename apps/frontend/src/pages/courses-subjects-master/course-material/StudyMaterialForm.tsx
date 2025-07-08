import React, { useState, useEffect } from "react";
import { Dialog, DialogContent,  DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { StudyMaterialType, StudyMaterialVariant, StudyMaterialAvailability, StudyMaterial } from "@/types/academics/study-material";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";
import { getAllSubjects } from "@/services/subject-metadata";
import { SubjectMetadata } from "@/types/academics/subject-metadata";
// import studyMaterialImg from "@/assets/study-material.png";

// Mock data for sessions, courses, and batches
const mockSessions = [
  { id: 1, name: "2023-24" },
  { id: 2, name: "2024-25" },
];
const mockCourses = [
  { id: 1, name: "BA" },
  { id: 2, name: "BSc" },
  { id: 3, name: "BCom" },
];
const mockBatches = [
  { id: 1, name: "Batch A", session: "2023-24", course: "BA", semester: "Sem 1" },
  { id: 2, name: "Batch B", session: "2024-25", course: "BSc", semester: "Sem 2" },
  { id: 3, name: "Batch C", session: "2023-24", course: "BCom", semester: "Sem 1" },
];
const mockClasses = [
  { id: 1, name: "Class 1" },
  { id: 2, name: "Class 2" },
  { id: 3, name: "Class 3" },
];

// Simulate batchId param (set to a value to enable BATCH_LEVEL, or null to hide it)
// const batchIdParam = 1; // set to null to hide BATCH_LEVEL

interface StudyMaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<StudyMaterial>) => void;
  initialData?: Partial<StudyMaterial>;
}

const typeOptions: StudyMaterialType[] = ["FILE", "LINK"];
const variantOptions: StudyMaterialVariant[] = ["RESOURCE", "WORKSHEET", "ASSIGNMENT", "PROJECT"];

const StudyMaterialForm: React.FC<StudyMaterialFormProps> = ({ open, onClose, onSave, initialData }) => {
  const params = useParams();
  const availabilityOptions: StudyMaterialAvailability[] = [
    "ALWAYS",
    "CURRENT_SESSION_ONLY",
    "COURSE_LEVEL",
    ...(params.batchId ? ["BATCH_LEVEL" as StudyMaterialAvailability] : []),
  ];
  const [type, setType] = useState<StudyMaterialType>(initialData?.type || "FILE");
  const [variant, setVariant] = useState<StudyMaterialVariant>(initialData?.variant || "RESOURCE");
  const [availability, setAvailability] = useState<StudyMaterialAvailability>(initialData?.availability || "ALWAYS");
  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [file, setFile] = useState<File | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(initialData?.dueDate ? new Date(initialData.dueDate) : undefined);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<SubjectMetadata[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(initialData?.subjectMetadataId || null);

  useEffect(() => {
    // Fetch subjects (replace with real API call if needed)
    getAllSubjects().then(res => {
      if (res && res.payload) setSubjects(res.payload);
    }).catch(() => {
      // fallback to mock data if needed
      setSubjects([
        { id: 1, name: "English" } as SubjectMetadata,
        { id: 2, name: "Mathematics" } as SubjectMetadata,
        { id: 3, name: "Physics" } as SubjectMetadata,
      ]);
    });
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (type === "LINK" && !/^https?:\/\/.+/.test(url)) {
      setError("Valid URL is required for link type");
      return;
    }
    if (type === "FILE" && !file) {
      setError("File is required for file type");
      return;
    }
    setError(null);
    onSave({
      name,
      type,
      variant,
      availability,
      url: type === "LINK" ? url : null,
      filePath: type === "FILE" && file ? file.name : null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      sessionId: availability === "CURRENT_SESSION_ONLY" ? selectedSession : null,
      courseId: availability === "COURSE_LEVEL" ? selectedCourses[0] : null,
      batchId: availability === "BATCH_LEVEL" ? selectedBatches[0] : null,
      subjectMetadataId: selectedSubjectId,
    });
    onClose();
  };

  // Dual-list for courses
  const availableCourses = mockCourses.filter(c => !selectedCourses.includes(c.id));
  const selectedCourseObjs = mockCourses.filter(c => selectedCourses.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] h-[650px] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Image section (hidden on mobile) */}
          <div className="hidden md:flex flex-col justify-center items-center w-1/3 bg-slate-50 h-full">
            <img src={'/study-material.png'} alt="Study Material" className="object-contain h-full w-full rounded-none" />
          </div>
          {/* Form section */}
          <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-6 pb-2 border-b">
              <DialogTitle className="text-xl font-semibold">{initialData ? "Edit Study Material" : "Add Study Material"}</DialogTitle>
              <DialogClose asChild>
                <button className="rounded-full p-2 hover:bg-slate-100 focus:outline-none" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </DialogClose>
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-6">
                {/* Name, Type, Subject, File/URL row */}
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <div className="flex-1 min-w-[150px]">
                    <Label>Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Material name" />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={val => setType(val as StudyMaterialType)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label>Subject</Label>
                    <Select value={selectedSubjectId?.toString() || ""} onValueChange={val => setSelectedSubjectId(Number(val))}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(subj => (
                          <SelectItem key={subj.id} value={subj.id?.toString() || ""}>{subj.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    {type === "LINK" ? (
                      <>
                        <Label>URL</Label>
                        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/resource" />
                      </>
                    ) : (
                      <>
                        <Label>File Upload</Label>
                        <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                        {file && <div className="text-xs text-green-600 mt-1">{file.name}</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Dropdowns row */}
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <div className="flex-1 min-w-[150px]">
                    <Label>Availability</Label>
                    <Select value={availability} onValueChange={val => setAvailability(val as StudyMaterialAvailability)}>
                      <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                      <SelectContent>
                        {availabilityOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label>Variant</Label>
                    <Select value={variant} onValueChange={val => setVariant(val as StudyMaterialVariant)}>
                      <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                      <SelectContent>
                        {variantOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label>Due Date</Label>
                    <DatePicker value={dueDate} onSelect={setDueDate} />
                  </div>
                </div>

                {/* Conditional fields based on availability */}
                {availability === "CURRENT_SESSION_ONLY" && (
                  <div>
                    <Label>Session</Label>
                    <Select value={selectedSession?.toString() || ""} onValueChange={val => setSelectedSession(Number(val))}>
                      <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                      <SelectContent>
                        {mockSessions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {availability === "COURSE_LEVEL" && (
                  <>
                    <div className="flex flex-col md:flex-row gap-4 min-h-[180px] h-[260px]">
                      {/* Selected Courses (left) */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <Label>Selected Courses</Label>
                        <div className="border rounded-lg p-2 flex-1 min-h-0 h-full bg-slate-50 overflow-y-auto">
                          {selectedCourseObjs.map(c => (
                            <div key={c.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-100 rounded cursor-pointer">
                              <span>{c.name}</span>
                              <Button size="sm" variant="destructive" onClick={() => setSelectedCourses(selectedCourses.filter(id => id !== c.id))}>Remove</Button>
                            </div>
                          ))}
                          {selectedCourseObjs.length === 0 && <span className="text-xs text-muted-foreground">No courses selected</span>}
                        </div>
                      </div>
                      {/* Add/Remove Buttons (center) */}
                      <div className="flex flex-col justify-center items-center gap-2 pt-8">
                        <Button size="icon" variant="outline" disabled>
                          &lt;
                        </Button>
                        <Button size="icon" variant="outline" disabled>
                          &gt;
                        </Button>
                      </div>
                      {/* Available Courses (right) */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <Label>Available Courses</Label>
                        <div className="border rounded-lg p-2 flex-1 min-h-0 h-full bg-slate-50 overflow-y-auto">
                          {availableCourses.map(c => (
                            <div key={c.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-100 rounded cursor-pointer" onClick={() => setSelectedCourses([...selectedCourses, c.id])}>
                              <span>{c.name}</span>
                              <Button size="sm" variant="outline">Add</Button>
                            </div>
                          ))}
                          {availableCourses.length === 0 && <span className="text-xs text-muted-foreground">No more courses</span>}
                        </div>
                      </div>
                    </div>
                    {/* Class dropdown */}
                    <div className="mt-4 w-full max-w-xs">
                      <Label>Class</Label>
                      <Select value={selectedClass?.toString() || ""} onValueChange={val => setSelectedClass(Number(val))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {mockClasses.map(opt => (
                            <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {availability === "BATCH_LEVEL" && (
                  <div className="flex flex-col md:flex-row gap-4 min-h-[180px] h-[260px]">
                    {/* Selected Batches (left) */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <Label>Selected Batches</Label>
                      <div className="border rounded-lg p-2 flex-1 min-h-0 h-full bg-slate-50 overflow-y-auto">
                        {mockBatches.filter(b => selectedBatches.includes(b.id)).map(b => (
                          <div key={b.id} className="flex flex-col gap-1 py-2 px-2 mb-2 bg-white rounded shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Batch #{b.id} - {b.name}</span>
                              <Button size="sm" variant="destructive" onClick={() => setSelectedBatches(selectedBatches.filter(id => id !== b.id))}>Remove</Button>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-4 pl-1">
                              <span>Session: {b.session}</span>
                              <span>Course: {b.course}</span>
                              <span>Semester: {b.semester}</span>
                            </div>
                          </div>
                        ))}
                        {mockBatches.filter(b => selectedBatches.includes(b.id)).length === 0 && <span className="text-xs text-muted-foreground">No batches selected</span>}
                      </div>
                    </div>
                    {/* Add/Remove Buttons (center) */}
                    <div className="flex flex-col justify-center items-center gap-2 pt-8">
                      <Button size="icon" variant="outline" disabled>
                        &lt;
                      </Button>
                      <Button size="icon" variant="outline" disabled>
                        &gt;
                      </Button>
                    </div>
                    {/* Available Batches (right) */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <Label>Available Batches</Label>
                      <div className="border rounded-lg p-2 flex-1 min-h-0 h-full bg-slate-50 overflow-y-auto">
                        {mockBatches.filter(b => !selectedBatches.includes(b.id)).map(b => (
                          <div key={b.id} className="flex flex-col gap-1 py-2 px-2 mb-2 bg-white rounded shadow-sm border border-slate-100 cursor-pointer" onClick={() => setSelectedBatches([...selectedBatches, b.id])}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Batch #{b.id} - {b.name}</span>
                              <Button size="sm" variant="outline">Add</Button>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-4 pl-1">
                              <span>Session: {b.session}</span>
                              <span>Course: {b.course}</span>
                              <span>Semester: {b.semester}</span>
                            </div>
                          </div>
                        ))}
                        {mockBatches.filter(b => !selectedBatches.includes(b.id)).length === 0 && <span className="text-xs text-muted-foreground">No more batches</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <DialogFooter className="px-8 pb-6 pt-2 border-t flex justify-end">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} type="button">Save</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudyMaterialForm; 