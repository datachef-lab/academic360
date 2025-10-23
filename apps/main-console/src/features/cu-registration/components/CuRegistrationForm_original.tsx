import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStudentCuCorrectionRequests } from "@/services/cu-registration";
import { getCuRegistrationDocuments, getCuRegistrationDocumentSignedUrl } from "@/services/cu-registration-documents";
import { fetchUserProfile } from "@/services/student";
import { fetchStudentSubjectSelections, fetchMandatorySubjects } from "@/services/subject-selection";
import type { CuRegistrationCorrectionRequestDto } from "@repo/db/dtos/admissions";
import type { StudentDto, ProfileInfo } from "@repo/db/dtos/user";

interface CuRegistrationFormProps {
  studentId: number;
  studentData: StudentDto;
}

interface CorrectionFlags {
  gender: boolean;
  nationality: boolean;
  aadhaarNumber: boolean;
  apaarId: boolean;
  subjects: boolean;
}

interface PersonalInfoData {
  fullName: string;
  parentName: string;
  gender: string;
  nationality: string;
  ews: string;
  aadhaarNumber: string;
  apaarId: string;
}

interface AddressData {
  residential: {
    addressLine: string;
    city: string;
    district: string;
    policeStation: string;
    postOffice: string;
    state: string;
    country: string;
    pinCode: string;
  };
  mailing: {
    addressLine: string;
    city: string;
    district: string;
    policeStation: string;
    postOffice: string;
    state: string;
    country: string;
    pinCode: string;
  };
}

