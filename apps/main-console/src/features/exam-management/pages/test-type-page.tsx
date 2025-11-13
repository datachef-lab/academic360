import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, ClipboardList, Edit, Trash2 } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type TestType = {
  id: number;
  shortName: string;
  testName: string;
  description: string;
  carry: boolean;
  isboardexam: boolean;
  passmarks: number;
  fullmarks: number;
  weightage: number;
  evaluationType: string;
  writtenfullmarks: number;
  writtenpassmarks: number;
  oralfullmarks: number;
  oralmarks: number;
  review: boolean;
  formativetest1: number;
  formativetest2: number;
  formativetest3: number;
  formativetest4: number;
  summativeassesment1: number;
  summativeassesment2: number;
  examtypename: string;
};

export default function TestTypePage() {
  const initialData: TestType[] = [
    {
      id: 1,
      shortName: "IA1",
      testName: "Internal Assessment 1",
      description: "First internal assessment for the semester (college)",
      carry: false,
      isboardexam: false,
      passmarks: 12,
      fullmarks: 30,
      weightage: 15,
      evaluationType: "Written",
      writtenfullmarks: 30,
      writtenpassmarks: 12,
      oralfullmarks: 0,
      oralmarks: 0,
      review: false,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Internal",
    },
    {
      id: 2,
      shortName: "IA2",
      testName: "Internal Assessment 2",
      description: "Second internal assessment for the semester (college)",
      carry: false,
      isboardexam: false,
      passmarks: 12,
      fullmarks: 30,
      weightage: 15,
      evaluationType: "Written",
      writtenfullmarks: 30,
      writtenpassmarks: 12,
      oralfullmarks: 0,
      oralmarks: 0,
      review: false,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Internal",
    },
    {
      id: 3,
      shortName: "MID",
      testName: "Mid-Semester Exam",
      description: "Mid-semester department examination",
      carry: true,
      isboardexam: false,
      passmarks: 20,
      fullmarks: 50,
      weightage: 25,
      evaluationType: "Written",
      writtenfullmarks: 50,
      writtenpassmarks: 20,
      oralfullmarks: 0,
      oralmarks: 0,
      review: true,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Mid-Sem",
    },
    {
      id: 4,
      shortName: "END",
      testName: "End-Semester Exam",
      description: "End-semester examination conducted by the college",
      carry: true,
      isboardexam: false,
      passmarks: 40,
      fullmarks: 100,
      weightage: 40,
      evaluationType: "Written",
      writtenfullmarks: 100,
      writtenpassmarks: 40,
      oralfullmarks: 0,
      oralmarks: 0,
      review: true,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 100,
      examtypename: "End-Sem",
    },
    {
      id: 5,
      shortName: "LAB",
      testName: "Laboratory Exam",
      description: "Practical laboratory examination",
      carry: true,
      isboardexam: false,
      passmarks: 10,
      fullmarks: 25,
      weightage: 10,
      evaluationType: "Oral",
      writtenfullmarks: 0,
      writtenpassmarks: 0,
      oralfullmarks: 25,
      oralmarks: 10,
      review: true,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Practical",
    },
    {
      id: 6,
      shortName: "VIVA",
      testName: "Viva Voce",
      description: "Oral exam to assess understanding",
      carry: false,
      isboardexam: false,
      passmarks: 5,
      fullmarks: 15,
      weightage: 5,
      evaluationType: "Oral",
      writtenfullmarks: 0,
      writtenpassmarks: 0,
      oralfullmarks: 15,
      oralmarks: 5,
      review: false,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Departmental",
    },
    {
      id: 7,
      shortName: "ASSGN",
      testName: "Assignment Evaluation",
      description: "Coursework assignment submission and evaluation",
      carry: false,
      isboardexam: false,
      passmarks: 8,
      fullmarks: 20,
      weightage: 5,
      evaluationType: "Written",
      writtenfullmarks: 20,
      writtenpassmarks: 8,
      oralfullmarks: 0,
      oralmarks: 0,
      review: false,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Internal",
    },
    {
      id: 8,
      shortName: "PRJ",
      testName: "Project Evaluation",
      description: "Term project presentation and report evaluation",
      carry: true,
      isboardexam: false,
      passmarks: 15,
      fullmarks: 30,
      weightage: 10,
      evaluationType: "Written+Oral",
      writtenfullmarks: 10,
      writtenpassmarks: 5,
      oralfullmarks: 20,
      oralmarks: 10,
      review: true,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Departmental",
    },
    {
      id: 9,
      shortName: "PRES",
      testName: "Presentation",
      description: "Seminar/technical presentation evaluation",
      carry: false,
      isboardexam: false,
      passmarks: 10,
      fullmarks: 25,
      weightage: 5,
      evaluationType: "Oral",
      writtenfullmarks: 0,
      writtenpassmarks: 0,
      oralfullmarks: 25,
      oralmarks: 10,
      review: true,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Departmental",
    },
    {
      id: 10,
      shortName: "QUIZ",
      testName: "Departmental Quiz",
      description: "Timed quiz conducted by the department",
      carry: false,
      isboardexam: false,
      passmarks: 8,
      fullmarks: 20,
      weightage: 5,
      evaluationType: "Written",
      writtenfullmarks: 20,
      writtenpassmarks: 8,
      oralfullmarks: 0,
      oralmarks: 0,
      review: false,
      formativetest1: 0,
      formativetest2: 0,
      formativetest3: 0,
      formativetest4: 0,
      summativeassesment1: 0,
      summativeassesment2: 0,
      examtypename: "Departmental",
    },
  ];

  const [rows, setRows] = React.useState<TestType[]>(initialData);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<TestType | null>(null);

  const filteredRows = rows.filter((r) =>
    [r.id.toString(), r.shortName, r.testName, r.description, r.evaluationType, r.examtypename]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(searchText.toLowerCase())),
  );

  const handleAddNew = () => {
    setSelectedRow(null);
  };

  const handleEdit = (row: TestType) => {
    setSelectedRow(row);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (form: TestType) => {
    const providedId = Number(form.id);
    if (selectedRow) {
      setRows((prev) => prev.map((r) => (r.id === selectedRow.id ? { ...form, id: providedId } : r)));
    } else {
      const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
      const finalId = providedId && !Number.isNaN(providedId) ? providedId : nextId;
      setRows((prev) => [...prev, { ...form, id: finalId }]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Exam Types
            </CardTitle>
            <div className="text-muted-foreground">A list of all the Test Types.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedRow ? "Edit Test Type" : "Add New Test Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <TestTypeForm
                  initialData={selectedRow ?? undefined}
                  onSubmit={(data) => handleSubmit(data)}
                  onCancel={() => setIsFormOpen(false)}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1400px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 80 }}>ID</TableHead>
                    <TableHead style={{ width: 140 }}>Short Name</TableHead>
                    <TableHead style={{ width: 200 }}>Test Name</TableHead>
                    <TableHead style={{ width: 240 }}>Description</TableHead>
                    <TableHead style={{ width: 120 }}>Carry</TableHead>
                    <TableHead style={{ width: 140 }}>Is Board Exam</TableHead>
                    <TableHead style={{ width: 120 }}>Pass Marks</TableHead>
                    <TableHead style={{ width: 120 }}>Full Marks</TableHead>
                    <TableHead style={{ width: 120 }}>Weightage</TableHead>
                    <TableHead style={{ width: 160 }}>Evaluation Type</TableHead>
                    <TableHead style={{ width: 140 }}>Written FM</TableHead>
                    <TableHead style={{ width: 140 }}>Written PM</TableHead>
                    <TableHead style={{ width: 140 }}>Oral FM</TableHead>
                    <TableHead style={{ width: 140 }}>Oral Marks</TableHead>
                    <TableHead style={{ width: 120 }}>Review</TableHead>
                    <TableHead style={{ width: 160 }}>FT1</TableHead>
                    <TableHead style={{ width: 160 }}>FT2</TableHead>
                    <TableHead style={{ width: 160 }}>FT3</TableHead>
                    <TableHead style={{ width: 160 }}>FT4</TableHead>
                    <TableHead style={{ width: 200 }}>SA1</TableHead>
                    <TableHead style={{ width: 200 }}>SA2</TableHead>
                    <TableHead style={{ width: 200 }}>Exam Type Name</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={23} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 80 }}>{row.id}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.shortName}</TableCell>
                        <TableCell style={{ width: 200 }}>{row.testName}</TableCell>
                        <TableCell style={{ width: 240 }}>{row.description}</TableCell>
                        <TableCell style={{ width: 120 }}>{row.carry ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.isboardexam ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>{row.passmarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{row.fullmarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{row.weightage}</TableCell>
                        <TableCell style={{ width: 160 }}>{row.evaluationType}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.writtenfullmarks}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.writtenpassmarks}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.oralfullmarks}</TableCell>
                        <TableCell style={{ width: 140 }}>{row.oralmarks}</TableCell>
                        <TableCell style={{ width: 120 }}>{row.review ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 160 }}>{row.formativetest1}</TableCell>
                        <TableCell style={{ width: 160 }}>{row.formativetest2}</TableCell>
                        <TableCell style={{ width: 160 }}>{row.formativetest3}</TableCell>
                        <TableCell style={{ width: 160 }}>{row.formativetest4}</TableCell>
                        <TableCell style={{ width: 200 }}>{row.summativeassesment1}</TableCell>
                        <TableCell style={{ width: 200 }}>{row.summativeassesment2}</TableCell>
                        <TableCell style={{ width: 200 }}>{row.examtypename}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(row)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(row.id)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type TestTypeFormProps = {
  initialData?: TestType;
  onSubmit: (data: TestType) => void;
  onCancel: () => void;
};

