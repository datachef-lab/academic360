import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, User, FileText, Calendar, GraduationCap, BookOpen, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Student, mockStudents } from "../data/mock-students";

const todayDateISO = () => new Date().toISOString().slice(0, 10);

const todayDateDDMMYYYY = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const getSemesterOptionsForSession = (session: string) => {
  if (session === "2025-26") return ["I", "II"];
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
};

type SemSelection = {
  sem: number;
  session: string;
  selectedSemester: string;
  admitCard: boolean;
  marksheet: boolean;
  admitDate: string;
  marksheetDate: string;
};

const DocumentIssuanceStudentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const studentData: Student | undefined = mockStudents.find((s) => s.id === Number(id));
  const student = (studentData ?? mockStudents[0])!;
  const isUnknownStudent = !studentData;

  const [semSelections, setSemSelections] = useState<SemSelection[]>([
    {
      sem: 1,
      session: "2025-26",
      selectedSemester: "I",
      admitCard: false,
      marksheet: false,
      admitDate: "",
      marksheetDate: "",
    },
    {
      sem: 2,
      session: "2025-26",
      selectedSemester: "II",
      admitCard: false,
      marksheet: false,
      admitDate: "",
      marksheetDate: "",
    },
  ]);
  const [casualRows, setCasualRows] = useState<
    Array<{
      id: string;
      semester: string;
      session: string;
      admitCard: boolean;
      marksheet: boolean;
      admitDate: string;
      marksheetDate: string;
    }>
  >([]);
  const [otherDocs, setOtherDocs] = useState({
    registration: { issued: false, remarks: "", date: "", feesExemption: false },
    tc: { issued: false, remarks: "", date: "", feesExemption: false },
    bonafide: { issued: false, remarks: "", date: "", feesExemption: false },
    character: { issued: false, remarks: "", date: "", feesExemption: false },
    migration: { issued: false, remarks: "", date: "", feesExemption: false },
  });

  const toggleDocument = (index: number, field: "admitCard" | "marksheet") => {
    setSemSelections((prev) =>
      prev.map((sem, idx) => {
        if (idx !== index) return sem;
        if (field === "admitCard") {
          const toggled = !sem.admitCard;
          return {
            ...sem,
            admitCard: toggled,
            admitDate: toggled ? todayDateISO() : "",
          };
        }
        const toggled = !sem.marksheet;
        return {
          ...sem,
          marksheet: toggled,
          marksheetDate: toggled ? todayDateISO() : "",
        };
      }),
    );
  };

  const changeSession = (index: number, value: string) => {
    const options = getSemesterOptionsForSession(value);
    setSemSelections((prev) =>
      prev.map((sem, idx) => (idx === index ? { ...sem, session: value, selectedSemester: options[0] ?? "" } : sem)),
    );
  };

  const changeSelectedSemester = (index: number, value: string) => {
    setSemSelections((prev) => prev.map((sem, idx) => (idx === index ? { ...sem, selectedSemester: value } : sem)));
  };

  const addCasualRow = () => {
    if (casualRows.length >= 10) {
      toast.error("Maximum 10 casual entries allowed");
      return;
    }
    setCasualRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        semester: "",
        session: "",
        admitCard: false,
        marksheet: false,
        admitDate: "",
        marksheetDate: "",
      },
    ]);
  };

  const updateCasualRow = (rowId: string, field: string, value: string | boolean) => {
    setCasualRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const nextRow = { ...row, [field]: value };

        const hasAdmit = nextRow.admitCard === true;
        const hasMarksheet = nextRow.marksheet === true;
        const hasDoc = hasAdmit || hasMarksheet;

        if (nextRow.semester && nextRow.session && hasDoc) {
          if (!nextRow.admitDate && hasAdmit) nextRow.admitDate = todayDateISO();
          if (!nextRow.marksheetDate && hasMarksheet) nextRow.marksheetDate = todayDateISO();
        }

        if (field === "admitCard" && !value) nextRow.admitDate = "";
        if (field === "marksheet" && !value) nextRow.marksheetDate = "";

        return nextRow;
      }),
    );
  };

  const removeCasualRow = (rowId: string) => {
    setCasualRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSave = () => {
    toast.success("Documents saved successfully!");
  };

  const toggleFeesExemption = (key: string) => {
    setOtherDocs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        feesExemption: !prev[key as keyof typeof prev].feesExemption,
      },
    }));
  };

  const applyChallan = () => toast.info("Challan application initiated");
  const generateTC = () => toast.info("TC generation initiated");
  const updateFees = () => toast.info("Fees update initiated");

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/document-issuance")}
          className="mb-6 hover:bg-purple-100 text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        {isUnknownStudent && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Requested student was not found; showing fallback record for preview only.
          </div>
        )}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden drop-shadow-md mb-8">
          <div className="bg-gradient-to-r from-purple-500  to-purple-600 h-32 relative">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {student.status}
              </span>
              <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                UID: {student.uid}
              </span>
            </div>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col items-start -mt-16 mb-6 relative z-20">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex-shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt="student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">UID</p>
                  <p className="text-lg font-bold text-gray-900">{student.uid}</p>
                </div>
              </div>
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Registration No.</p>
                  <p className="text-lg font-bold text-gray-900">{student.reg}</p>
                </div>
              </div>
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">D.O.B</p>
                  <p className="text-lg font-bold text-gray-900">{student.dob}</p>
                </div>
              </div>
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Semester</p>
                  <p className="text-lg font-bold text-gray-900">{student.semester}</p>
                </div>
              </div>
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Session</p>
                  <p className="text-lg font-bold text-gray-900">{student.session}</p>
                </div>
              </div>
              <div className="bg-purple-50  rounded-xl drop-shadow-md p-4 flex items-center gap-4">
                <div className="w-12 h-12 drop-shadow-sm bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">CU Roll No.</p>
                  <p className="text-lg font-bold text-gray-900">{student.roll}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="">
          <Tabs defaultValue="admit" className="w-full drop-shadow-sm">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-2 bg-purple-100/90 rounded-lg p-1  ">
              <TabsTrigger
                value="admit"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 rounded-md"
              >
                Admit Card / Marksheet
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 rounded-md"
              >
                Other Documents
              </TabsTrigger>
            </TabsList>
            <TabsContent value="admit" className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900 text-lg">Academic Documents</h3>

                <div className="grid grid-cols-12 gap-4 mb-3 px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="col-span-3 text-sm font-semibold text-gray-700">Academic Session</div>
                  <div className="col-span-3 text-sm font-semibold text-gray-700">Semester</div>
                  <div className="col-span-6 text-sm font-semibold text-gray-700">Documents</div>
                </div>

                <div className="space-y-3">
                  {semSelections.map((sem, index) => (
                    <div
                      key={sem.sem}
                      className="grid grid-cols-12 gap-4 p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="col-span-3">
                        <select
                          value={sem.session}
                          onChange={(e) => changeSession(index, e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="2025-26">2025-26</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2023-24">2023-24</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <select
                          value={sem.selectedSemester}
                          onChange={(e) => changeSelectedSemester(index, e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        >
                          {getSemesterOptionsForSession(sem.session).map((opt) => (
                            <option key={opt} value={opt}>
                              Semester {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`admit-${index}`}
                            checked={sem.admitCard}
                            onCheckedChange={() => toggleDocument(index, "admitCard")}
                            className="border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <label htmlFor={`admit-${index}`} className="text-sm cursor-pointer text-gray-900">
                            Admit Card
                          </label>
                        </div>
                        {sem.admitDate && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Issued: {sem.admitDate}
                          </span>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`marksheet-${index}`}
                            checked={sem.marksheet}
                            onCheckedChange={() => toggleDocument(index, "marksheet")}
                            className="border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <label htmlFor={`marksheet-${index}`} className="text-sm cursor-pointer text-gray-900">
                            Marksheet
                          </label>
                        </div>
                        {sem.marksheetDate && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Issued: {sem.marksheetDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {casualRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-12 gap-4 p-4 bg-white rounded-lg border border-dashed border-violet-600"
                    >
                      <div className="col-span-3">
                        <select
                          value={row.session}
                          onChange={(e) => updateCasualRow(row.id, "session", e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="">Select Session</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2023-24">2023-24</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <select
                          value={row.semester}
                          onChange={(e) => updateCasualRow(row.id, "semester", e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="">Select Semester</option>
                          {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((semOption) => (
                            <option key={semOption} value={semOption}>
                              Semester {semOption}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`casual-admit-${row.id}`}
                            checked={row.admitCard}
                            onCheckedChange={(checked) => updateCasualRow(row.id, "admitCard", checked as boolean)}
                            className="border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <label htmlFor={`casual-admit-${row.id}`} className="text-sm cursor-pointer text-gray-900">
                            Admit Card
                          </label>
                        </div>
                        {row.admitDate && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.admitDate}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`casual-marksheet-${row.id}`}
                            checked={row.marksheet}
                            onCheckedChange={(checked) => updateCasualRow(row.id, "marksheet", checked as boolean)}
                            className="border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <label
                            htmlFor={`casual-marksheet-${row.id}`}
                            className="text-sm cursor-pointer text-gray-900"
                          >
                            Marksheet
                          </label>
                        </div>
                        {row.marksheetDate && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {row.marksheetDate}
                          </span>
                        )}
                        <Button
                          onClick={() => removeCasualRow(row.id)}
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={addCasualRow}
                      variant="outline"
                      size="sm"
                      className="border-violet-600 text-violet-600 hover:bg-violet-50"
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900 text-lg">Other Documents</h3>
                <div className="space-y-3">
                  {Object.entries(otherDocs).map(([key, doc]) => {
                    const docLabels: Record<string, string> = {
                      registration: "Registration Certificate",
                      tc: "Transfer Certificate (TC)",
                      bonafide: "Bonafide Certificate",
                      character: "Character Certificate",
                      migration: "Migration Certificate",
                    };

                    return (
                      <div key={key} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-3 min-w-[220px]">
                            <Checkbox
                              id={key}
                              checked={doc.issued}
                              onCheckedChange={(checked) => {
                                setOtherDocs((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key as keyof typeof prev],
                                    issued: checked as boolean,
                                    date: checked ? todayDateDDMMYYYY() : "",
                                  },
                                }));
                              }}
                              className="border-violet-600 data-[state=checked]:bg-violet-600"
                            />
                            <label htmlFor={key} className="text-sm font-semibold cursor-pointer text-gray-900">
                              {docLabels[key]}
                            </label>
                          </div>

                          {key === "tc" && (
                            <div className="flex gap-2">
                              <Button onClick={applyChallan} size="sm" variant="outline" className="text-xs">
                                Apply Challan
                              </Button>
                              <Button onClick={generateTC} size="sm" variant="outline" className="text-xs">
                                Generate TC
                              </Button>
                              <Button onClick={updateFees} size="sm" variant="outline" className="text-xs">
                                Update Fees
                              </Button>
                            </div>
                          )}

                          {doc.date && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              Issued: {doc.date}
                            </span>
                          )}

                          {key === "tc" && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${key}-fees`}
                                checked={doc.feesExemption}
                                onCheckedChange={() => toggleFeesExemption(key)}
                                className="border-violet-600 data-[state=checked]:bg-violet-600"
                              />
                              <label htmlFor={`${key}-fees`} className="text-xs cursor-pointer text-gray-900">
                                Fees Exemption
                              </label>
                            </div>
                          )}

                          <Input
                            placeholder="Add remarks..."
                            value={doc.remarks}
                            onChange={(e) =>
                              setOtherDocs((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key as keyof typeof prev],
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="flex-1 min-w-[200px] border-gray-300 focus:border-violet-500 focus:ring-violet-500 text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/document-issuance")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white px-8">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentIssuanceStudentPage;