export default function CuRegistrationForm({ studentId, studentData }: CuRegistrationFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [, setCorrectionRequest] = useState<CuRegistrationCorrectionRequestDto | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<Record<number, string>>({});

  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
    aadhaarNumber: false,
    apaarId: false,
    subjects: false,
  });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    fullName: "",
    parentName: "",
    gender: "",
    nationality: "",
    ews: "No",
    aadhaarNumber: "",
    apaarId: "",
  });
  const [personalDeclared, setPersonalDeclared] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    residential: {
      addressLine: "",
      city: "",
      district: "",
      policeStation: "",
      postOffice: "",
      state: "West Bengal",
      country: "India",
      pinCode: "",
    },
    mailing: {
      addressLine: "",
      city: "",
      district: "",
      policeStation: "",
      postOffice: "",
      state: "West Bengal",
      country: "India",
      pinCode: "",
    },
  });
  const [addressDeclared, setAddressDeclared] = useState(false);
  const [subjectsDeclared, setSubjectsDeclared] = useState(false);
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [subjectsData, setSubjectsData] = useState({
    DSCC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    Minor: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    IDC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    SEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    AEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    CVAC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
  });
  const [mandatorySubjects, setMandatorySubjects] = useState({
    DSCC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    Minor: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    IDC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    SEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    AEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    CVAC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
  });

  // Helper: format Aadhaar number to 4-4-4 format
  const formatAadhaarNumber = (aadhaar: string) => {
    if (!aadhaar || aadhaar === "XXXX XXXX XXXX") return aadhaar;
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length === 12) {
      return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1-$2-$3");
    }
    return aadhaar;
  };

  // Helper: format APAAR ID to 3-3-3-3 format
  const formatApaarId = (apaarId: string) => {
    if (!apaarId || apaarId === "Not provided") return apaarId;
    const digits = apaarId.replace(/\D/g, "");
    if (digits.length === 12) {
      return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3-$4");
    }
    return apaarId;
  };

  const getReadOnlyFieldStyle = () => {
    return "bg-white text-gray-900 border-gray-300";
  };

  const getReadOnlyDivStyle = () => {
    return "px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm";
  };

  // Fetch correction request and populate data
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId || !studentData) return;

      try {
        setLoading(true);
        console.info(`[CU-REG MAIN-CONSOLE] Fetching data for student: ${studentId}`);

        // Fetch profile info using userId (like student-console does)
        let profileInfo: ProfileInfo | null = null;
        if (studentData.userId) {
          try {
            profileInfo = await fetchUserProfile(studentData.userId);
            console.info(`[CU-REG MAIN-CONSOLE] Profile info fetched:`, profileInfo);
          } catch (error) {
            console.error(`[CU-REG MAIN-CONSOLE] Error fetching profile:`, error);
          }
        }

        // Fetch correction request
        const requests = await getStudentCuCorrectionRequests(studentId);
        const existingRequest = requests?.[0] || null;

        if (existingRequest) {
          console.info(`[CU-REG MAIN-CONSOLE] Found correction request:`, existingRequest);
          setCorrectionRequest(existingRequest);

          // Update correction flags
          setCorrectionFlags({
            gender: existingRequest.genderCorrectionRequest ?? false,
            nationality: existingRequest.nationalityCorrectionRequest ?? false,
            aadhaarNumber: existingRequest.aadhaarCardNumberCorrectionRequest ?? false,
            apaarId: existingRequest.apaarIdCorrectionRequest ?? false,
            subjects: existingRequest.subjectsCorrectionRequest ?? false,
          });

          // Update declaration states
          setPersonalDeclared(!!existingRequest.personalInfoDeclaration);
          setAddressDeclared(!!existingRequest.addressInfoDeclaration);
          setSubjectsDeclared(!!existingRequest.subjectsDeclaration);
          setDocumentsConfirmed(!!existingRequest.documentsDeclaration);

          // Fetch documents
          if (existingRequest.id) {
            try {
              const docs = await getCuRegistrationDocuments(existingRequest.id);
              setUploadedDocuments(docs || []);
              console.info(`[CU-REG MAIN-CONSOLE] Loaded ${docs?.length || 0} documents`);
            } catch (docError) {
              console.error(`[CU-REG MAIN-CONSOLE] Error fetching documents:`, docError);
              // Don't fail the whole page if documents can't be loaded
              setUploadedDocuments([]);
            }
          }
        }

        // Populate personal info from profile data (like student-console does)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const personalDetails = profileInfo?.personalDetails as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const familyDetails = profileInfo?.familyDetails as any;

        console.info(`[CU-REG MAIN-CONSOLE] personalDetails from profile:`, personalDetails);
        console.info(`[CU-REG MAIN-CONSOLE] familyDetails from profile:`, familyDetails);

        if (personalDetails || studentData) {
          setPersonalInfo({
            fullName:
              studentData?.name && studentData.name.trim().length > 0
                ? studentData.name
                : `${personalDetails?.firstName || ""} ${personalDetails?.middleName || ""} ${personalDetails?.lastName || ""}`.trim(),
            parentName:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              familyDetails?.members?.find((m: any) => m.type === "FATHER")?.name ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              familyDetails?.members?.find((m: any) => m.type === "MOTHER")?.name ||
              familyDetails?.father?.name ||
              familyDetails?.mother?.name ||
              "",
            gender: personalDetails?.gender || "",
            nationality: personalDetails?.nationality?.name || "",
            aadhaarNumber: formatAadhaarNumber(personalDetails?.aadhaarCardNumber || "XXXX XXXX XXXX"),
            apaarId: formatApaarId((studentData?.apaarId && studentData.apaarId.trim()) || ""),
            ews: studentData?.belongsToEWS ? "Yes" : "No",
          });
        }

        // Populate address data
        const addresses = (personalDetails?.address as Array<Record<string, unknown>>) || [];
        const resAddr = addresses.find((a) => a?.type === "RESIDENTIAL") || addresses[0] || null;
        const mailAddr = addresses.find((a) => a?.type === "MAILING") || addresses[1] || resAddr || null;

        const getAddressField = (addr: Record<string, unknown> | null, field: string): string => {
          if (!addr) return "";
          return (addr[field] as string) || "";
        };

        const getNestedField = (addr: Record<string, unknown> | null, parent: string, field: string): string => {
          if (!addr) return "";
          const parentObj = addr[parent] as Record<string, unknown> | undefined;
          return (parentObj?.[field] as string) || "";
        };

        if (resAddr || mailAddr) {
          setAddressData({
            residential: {
              addressLine:
                getAddressField(resAddr, "addressLine") ||
                getAddressField(resAddr, "address") ||
                getAddressField(mailAddr, "addressLine") ||
                getAddressField(mailAddr, "address"),
              city:
                getNestedField(resAddr, "city", "name") ||
                getAddressField(resAddr, "otherCity") ||
                getNestedField(mailAddr, "city", "name") ||
                getAddressField(mailAddr, "otherCity"),
              district:
                getNestedField(resAddr, "district", "name") ||
                getAddressField(resAddr, "otherDistrict") ||
                getNestedField(mailAddr, "district", "name") ||
                getAddressField(mailAddr, "otherDistrict"),
              policeStation:
                getAddressField(resAddr, "otherPoliceStation") ||
                getNestedField(resAddr, "policeStation", "name") ||
                getAddressField(mailAddr, "otherPoliceStation") ||
                getNestedField(mailAddr, "policeStation", "name"),
              postOffice:
                getAddressField(resAddr, "otherPostoffice") ||
                getNestedField(resAddr, "postoffice", "name") ||
                getAddressField(mailAddr, "otherPostoffice") ||
                getNestedField(mailAddr, "postoffice", "name"),
              state:
                getNestedField(resAddr, "state", "name") || getNestedField(mailAddr, "state", "name") || "West Bengal",
              country:
                getNestedField(resAddr, "country", "name") || getNestedField(mailAddr, "country", "name") || "India",
              pinCode: getAddressField(resAddr, "pincode") || getAddressField(mailAddr, "pincode"),
            },
            mailing: {
              addressLine:
                getAddressField(mailAddr, "addressLine") ||
                getAddressField(mailAddr, "address") ||
                getAddressField(resAddr, "addressLine") ||
                getAddressField(resAddr, "address"),
              city:
                getNestedField(mailAddr, "city", "name") ||
                getAddressField(mailAddr, "otherCity") ||
                getNestedField(resAddr, "city", "name") ||
                getAddressField(resAddr, "otherCity"),
              district:
                getNestedField(mailAddr, "district", "name") ||
                getAddressField(mailAddr, "otherDistrict") ||
                getNestedField(resAddr, "district", "name") ||
                getAddressField(resAddr, "otherDistrict"),
              policeStation:
                getAddressField(mailAddr, "otherPoliceStation") ||
                getNestedField(mailAddr, "policeStation", "name") ||
                getAddressField(resAddr, "otherPoliceStation") ||
                getNestedField(resAddr, "policeStation", "name"),
              postOffice:
                getAddressField(mailAddr, "otherPostoffice") ||
                getNestedField(mailAddr, "postoffice", "name") ||
                getAddressField(resAddr, "otherPostoffice") ||
                getNestedField(resAddr, "postoffice", "name"),
              state:
                getNestedField(mailAddr, "state", "name") || getNestedField(resAddr, "state", "name") || "West Bengal",
              country:
                getNestedField(mailAddr, "country", "name") || getNestedField(resAddr, "country", "name") || "India",
              pinCode: getAddressField(mailAddr, "pincode") || getAddressField(resAddr, "pincode"),
            },
          });
        }

        // Fetch subject selections and mandatory subjects
        if (studentId) {
          try {
            const [studentRows, mandatoryRows] = await Promise.all([
              fetchStudentSubjectSelections(studentId).catch(() => ({
                studentSubjectsSelection: [],
                selectedMinorSubjects: [],
                actualStudentSelections: [],
                subjectSelectionMetas: [],
                hasFormSubmissions: false,
                session: { id: 1 },
              })),
              fetchMandatorySubjects(studentId).catch(() => []),
            ]);

            console.info(`[CU-REG MAIN-CONSOLE] Student selections:`, studentRows);
            console.info(`[CU-REG MAIN-CONSOLE] Mandatory subjects:`, mandatoryRows);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const next: any = { ...subjectsData };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mandatoryNext: any = { ...mandatorySubjects };

            const getCategoryKey = (label: string): string | undefined => {
              if (/Discipline Specific Core Courses/i.test(label) || /DSCC/i.test(label)) return "DSCC";
              if (/Minor/i.test(label)) return "Minor";
              if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) return "IDC";
              if (/Skill Enhancement Course/i.test(label) || /SEC/i.test(label)) return "SEC";
              if (/Ability Enhancement Course/i.test(label) || /AEC/i.test(label)) return "AEC";
              if (/Common Value Added Course/i.test(label) || /CVAC/i.test(label)) return "CVAC";
              return undefined;
            };

            const toSemNumsFromClasses = (forClasses?: unknown[]): number[] => {
              if (!Array.isArray(forClasses)) return [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const map: any = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
              const nums: number[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              forClasses.forEach((c: any) => {
                const label = String(c?.name || c?.shortName || c?.class?.name || c?.class?.shortName || "");
                const roman = /\b(I|II|III|IV|V|VI)\b/i.exec(label);
                if (roman && roman[1]) {
                  nums.push(map[roman[1].toUpperCase()]);
                  return;
                }
                const digit = /\b([1-6])\b/.exec(label);
                if (digit && digit[1]) nums.push(Number(digit[1]));
              });
              return Array.from(new Set(nums));
            };

            const toSemNumFromLabel = (label: string) => {
              const m = /\b(I|II|III|IV)\b/i.exec(label || "");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const map: any = { I: 1, II: 2, III: 3, IV: 4 };
              return m && m[1] ? map[m[1].toUpperCase()] : undefined;
            };

            // Process actualStudentSelections (actual form submissions)
            const actualSelections = studentRows?.actualStudentSelections || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            actualSelections.forEach((r: any) => {
              const label = String(r?.subjectSelectionMeta?.label || "");
              const name = r?.subject?.name || r?.subject?.code || "";
              if (!label || !name) return;

              const key = getCategoryKey(label);
              if (!key || !next[key]) return;

              let semesters: number[] = toSemNumsFromClasses(r?.subjectSelectionMeta?.forClasses);

              // Category-specific defaults when class span is unavailable
              if (semesters.length === 0 && /Minor\s*1/i.test(label)) semesters = [1, 2];
              if (semesters.length === 0 && /Minor\s*2/i.test(label)) semesters = [3, 4];
              if (semesters.length === 0 && /Minor\s*3/i.test(label)) semesters = [3];
              if (semesters.length === 0 && /IDC\s*1/i.test(label)) semesters = [1];
              if (semesters.length === 0 && /IDC\s*2/i.test(label)) semesters = [2];
              if (semesters.length === 0 && /IDC\s*3/i.test(label)) semesters = [3];
              if (semesters.length === 0 && /AEC/i.test(label)) semesters = [3, 4];
              if (semesters.length === 0 && /CVAC/i.test(label)) semesters = [2];
              if (semesters.length === 0) {
                const n = toSemNumFromLabel(label);
                if (n) semesters = [n];
              }

              semesters.forEach((s) => {
                if (next[key] && next[key][`sem${s}`] !== undefined) {
                  const currentValue = next[key][`sem${s}`];
                  if (!currentValue.includes(name)) {
                    currentValue.push(name);
                  }
                }
              });
            });

            // Process mandatory papers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mandatoryRows.forEach((r: any) => {
              const subjectTypeName = String(r?.subjectType?.name || "");
              const subjectName = String(r?.subject?.name || r?.subject?.code || "");
              const className = String(r?.class?.name || r?.class?.shortName || "");

              if (!subjectTypeName || !subjectName) return;

              const key = getCategoryKey(subjectTypeName);
              if (!key || !mandatoryNext[key]) return;

              // Extract semester from class name
              let semesters: number[] = [];
              const semMatch = className.match(/\b(I|II|III|IV|1|2|3|4)\b/i);
              if (semMatch && semMatch[1]) {
                const sem = semMatch[1].toUpperCase();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const semMap: any = { I: 1, II: 2, III: 3, IV: 4, "1": 1, "2": 2, "3": 3, "4": 4 };
                semesters = [semMap[sem]];
              }

              // If no semester found in class name, infer from subject type
              if (semesters.length === 0) {
                if (/Minor\s*1/i.test(subjectTypeName)) semesters = [1, 2];
                else if (/Minor\s*2/i.test(subjectTypeName)) semesters = [3, 4];
                else if (/Minor\s*3/i.test(subjectTypeName)) semesters = [3];
                else if (/IDC\s*1/i.test(subjectTypeName)) semesters = [1];
                else if (/IDC\s*2/i.test(subjectTypeName)) semesters = [2];
                else if (/IDC\s*3/i.test(subjectTypeName)) semesters = [3];
                else if (/AEC/i.test(subjectTypeName)) semesters = [3, 4];
                else if (/CVAC/i.test(subjectTypeName)) semesters = [2];
                else semesters = [1, 2, 3, 4]; // Default to all semesters
              }

              semesters.forEach((s) => {
                if (mandatoryNext[key] && mandatoryNext[key][`sem${s}`] !== undefined) {
                  const currentSubjects = mandatoryNext[key][`sem${s}`] as string[];
                  if (!currentSubjects.includes(subjectName)) {
                    currentSubjects.push(subjectName);
                  }
                }
              });
            });

            setSubjectsData(next);
            setMandatorySubjects(mandatoryNext);
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error fetching subjects:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error fetching data:", error);
        toast.error("Failed to load CU registration data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentData]);

  // Resolve preview URLs for documents
  useEffect(() => {
    (async () => {
      const promises = (uploadedDocuments || [])
        .filter((d) => {
          const fileType = d?.fileType as string | undefined;
          const id = d?.id as number | undefined;
          return fileType?.startsWith("image/") && typeof id === "number";
        })
        .map(async (d) => {
          const docId = d.id as number;
          if (docPreviewUrls[docId]) return;
          try {
            const url = await getCuRegistrationDocumentSignedUrl(docId);
            if (url) {
              setDocPreviewUrls((prev) => ({ ...prev, [docId]: url }));
            }
          } catch (error) {
            console.error(`[CU-REG MAIN-CONSOLE] Error fetching preview URL for document ${docId}:`, error);
          }
        });
      await Promise.allSettled(promises);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CU registration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Card className="shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex w-full overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === "personal"
                      ? "text-blue-600 border-blue-600 bg-transparent"
                      : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                  } cursor-pointer`}
                >
                  <span className="hidden sm:inline">Personal Info</span>
                  <span className="sm:hidden">Personal</span>
                </button>
                <button
                  onClick={() => setActiveTab("address")}
                  className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === "address"
                      ? "text-blue-600 border-blue-600 bg-transparent"
                      : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                  } cursor-pointer`}
                >
                  <span className="hidden sm:inline">Address Info</span>
                  <span className="sm:hidden">Address</span>
                </button>
                <button
                  onClick={() => setActiveTab("subjects")}
                  className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === "subjects"
                      ? "text-blue-600 border-blue-600 bg-transparent"
                      : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                  } cursor-pointer`}
                >
                  <span className="hidden sm:inline">Subjects Overview</span>
                  <span className="sm:hidden">Subjects</span>
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === "documents"
                      ? "text-blue-600 border-blue-600 bg-transparent"
                      : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                  } cursor-pointer`}
                >
                  Documents
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 bg-white">
              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Student Name</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        1.1 Full name
                      </Label>
                      <Input
                        id="fullName"
                        value={personalInfo.fullName}
                        className={getReadOnlyFieldStyle()}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Father/Mother Name */}
                    <div className="space-y-2">
                      <Label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                        1.2 Father / Mother's Name
                      </Label>
                      <Input
                        id="parentName"
                        value={personalInfo.parentName}
                        className={getReadOnlyFieldStyle()}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">1.3 Gender</Label>
                      <div className="flex flex-col gap-2">
                        <div className={getReadOnlyDivStyle()}>{personalInfo.gender || "—"}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.3 Correction Requested</span>
                          <Badge variant={correctionFlags.gender ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.gender ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Nationality */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">1.4 Nationality</Label>
                      <div className="flex flex-col gap-2">
                        <div className={getReadOnlyDivStyle()}>{personalInfo.nationality || "—"}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.4 Correction Requested</span>
                          <Badge variant={correctionFlags.nationality ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.nationality ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* EWS */}
                    <div className="space-y-2">
                      <Label htmlFor="ews" className="text-sm font-medium text-gray-700">
                        1.5 Whether belong to EWS
                      </Label>
                      <div className={getReadOnlyDivStyle()}>{personalInfo.ews}</div>
                    </div>

                    {/* Aadhaar Number */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">1.6 Aadhaar Number</Label>
                      <div className="flex flex-col gap-2">
                        <div className={getReadOnlyDivStyle()}>{personalInfo.aadhaarNumber || "—"}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.6 Correction Requested</span>
                          <Badge
                            variant={correctionFlags.aadhaarNumber ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {correctionFlags.aadhaarNumber ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* APAAR ID */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                        1.7 APAAR (ABC) ID
                      </Label>
                      <div className="flex flex-col gap-2">
                        <div className={getReadOnlyDivStyle()}>{personalInfo.apaarId || "Not provided"}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.7 Correction Requested</span>
                          <Badge variant={correctionFlags.apaarId ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.apaarId ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Declaration Status */}
                    <div className="pt-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Personal Info Declaration:</span>
                        <Badge variant={personalDeclared ? "default" : "outline"}>
                          {personalDeclared ? "✓ Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Address Info Tab */}
              <TabsContent value="address" className="space-y-6">
                <div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    {/* Residential Address */}
                    <div className="space-y-4 xl:pr-8 xl:border-r xl:border-gray-200">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">Residential Address</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.1 Address Line</Label>
                          <div className={getReadOnlyDivStyle() + " min-h-[80px]"}>
                            {addressData.residential.addressLine || "—"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.2 Country</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.country}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.3 State</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.state}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.4 District</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.district || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.5 City</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.city || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.6 Pin Code</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.pinCode || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.7 Police Station</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.policeStation || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.8 Post Office</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.residential.postOffice || "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Mailing Address */}
                    <div className="space-y-4 xl:pl-8">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">Mailing Address</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.9 Address Line</Label>
                          <div className={getReadOnlyDivStyle() + " min-h-[80px]"}>
                            {addressData.mailing.addressLine || "—"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.10 Country</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.country}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.11 State</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.state}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.12 District</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.district || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.13 City</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.city || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.14 Pin Code</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.pinCode || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.15 Police Station</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.policeStation || "—"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">2.16 Post Office</Label>
                          <div className={getReadOnlyDivStyle()}>{addressData.mailing.postOffice || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Declaration Status */}
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Address Info Declaration:</span>
                      <Badge variant={addressDeclared ? "default" : "outline"}>
                        {addressDeclared ? "✓ Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Subjects Overview Tab */}
              <TabsContent value="subjects" className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">3.1 Subjects Overview (Semesters 1-4)</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Correction Requested</span>
                      <Badge variant={correctionFlags.subjects ? "destructive" : "outline"} className="text-xs">
                        {correctionFlags.subjects ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  {/* Subjects Table Placeholder */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                            Category
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                            Sem 1
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                            Sem 2
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                            Sem 3
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                            Sem 4
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(["DSCC", "Minor", "IDC", "SEC", "AEC", "CVAC"] as const).map((category) => {
                          const semData = subjectsData[category];
                          return (
                            <tr key={category} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                {category}
                              </td>
                              {(["sem1", "sem2", "sem3", "sem4"] as const).map((sem) => {
                                const mandatorySubjectsList = (mandatorySubjects[category]?.[sem] as string[]) || [];
                                const studentSubjectsList = Array.isArray(semData[sem])
                                  ? semData[sem]
                                  : semData[sem]
                                    ? [semData[sem]]
                                    : [];

                                // Combine all subjects (mandatory + optional)
                                const allSubjects: Array<{ name: string; isMandatory: boolean }> = [];

                                // Add mandatory subjects
                                mandatorySubjectsList.forEach((subject) => {
                                  allSubjects.push({ name: subject, isMandatory: true });
                                });

                                // Add optional subjects (filter out duplicates)
                                const filteredSubjects = studentSubjectsList.filter(
                                  (subject) => !mandatorySubjectsList.includes(subject),
                                );
                                filteredSubjects.forEach((subject) => {
                                  allSubjects.push({ name: subject, isMandatory: false });
                                });

                                return (
                                  <td key={sem} className="border border-gray-300 px-2 py-2">
                                    {allSubjects.length > 0 ? (
                                      <div className="text-sm text-gray-900">
                                        {allSubjects.map((subj, idx) => (
                                          <span key={idx}>
                                            {subj.name}
                                            {idx < allSubjects.length - 1 && ", "}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400 text-center">—</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Declaration Status */}
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Subjects Declaration:</span>
                      <Badge variant={subjectsDeclared ? "default" : "outline"}>
                        {subjectsDeclared ? "✓ Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads</h2>

                  {/* Uploaded Documents Table */}
                  {uploadedDocuments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Document Type
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              File Name
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Size
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Status
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedDocuments.map((doc, index) => {
                            const document = doc.document as Record<string, unknown> | undefined;
                            const documentType = (document?.name as string) || `Document ${doc.documentId as string}`;
                            const fileSize = doc.fileSize as number | undefined;
                            const fileSizeMB = fileSize ? (fileSize / 1024 / 1024).toFixed(2) : "Unknown";
                            const fileType = doc.fileType as string | undefined;
                            const fileName = doc.fileName as string | undefined;
                            const docId = doc.id as number;

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {documentType}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                      {fileType?.startsWith("image/") ? (
                                        docPreviewUrls[docId] ? (
                                          <img
                                            src={docPreviewUrls[docId]}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={async () => {
                                              console.error(`[CU-REG MAIN-CONSOLE] Image load error for doc ${docId}`);
                                              // Try to fetch signed URL on error
                                              try {
                                                const url = await getCuRegistrationDocumentSignedUrl(docId);
                                                if (url) {
                                                  setDocPreviewUrls((prev) => ({ ...prev, [docId]: url }));
                                                }
                                              } catch (error) {
                                                console.error(`[CU-REG MAIN-CONSOLE] Failed to get signed URL:`, error);
                                              }
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                            ...
                                          </div>
                                        )
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs">
                                          PDF
                                        </div>
                                      )}
                                    </div>
                                    <span className="truncate max-w-[200px]">{fileName || "Unknown"}</span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {fileSizeMB} MB
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Uploaded
                                  </Badge>
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  <button
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={async () => {
                                      try {
                                        const docId = doc.id as number;
                                        const url = await getCuRegistrationDocumentSignedUrl(docId);
                                        window.open(url, "_blank");
                                      } catch {
                                        toast.error("Failed to open document");
                                      }
                                    }}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">No documents uploaded yet.</p>
                    </div>
                  )}

                  {/* Declaration Status */}
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Documents Declaration:</span>
                      <Badge variant={documentsConfirmed ? "default" : "outline"}>
                        {documentsConfirmed ? "✓ Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