function TestTypeForm({ initialData, onSubmit, onCancel }: TestTypeFormProps) {
  const [id, setId] = React.useState<number>(initialData?.id ?? 0);
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [testName, setTestName] = React.useState(initialData?.testName ?? "");
  const [description, setDescription] = React.useState(initialData?.description ?? "");
  const [carry, setCarry] = React.useState<boolean>(initialData?.carry ?? false);
  const [isboardexam, setIsBoardExam] = React.useState<boolean>(initialData?.isboardexam ?? false);
  const [passmarks, setPassmarks] = React.useState<number>(initialData?.passmarks ?? 0);
  const [fullmarks, setFullmarks] = React.useState<number>(initialData?.fullmarks ?? 0);
  const [weightage, setWeightage] = React.useState<number>(initialData?.weightage ?? 0);
  const [evaluationType, setEvaluationType] = React.useState(initialData?.evaluationType ?? "");
  const [writtenfullmarks, setWrittenFullmarks] = React.useState<number>(initialData?.writtenfullmarks ?? 0);
  const [writtenpassmarks, setWrittenPassmarks] = React.useState<number>(initialData?.writtenpassmarks ?? 0);
  const [oralfullmarks, setOralFullmarks] = React.useState<number>(initialData?.oralfullmarks ?? 0);
  const [oralmarks, setOralMarks] = React.useState<number>(initialData?.oralmarks ?? 0);
  const [review, setReview] = React.useState<boolean>(initialData?.review ?? false);
  const [formativetest1, setFormativeTest1] = React.useState<number>(initialData?.formativetest1 ?? 0);
  const [formativetest2, setFormativeTest2] = React.useState<number>(initialData?.formativetest2 ?? 0);
  const [formativetest3, setFormativeTest3] = React.useState<number>(initialData?.formativetest3 ?? 0);
  const [formativetest4, setFormativeTest4] = React.useState<number>(initialData?.formativetest4 ?? 0);
  const [summativeassesment1, setSummativeAssessment1] = React.useState<number>(initialData?.summativeassesment1 ?? 0);
  const [summativeassesment2, setSummativeAssessment2] = React.useState<number>(initialData?.summativeassesment2 ?? 0);
  const [examtypename, setExamTypeName] = React.useState(initialData?.examtypename ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-h-[60vh] pr-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tt-id">ID</Label>
          <Input id="tt-id" type="number" value={id} onChange={(e) => setId(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="short-name">Short Name</Label>
          <Input id="short-name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="test-name">Test Name</Label>
          <Input id="test-name" value={testName} onChange={(e) => setTestName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Switch id="carry" checked={carry} onCheckedChange={setCarry} />
          <Label htmlFor="carry">Carry</Label>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="isboardexam" checked={isboardexam} onCheckedChange={setIsBoardExam} />
          <Label htmlFor="isboardexam">Is Board Exam</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="passmarks">Pass Marks</Label>
          <Input
            id="passmarks"
            type="number"
            value={passmarks}
            onChange={(e) => setPassmarks(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullmarks">Full Marks</Label>
          <Input
            id="fullmarks"
            type="number"
            value={fullmarks}
            onChange={(e) => setFullmarks(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weightage">Weightage</Label>
          <Input
            id="weightage"
            type="number"
            value={weightage}
            onChange={(e) => setWeightage(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="evaluation-type">Evaluation Type</Label>
          <Input id="evaluation-type" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="written-fullmarks">Written Full Marks</Label>
          <Input
            id="written-fullmarks"
            type="number"
            value={writtenfullmarks}
            onChange={(e) => setWrittenFullmarks(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="written-passmarks">Written Pass Marks</Label>
          <Input
            id="written-passmarks"
            type="number"
            value={writtenpassmarks}
            onChange={(e) => setWrittenPassmarks(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="oral-fullmarks">Oral Full Marks</Label>
          <Input
            id="oral-fullmarks"
            type="number"
            value={oralfullmarks}
            onChange={(e) => setOralFullmarks(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="oral-marks">Oral Marks</Label>
          <Input
            id="oral-marks"
            type="number"
            value={oralmarks}
            onChange={(e) => setOralMarks(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Switch id="review" checked={review} onCheckedChange={setReview} />
          <Label htmlFor="review">Review</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ft1">Formative Test 1</Label>
          <Input
            id="ft1"
            type="number"
            value={formativetest1}
            onChange={(e) => setFormativeTest1(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ft2">Formative Test 2</Label>
          <Input
            id="ft2"
            type="number"
            value={formativetest2}
            onChange={(e) => setFormativeTest2(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ft3">Formative Test 3</Label>
          <Input
            id="ft3"
            type="number"
            value={formativetest3}
            onChange={(e) => setFormativeTest3(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ft4">Formative Test 4</Label>
          <Input
            id="ft4"
            type="number"
            value={formativetest4}
            onChange={(e) => setFormativeTest4(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sa1">Summative Assessment 1</Label>
          <Input
            id="sa1"
            type="number"
            value={summativeassesment1}
            onChange={(e) => setSummativeAssessment1(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sa2">Summative Assessment 2</Label>
          <Input
            id="sa2"
            type="number"
            value={summativeassesment2}
            onChange={(e) => setSummativeAssessment2(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-type-name">Exam Type Name</Label>
          <Input id="exam-type-name" value={examtypename} onChange={(e) => setExamTypeName(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              id,
              shortName,
              testName,
              description,
              carry,
              isboardexam,
              passmarks,
              fullmarks,
              weightage,
              evaluationType,
              writtenfullmarks,
              writtenpassmarks,
              oralfullmarks,
              oralmarks,
              review,
              formativetest1,
              formativetest2,
              formativetest3,
              formativetest4,
              summativeassesment1,
              summativeassesment2,
              examtypename,
            })
          }
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
