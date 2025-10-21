"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useStudent } from "@/providers/student-provider";
import { fetchPersonalDetailsByStudentId } from "@/services/personal-details";
import {
  fetchStudentSubjectSelections,
  fetchCurrentActiveSelections,
  fetchMandatorySubjects,
  type StudentSubjectSelectionApiResponse,
} from "@/services/subject-selection";
import {
  createCuCorrectionRequest,
  getStudentCuCorrectionRequests,
  getCuCorrectionRequestById,
  updateCuCorrectionRequest,
  submitCuRegistrationCorrectionRequestWithDocuments,
  submitPersonalInfoDeclaration,
  submitAddressInfoDeclaration,
  submitSubjectsDeclaration,
  submitDocumentsDeclaration,
} from "@/services/cu-registration";
import type { CuRegistrationCorrectionRequestDto } from "@repo/db/dtos/admissions";
import {
  uploadCuRegistrationDocument,
  getCuRegistrationDocuments,
  getCuRegistrationDocumentSignedUrl,
} from "@/services/cu-registration-documents";
import { getCuRegistrationPdfUrlByRequestId } from "@/services/cu-registration-pdf";
import { fetchCities, fetchDistricts, IdNameDto } from "@/services/resources";
import { useRouter } from "next/navigation";

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

export default function CURegistrationPage() {
  const { profileInfo, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { student } = useStudent();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const hasAutoNavigatedRef = React.useRef(false);

  // Debug: Track activeTab changes
  React.useEffect(() => {
    console.info("[CU-REG FRONTEND] activeTab changed to:", activeTab);
  }, [activeTab]);
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
  // Note: Police station and post office are now input fields, no longer using dropdowns
  const [cities, setCities] = useState<IdNameDto[]>([]);
  const [districts, setDistricts] = useState<IdNameDto[]>([]);
  const [mailingDistricts, setMailingDistricts] = useState<IdNameDto[]>([]);
  const [addressDeclared, setAddressDeclared] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);

  // If NODE_ENV is production, then redirect back and dont render
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_ENV !== "staging" && process.env.NEXT_PUBLIC_APP_ENV !== "development") {
      router.push("/");
    }
  }, []);

  // Note: ID states removed since police station and post office are now input fields

  // Load cities for dropdown options
  useEffect(() => {
    (async () => {
      try {
        const [cityList] = await Promise.all([fetchCities().catch(() => [])]);
        setCities(cityList || []);
      } catch {}
    })();
  }, []);

  // Load districts when city changes (residential)
  useEffect(() => {
    (async () => {
      try {
        const cityId = cities.find(
          (c) => c.name.trim().toLowerCase() === (addressData.residential.city || "").trim().toLowerCase(),
        )?.id;
        if (cityId) {
          const d = await fetchDistricts({ cityId }).catch(() => []);
          setDistricts(d || []);
        }
      } catch {}
    })();
  }, [addressData.residential.city, cities]);

  // Load districts when city changes (mailing)
  useEffect(() => {
    (async () => {
      try {
        const cityId = cities.find(
          (c) => c.name.trim().toLowerCase() === (addressData.mailing.city || "").trim().toLowerCase(),
        )?.id;
        if (cityId) {
          const d = await fetchDistricts({ cityId }).catch(() => []);
          setMailingDistricts(d || []);
        }
      } catch {}
    })();
  }, [addressData.mailing.city, cities]);
  // Subjects loading state
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Legacy subjects data (keeping for backward compatibility)
  const [subjectsData, setSubjectsData] = useState({
    DSCC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    Minor: { sem1: [], sem2: [], sem3: [], sem4: [] },
    IDC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    SEC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    AEC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    CVAC: { sem1: [], sem2: [], sem3: [], sem4: [] },
  });
  const [mandatorySubjects, setMandatorySubjects] = useState({
    DSCC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    Minor: { sem1: [], sem2: [], sem3: [], sem4: [] },
    IDC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    SEC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    AEC: { sem1: [], sem2: [], sem3: [], sem4: [] },
    CVAC: { sem1: [], sem2: [], sem3: [], sem4: [] },
  });
  const [subjectsDeclared, setSubjectsDeclared] = useState(false);
  const [documents, setDocuments] = useState({
    classXIIMarksheet: null as File | null,
    aadhaarCard: null as File | null,
    apaarIdCard: null as File | null,
    fatherPhotoId: null as File | null,
    motherPhotoId: null as File | null,
    ewsCertificate: null as File | null,
  });
  // Map local keys to backend document names
  const documentNameMap: Record<keyof typeof documents, string> = {
    classXIIMarksheet: "Class XII Marksheet",
    aadhaarCard: "Aadhaar Card",
    apaarIdCard: "APAAR ID Card",
    fatherPhotoId: "Father Photo ID",
    motherPhotoId: "Mother Photo ID",
    ewsCertificate: "EWS Certificate",
  };
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [finalDeclaration, setFinalDeclaration] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; type: string } | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Helper: convert backend-relative URLs (e.g. "/uploads/...") to absolute URLs using backend base
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url)
      ? url
      : `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}${url.startsWith("/") ? url : `/${url}`}`;
  };

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

  // Helper: clean APAAR ID (remove formatting for backend)
  const cleanApaarId = (apaarId: string) => {
    return apaarId.replace(/\D/g, "");
  };

  // Helper: format APAAR ID input as user types
  const formatApaarIdInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9, 12)}`;
  };

  // Handle document uploads via backend API
  const handleUpload = async (key: keyof typeof documents, documentId: number) => {
    const file = documents[key];
    if (!file) {
      console.warn("[CU-REG FRONTEND] No file provided for upload");
      return;
    }
    if (!correctionRequestId) {
      console.error("[CU-REG FRONTEND] Cannot upload: correctionRequestId is null");
      return;
    }
    try {
      await uploadCuRegistrationDocument({
        file,
        cuRegistrationCorrectionRequestId: correctionRequestId,
        documentId,
      });
      toast.success("Uploaded successfully");
    } catch (e: any) {
      console.error("[CU-REG FRONTEND] Upload failed:", e);
      toast.error(e?.message || "Upload failed");
    }
  };

  // Populate form data when profile data is loaded
  React.useEffect(() => {
    if (profileInfo?.personalDetails || student) {
      const personalDetails = profileInfo?.personalDetails as any;
      const familyDetails = profileInfo?.familyDetails as any;

      console.log("Profile data loaded:", {
        personalDetails,
        familyDetails,
        profileInfo,
        student,
      });

      // Update personal info
      setPersonalInfo((prev) => ({
        ...prev,
        fullName:
          student?.name && student.name.trim().length > 0
            ? student.name
            : `${personalDetails?.firstName || ""} ${personalDetails?.middleName || ""} ${personalDetails?.lastName || ""}`.trim(),
        parentName:
          familyDetails?.members?.find((m: any) => m.type === "FATHER")?.name ||
          familyDetails?.members?.find((m: any) => m.type === "MOTHER")?.name ||
          familyDetails?.father?.name ||
          familyDetails?.mother?.name ||
          "",
        gender: personalDetails?.gender || "",
        nationality: personalDetails?.nationality?.name || "",
        aadhaarNumber: formatAadhaarNumber(personalDetails?.aadhaarCardNumber || "XXXX XXXX XXXX"),
        // APAAR (ABC) ID may be stored as apaarId, abcId, or apprid
        apaarId: formatApaarId((student?.apaarId && student.apaarId.trim()) || prev.apaarId || ""),
        ews: student?.belongsToEWS ? "Yes" : prev.ews,
      }));

      // Update address data by type
      const addresses: any[] = personalDetails?.address || [];
      const resAddr = addresses.find((a) => a?.type === "RESIDENTIAL") || null;
      const mailAddr = addresses.find((a) => a?.type === "MAILING") || null;

      // Debug: Log the address data from profile
      console.info("Address data from profile:", {
        addresses,
        resAddr,
        mailAddr,
        resAddrPoliceStation: resAddr?.policeStation,
        resAddrOtherPoliceStation: resAddr?.otherPoliceStation,
        mailAddrPoliceStation: mailAddr?.policeStation,
        mailAddrOtherPoliceStation: mailAddr?.otherPoliceStation,
        resAddrPostoffice: resAddr?.postoffice,
        resAddrOtherPostoffice: resAddr?.otherPostoffice,
        mailAddrPostoffice: mailAddr?.postoffice,
        mailAddrOtherPostoffice: mailAddr?.otherPostoffice,
      });

      if (resAddr || mailAddr) {
        setAddressData((prev) => ({
          ...prev,
          residential: {
            addressLine: (resAddr?.addressLine ?? mailAddr?.addressLine) || "",
            city: (resAddr?.city?.name ?? resAddr?.otherCity ?? mailAddr?.city?.name ?? mailAddr?.otherCity) || "",
            district:
              (resAddr?.district?.name ??
                resAddr?.otherDistrict ??
                mailAddr?.district?.name ??
                mailAddr?.otherDistrict) ||
              "",
            policeStation:
              (resAddr?.otherPoliceStation ??
                resAddr?.policeStation?.name ??
                mailAddr?.otherPoliceStation ??
                mailAddr?.policeStation?.name) ||
              "",
            postOffice:
              (resAddr?.otherPostoffice ??
                resAddr?.postoffice?.name ??
                mailAddr?.otherPostoffice ??
                mailAddr?.postoffice?.name) ||
              "",
            state: (resAddr?.state?.name ?? mailAddr?.state?.name) || "West Bengal",
            country: (resAddr?.country?.name ?? mailAddr?.country?.name) || "India",
            pinCode: (resAddr?.pincode ?? mailAddr?.pincode) || "",
          },
        }));
      }

      if (mailAddr || resAddr) {
        setAddressData((prev) => ({
          ...prev,
          mailing: {
            addressLine: (mailAddr?.addressLine ?? resAddr?.addressLine) || "",
            city: (mailAddr?.city?.name ?? mailAddr?.otherCity ?? resAddr?.city?.name ?? resAddr?.otherCity) || "",
            district:
              (mailAddr?.district?.name ??
                mailAddr?.otherDistrict ??
                resAddr?.district?.name ??
                resAddr?.otherDistrict) ||
              "",
            policeStation:
              (mailAddr?.otherPoliceStation ??
                mailAddr?.policeStation?.name ??
                resAddr?.otherPoliceStation ??
                resAddr?.policeStation?.name) ||
              "",
            postOffice:
              (mailAddr?.otherPostoffice ??
                mailAddr?.postoffice?.name ??
                resAddr?.otherPostoffice ??
                resAddr?.postoffice?.name) ||
              "",
            state: (mailAddr?.state?.name ?? resAddr?.state?.name) || "West Bengal",
            country: (mailAddr?.country?.name ?? resAddr?.country?.name) || "India",
            pinCode: (mailAddr?.pincode ?? resAddr?.pincode) || "",
          },
        }));
      }
    }
  }, [profileInfo]);

  // Prefill from personal-details and student models
  useEffect(() => {
    if (!student?.id) return;
    fetchPersonalDetailsByStudentId(student.id)
      .then((pd) => {
        if (!pd) return;
        setPersonalInfo((prev) => ({
          ...prev,
          gender: pd.gender || prev.gender,
          aadhaarNumber: formatAadhaarNumber(pd.aadhaarCardNumber || prev.aadhaarNumber),
        }));
      })
      .catch(() => undefined);
  }, [student?.id]);

  // Load subjects data using original subject selection service
  useEffect(() => {
    if (!student?.id) return;

    setSubjectsLoading(true);
    console.log("🔍 Loading subjects data for student:", student.id);

    loadLegacySubjectsData();
    setSubjectsLoading(false);
  }, [student?.id]);

  // Load legacy subject overview from backend selections (fallback)
  const loadLegacySubjectsData = () => {
    if (!student?.id) return;

    // Fetch both student selections and mandatory subjects in parallel
    Promise.all([
      fetchStudentSubjectSelections(Number(student.id)).catch(
        (): StudentSubjectSelectionApiResponse => ({
          actualStudentSelections: [],
          selectedMinorSubjects: [],
          studentSubjectsSelection: [],
          subjectSelectionMetas: [],
          hasFormSubmissions: false,
          session: { id: 1 },
        }),
      ),
      fetchMandatorySubjects(Number(student.id)).catch(() => []), // Fallback to empty array if API doesn't exist yet
    ])
      .then(([studentRows, mandatoryRows]) => {
        console.log("🔍 Student selections data:", studentRows);
        console.log("🔍 Student selections data type:", typeof studentRows);
        console.log("🔍 Student selections data keys:", Object.keys(studentRows || {}));
        console.log("🔍 Mandatory subjects data:", mandatoryRows);
        const next: any = { ...subjectsData };
        const mandatoryNext: any = { ...mandatorySubjects };

        const toSemNumFromLabel = (label: string) => {
          const m = /\b(I|II|III|IV)\b/i.exec(label || "");
          const map: any = { I: 1, II: 2, III: 3, IV: 4 };
          return m ? map[m[1].toUpperCase()] : undefined;
        };
        const toSemNumsFromClasses = (forClasses?: any[]) => {
          if (!Array.isArray(forClasses)) return [] as number[];
          const map: any = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
          const nums: number[] = [];
          forClasses.forEach((c) => {
            const label = String(c?.name || c?.shortName || c?.class?.name || c?.class?.shortName || "");
            const roman = /\b(I|II|III|IV|V|VI)\b/i.exec(label);
            if (roman) {
              nums.push(map[roman[1].toUpperCase()]);
              return;
            }
            const digit = /\b([1-6])\b/.exec(label);
            if (digit) nums.push(Number(digit[1]));
          });
          return Array.from(new Set(nums));
        };
        const getCategoryKey = (label: string): keyof typeof next | undefined => {
          // Map full subject type names to category keys
          if (/Discipline Specific Core Courses/i.test(label) || /DSCC/i.test(label)) return "DSCC" as any;
          if (/Minor/i.test(label)) return "Minor" as any;
          if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) return "IDC" as any;
          if (/Skill Enhancement Course/i.test(label) || /SEC/i.test(label)) return "SEC" as any;
          if (/Ability Enhancement Course/i.test(label) || /AEC/i.test(label)) return "AEC" as any;
          if (/Common Value Added Course/i.test(label) || /CVAC/i.test(label)) return "CVAC" as any;
          return undefined;
        };

        // Process student selections - extract actualStudentSelections from the response
        console.log("🔍 Full student selections API response:", studentRows);
        console.log("🔍 studentRows.actualStudentSelections:", studentRows?.actualStudentSelections);
        console.log("🔍 studentRows.selectedMinorSubjects:", studentRows?.selectedMinorSubjects);
        console.log("🔍 studentRows.studentSubjectsSelection:", studentRows?.studentSubjectsSelection);
        console.log("🔍 studentRows.hasFormSubmissions:", studentRows?.hasFormSubmissions);

        const actualSelections = studentRows?.actualStudentSelections || [];
        console.log("🔍 Processing actual student selections:", actualSelections);
        console.log("🔍 actualSelections length:", actualSelections.length);

        actualSelections.forEach((r: any, index: number) => {
          console.log(`🔍 Processing selection ${index}:`, r);
          const label = String(r?.subjectSelectionMeta?.label || "");
          const name = r?.subject?.name || r?.subject?.code || "";
          console.log(`🔍 Selection ${index} - label: "${label}", name: "${name}"`);
          if (!label || !name) {
            console.log(`🔍 Selection ${index} - skipping due to missing label or name`);
            return;
          }
          const key = getCategoryKey(label);
          console.log(`🔍 Selection ${index} - category key: "${String(key)}"`);
          if (!key || !next[key]) {
            console.log(`🔍 Selection ${index} - skipping due to invalid key or missing category`);
            return;
          }

          let semesters: number[] = toSemNumsFromClasses(r?.subjectSelectionMeta?.forClasses);
          console.log(`🔍 Selection ${index} - initial semesters from classes:`, semesters);
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
          console.log(`🔍 Selection ${index} - final semesters:`, semesters);

          semesters.forEach((s) => {
            if (next[key] && next[key][`sem${s}`] !== undefined) {
              // Convert to array if it's a string, or add to existing array
              const currentValue = next[key][`sem${s}`];
              if (typeof currentValue === "string") {
                next[key][`sem${s}`] = currentValue ? [currentValue, name] : [name];
              } else if (Array.isArray(currentValue)) {
                if (!currentValue.includes(name)) {
                  currentValue.push(name);
                }
              } else {
                next[key][`sem${s}`] = [name];
              }
            }
          });
        });

        // Process mandatory papers (different structure from student selections)
        mandatoryRows.forEach((r: any) => {
          // Mandatory papers have different structure: { subjectType, paper, subject, class }
          const subjectTypeName = String(r?.subjectType?.name || "");
          const subjectName = String(r?.subject?.name || r?.subject?.code || "");
          const className = String(r?.class?.name || r?.class?.shortName || "");

          if (!subjectTypeName || !subjectName) return;

          const key = getCategoryKey(subjectTypeName);
          if (!key || !mandatoryNext[key]) return;

          // Extract semester from class name (e.g., "SEMESTER I", "SEM I", "1", etc.)
          let semesters: number[] = [];
          const semMatch = className.match(/\b(I|II|III|IV|1|2|3|4)\b/i);
          if (semMatch) {
            const sem = semMatch[1].toUpperCase();
            const semMap: any = { I: 1, II: 2, III: 3, IV: 4, "1": 1, "2": 2, "3": 3, "4": 4 };
            semesters = [semMap[sem]];
          }

          // If no semester found in class name, try to infer from subject type
          if (semesters.length === 0) {
            if (/Minor\s*1/i.test(subjectTypeName)) semesters = [1, 2];
            else if (/Minor\s*2/i.test(subjectTypeName)) semesters = [3, 4];
            else if (/Minor\s*3/i.test(subjectTypeName)) semesters = [3];
            else if (/IDC\s*1/i.test(subjectTypeName)) semesters = [1];
            else if (/IDC\s*2/i.test(subjectTypeName)) semesters = [2];
            else if (/IDC\s*3/i.test(subjectTypeName)) semesters = [3];
            else if (/AEC/i.test(subjectTypeName)) semesters = [3, 4];
            else if (/CVAC/i.test(subjectTypeName)) semesters = [2];
            else {
              // Default to all semesters if we can't determine
              semesters = [1, 2, 3, 4];
            }
          }

          console.log("🔍 Assigning to semesters:", { semesters, key, subjectName });
          semesters.forEach((s) => {
            if (mandatoryNext[key] && mandatoryNext[key][`sem${s}`] !== undefined) {
              // Add subject to array if not already present
              const currentSubjects = mandatoryNext[key][`sem${s}`] as string[];
              if (!currentSubjects.includes(subjectName)) {
                currentSubjects.push(subjectName);
              }
              console.log("🔍 Assigned:", { key, semester: `sem${s}`, subjectName, allSubjects: currentSubjects });
            }
          });
        });

        console.log("🔍 Final student subjects state:", next);
        console.log("🔍 Final mandatory subjects state:", mandatoryNext);
        setSubjectsData(next);
        setMandatorySubjects(mandatoryNext);
      })
      .catch(() => {
        // Fallback to broader service if needed
        fetchStudentSubjectSelections(Number(student.id))
          .then(() => undefined)
          .catch(() => undefined);
      });
  };

  // Ensure a correction request exists (create draft if none)
  const [correctionRequest, setCorrectionRequest] = useState<CuRegistrationCorrectionRequestDto | null>(null);
  const [correctionRequestId, setCorrectionRequestId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showStatusAlert, setShowStatusAlert] = useState<boolean>(true);
  const [correctionRequestStatus, setCorrectionRequestStatus] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<Record<number, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(true);

  // Fetch uploaded documents when correction request is available
  useEffect(() => {
    if (!correctionRequestId) return;
    (async () => {
      try {
        console.info(`[CU-REG FRONTEND] Fetching documents for correction request: ${correctionRequestId}`);
        const docs = await getCuRegistrationDocuments(correctionRequestId);
        setUploadedDocuments(docs || []);
        console.info(`[CU-REG FRONTEND] Loaded ${docs?.length || 0} documents`);
      } catch (error) {
        console.error(`[CU-REG FRONTEND] Error fetching documents:`, error);
        setUploadedDocuments([]);
      }
    })();
  }, [correctionRequestId]);

  // Fetch PDF URL when correction request is available and has application number
  useEffect(() => {
    if (!correctionRequestId || !correctionRequest?.cuRegistrationApplicationNumber) {
      console.info(
        `[CU-REG FRONTEND] Skipping PDF fetch - correctionRequestId: ${correctionRequestId}, applicationNumber: ${correctionRequest?.cuRegistrationApplicationNumber}`,
      );
      return;
    }

    (async () => {
      try {
        setPdfLoading(true);
        console.info(`[CU-REG FRONTEND] Fetching PDF URL for correction request: ${correctionRequestId}`);
        const pdfData = await getCuRegistrationPdfUrlByRequestId(correctionRequestId);
        setPdfUrl(pdfData.pdfUrl);
        console.info(`[CU-REG FRONTEND] PDF URL loaded:`, pdfData);
      } catch (error) {
        console.error(`[CU-REG FRONTEND] Error fetching PDF URL:`, error);
        setPdfUrl(null);
      } finally {
        setPdfLoading(false);
      }
    })();
  }, [correctionRequestId, correctionRequest?.cuRegistrationApplicationNumber]);

  // Resolve preview URLs for images (supports filesystem and S3 via signed URL)
  useEffect(() => {
    (async () => {
      const promises = (uploadedDocuments || [])
        .filter((d: any) => d?.fileType?.startsWith("image/") && typeof d?.id === "number")
        .map(async (d: any) => {
          if (docPreviewUrls[d.id]) return;
          try {
            // Prefer backend-provided URL for cross-origin correctness
            const url = await getCuRegistrationDocumentSignedUrl(d.id);
            if (url) {
              setDocPreviewUrls((prev) => ({ ...prev, [d.id]: url }));
            }
          } catch {
            // Fallback to absolute URL based on documentUrl
            if (d.documentUrl) {
              setDocPreviewUrls((prev) => ({ ...prev, [d.id]: toAbsoluteUrl(d.documentUrl) }));
            }
          }
        });
      await Promise.allSettled(promises);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedDocuments]);
  useEffect(() => {
    if (!student?.id) return;
    (async () => {
      try {
        console.info(`[CU-REG FRONTEND] Checking for existing correction request for student: ${student.id}`);
        const list = await getStudentCuCorrectionRequests(Number(student.id));
        const existing = list?.[0] || null;
        if (existing) {
          console.info(`[CU-REG FRONTEND] Found existing correction request: ${existing.id}`);
          setCorrectionRequest(existing);
          setCorrectionRequestId(existing.id ?? null);
          setCorrectionRequestStatus(existing.status ?? null);

          // Sync declaration checkboxes from server state
          setPersonalDeclared(!!existing.personalInfoDeclaration);
          setAddressDeclared(!!existing.addressInfoDeclaration);
          setSubjectsDeclared(!!existing.subjectsDeclaration);
          setDocumentsConfirmed(!!existing.documentsDeclaration);

          // Update correction flags from the existing request
          setCorrectionFlags({
            gender: existing.genderCorrectionRequest ?? false,
            nationality: existing.nationalityCorrectionRequest ?? false,
            aadhaarNumber: existing.aadhaarCardNumberCorrectionRequest ?? false,
            apaarId: existing.apaarIdCorrectionRequest ?? false,
            subjects: existing.subjectsCorrectionRequest ?? false,
          });

          // Set uploaded documents from the existing request
          if (existing.documents) {
            setUploadedDocuments(existing.documents);
          }
        } else {
          console.info(`[CU-REG FRONTEND] No existing correction request, creating new one for student: ${student.id}`);
          const created = await createCuCorrectionRequest({
            studentId: Number(student.id),
            flags: correctionFlags as unknown as Record<string, boolean>,
            payload: {},
            // Don't generate CU registration application number here - it will be generated on final submit
          });
          console.info(`[CU-REG FRONTEND] Created new correction request: ${created.id}`);
          setCorrectionRequest(created);
          setCorrectionRequestId(created.id ?? null);
          setCorrectionRequestStatus(created.status ?? null);
          // Ensure declarations are initially unchecked for a new draft
          setPersonalDeclared(!!created.personalInfoDeclaration);
          setAddressDeclared(!!created.addressInfoDeclaration);
          setSubjectsDeclared(!!created.subjectsDeclaration);
          setDocumentsConfirmed(!!created.documentsDeclaration);
        }
      } catch (error) {
        console.error("[CU-REG FRONTEND] Error handling CU correction request:", error);
      }
    })();
  }, [student?.id]);

  // Also resync local checkbox states whenever the loaded correctionRequest changes
  useEffect(() => {
    if (!correctionRequest) return;
    setPersonalDeclared(!!correctionRequest.personalInfoDeclaration);
    setAddressDeclared(!!correctionRequest.addressInfoDeclaration);
    setSubjectsDeclared(!!correctionRequest.subjectsDeclaration);
    setDocumentsConfirmed(!!correctionRequest.documentsDeclaration);
  }, [correctionRequest]);

  // Auto-switch to next tab on load/refresh based on completed declarations
  useEffect(() => {
    if (!correctionRequest || hasAutoNavigatedRef.current) return;
    if (correctionRequest?.onlineRegistrationDone) return; // don't navigate after final submit

    const p = !!correctionRequest.personalInfoDeclaration;
    const a = !!correctionRequest.addressInfoDeclaration;
    const s = !!correctionRequest.subjectsDeclaration;
    const d = !!correctionRequest.documentsDeclaration;

    let nextTab = "personal";
    if (p && !a) nextTab = "address";
    else if (p && a && !s) nextTab = "subjects";
    else if (p && a && s && !d) nextTab = "documents";

    if (nextTab !== activeTab) setActiveTab(nextTab);
    hasAutoNavigatedRef.current = true;
  }, [correctionRequest, activeTab]);

  // Auto-hide status alert after 2 seconds
  useEffect(() => {
    if (correctionRequestStatus && correctionRequestStatus !== "PENDING") {
      const timer = setTimeout(() => {
        setShowStatusAlert(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [correctionRequestStatus]);

  // Helper function to determine if form is editable
  const isFormEditable = () => {
    // Allow editing if status is PENDING or if final submission is not done
    return (
      !correctionRequestStatus || correctionRequestStatus === "PENDING" || !correctionRequest?.onlineRegistrationDone
    );
  };

  // Helper function to determine if individual fields are editable
  const isFieldEditable = () => {
    // Allow editing if status is PENDING or if final submission is not done
    return (
      !correctionRequestStatus || correctionRequestStatus === "PENDING" || !correctionRequest?.onlineRegistrationDone
    );
  };

  // Helper function to determine if correction flags should be shown
  const shouldShowCorrectionFlags = () => {
    // Show correction flags if final submission is not done
    return !correctionRequest?.onlineRegistrationDone;
  };

  // Helper function to determine if declaration checkboxes should be interactive
  const isDeclarationInteractive = () => {
    // Allow interaction if final submission is not done
    return !correctionRequest?.onlineRegistrationDone;
  };

  // Helper function to get proper styling for read-only fields
  const getReadOnlyFieldStyle = () => {
    return isFieldEditable() ? "bg-gray-50 text-gray-600 border-gray-300" : "bg-white text-gray-900 border-gray-300";
  };

  // Helper function to get proper styling for read-only div fields
  const getReadOnlyDivStyle = () => {
    return isFieldEditable()
      ? "px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
      : "px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm";
  };

  // Save correction flags when toggled
  const handleFlagChange = (key: keyof typeof correctionFlags, value: boolean) => {
    const next = { ...correctionFlags, [key]: value };
    setCorrectionFlags(next);
    if (correctionRequestId) {
      updateCuCorrectionRequest(correctionRequestId, { flags: next }).catch(() => undefined);
    }
  };

  const handleCorrectionToggle = async (field: keyof CorrectionFlags) => {
    const next = { ...correctionFlags, [field]: !correctionFlags[field] };
    console.info("[CU-REG FRONTEND] Toggling correction flag", { field, next });
    setCorrectionFlags(next);
    if (correctionRequestId) {
      try {
        console.info("[CU-REG FRONTEND] Persisting flags to backend", { correctionRequestId, flags: next });
        const updated = await updateCuCorrectionRequest(correctionRequestId, { flags: next });
        console.info("[CU-REG FRONTEND] Flags persisted, server response status:", updated?.status);
      } catch (e) {
        // Revert on failure
        setCorrectionFlags(correctionFlags);
        console.error("[CU-REG FRONTEND] Failed to update correction flags", e);
        toast.error("Failed to save correction flag");
      }
    }
  };

  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Special handler for APAAR ID with formatting
  const handleApaarIdChange = (value: string) => {
    const formatted = formatApaarIdInput(value);
    setPersonalInfo((prev) => ({
      ...prev,
      apaarId: formatted,
    }));
  };

  const handleAddressChange = (type: "residential" | "mailing", field: string, value: string) => {
    setAddressData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleDeclarationChange = async (checked: boolean) => {
    console.info("[CU-REG FRONTEND] Declaration checkbox clicked", { checked, correctionRequestId });

    // Prevent toggling if already declared
    if (correctionRequest?.personalInfoDeclaration && !checked) {
      console.info("[CU-REG FRONTEND] Declaration already completed, cannot toggle back to false");
      return;
    }

    // Always save data and flags if checked OR if already declared (for updates)
    if (correctionRequestId && (checked || correctionRequest?.personalInfoDeclaration)) {
      try {
        // If already declared, always set to true for updates
        setPersonalDeclared(correctionRequest?.personalInfoDeclaration ? true : checked);

        // Always save data and flags, regardless of declaration status
        console.info("[CU-REG FRONTEND] Saving Personal info data and flags", {
          correctionRequestId,
          flags: correctionFlags,
          personalInfo,
        });

        // Debug: Check if correctionFlags and personalInfo have values
        console.info("[CU-REG FRONTEND] Debug - correctionFlags:", correctionFlags);
        console.info("[CU-REG FRONTEND] Debug - personalInfo:", personalInfo);
        console.info("[CU-REG FRONTEND] Debug - correctionFlags keys:", Object.keys(correctionFlags));
        console.info("[CU-REG FRONTEND] Debug - personalInfo keys:", Object.keys(personalInfo));

        // Use updateCuCorrectionRequest to save both data and declaration
        const updateData = {
          flags: correctionFlags as unknown as Record<string, boolean>,
          payload: {
            personalInfo: {
              gender: personalInfo.gender,
              nationality: personalInfo.nationality,
              apaarId: cleanApaarId(personalInfo.apaarId),
              ews: personalInfo.ews,
            },
          },
          // Only set declaration flag if it's a new declaration
          ...(checked && { personalInfoDeclaration: true }),
        };
        console.info("[CU-REG FRONTEND] Sending update data:", updateData);
        console.info("[CU-REG FRONTEND] Debug - updateData.flags:", updateData.flags);
        console.info("[CU-REG FRONTEND] Debug - updateData.payload:", updateData.payload);
        console.info("[CU-REG FRONTEND] Debug - updateData.payload.personalInfo:", updateData.payload.personalInfo);
        console.info("[CU-REG FRONTEND] Debug - correctionFlags being sent:", correctionFlags);
        console.info("[CU-REG FRONTEND] Debug - flags object being sent:", updateData.flags);
        await updateCuCorrectionRequest(correctionRequestId, updateData as any);
        console.info("[CU-REG FRONTEND] Personal declaration and data submitted");

        // Refresh local correction request to reflect saved declarations/flags
        try {
          const updated = await getCuCorrectionRequestById(correctionRequestId);
          setCorrectionRequest(updated);
          setCorrectionRequestStatus(updated.status ?? null);
          console.info("[CU-REG FRONTEND] Refreshed request after personal declaration", {
            status: updated.status,
            personalInfoDeclaration: updated.personalInfoDeclaration,
          });
        } catch {}

        // Check if declaration was already completed
        const isAlreadyCompleted = correctionRequest?.personalInfoDeclaration;

        if (isAlreadyCompleted) {
          toast.success("Personal Info Updated", {
            description: "Data saved successfully. Proceeding to Address Info tab.",
            duration: 2000,
          });
        } else {
          toast.success("Personal Info Declared", {
            description: "You can now proceed to the Address Info tab.",
            duration: 3000,
          });
        }

        // Automatically switch to Address tab after a short delay
        setTimeout(() => {
          handleTabChange("address");
        }, 1000);
      } catch (error: any) {
        console.error("[PERSONAL DECLARATION] Error:", error);
        toast.error("Failed to submit personal info declaration");
        setPersonalDeclared(false); // Revert the checkbox state
      }
    }
  };

  const getDeclarationText = () => {
    const hasCorrections = Object.values(correctionFlags).some((flag) => flag);
    if (hasCorrections) {
      return "You have requested corrections on this section. You must inform of the same at the time of submitting your Admission & Registration Datasheet and documents physically at the College.";
    }
    return "I declare that the information in Personal Info is accurate.";
  };

  const isPersonalTabValid = () => {
    return personalDeclared;
  };

  const validateAddressFields = () => {
    const errors: string[] = [];
    const { residential, mailing } = addressData;

    // Check residential address fields
    if (!residential.addressLine.trim()) errors.push("Residential Address Line");
    if (!residential.city.trim()) errors.push("Residential City");
    if (!residential.district.trim()) errors.push("Residential District");
    if (!residential.policeStation.trim()) errors.push("Residential Police Station");
    if (!residential.postOffice.trim()) errors.push("Residential Post Office");
    if (!residential.pinCode.trim()) errors.push("Residential Pin Code");

    // Check mailing address fields
    if (!mailing.addressLine.trim()) errors.push("Mailing Address Line");
    if (!mailing.city.trim()) errors.push("Mailing City");
    if (!mailing.district.trim()) errors.push("Mailing District");
    if (!mailing.policeStation.trim()) errors.push("Mailing Police Station");
    if (!mailing.postOffice.trim()) errors.push("Mailing Post Office");
    if (!mailing.pinCode.trim()) errors.push("Mailing Pin Code");

    setAddressErrors(errors);
    return errors.length === 0;
  };

  const handleAddressDeclarationChange = async (checked: boolean) => {
    // Prevent toggling if already declared

    // Always save data and flags if checked OR if already declared (for updates)
    if (correctionRequestId && (checked || correctionRequest?.addressInfoDeclaration)) {
      const isValid = validateAddressFields();
      if (isValid) {
        try {
          // If already declared, always set to true for updates
          setAddressDeclared(correctionRequest?.addressInfoDeclaration ? true : checked);

          // Always save data and flags, regardless of declaration status
          console.info("[CU-REG FRONTEND] Saving Address info data and flags", {
            correctionRequestId,
            addressData,
          });

          // Debug: Check what data is being sent
          console.info("[CU-REG FRONTEND] Debug - Address data being sent:", addressData);

          const updateData = {
            flags: {}, // Address doesn't have specific correction flags
            payload: {
              addressData: {
                residential: {
                  cityId: cities.find(
                    (c) => c.name.trim().toLowerCase() === addressData.residential.city.trim().toLowerCase(),
                  )?.id,
                  districtId: districts.find(
                    (d) => d.name.trim().toLowerCase() === addressData.residential.district.trim().toLowerCase(),
                  )?.id,
                  postofficeId: null,
                  otherPostoffice: addressData.residential.postOffice,
                  policeStationId: null,
                  otherPoliceStation: addressData.residential.policeStation,
                  addressLine: addressData.residential.addressLine,
                  pincode: addressData.residential.pinCode,
                  city: addressData.residential.city,
                  district: addressData.residential.district,
                  state: addressData.residential.state,
                  country: addressData.residential.country,
                },
                mailing: {
                  cityId: cities.find(
                    (c) => c.name.trim().toLowerCase() === addressData.mailing.city.trim().toLowerCase(),
                  )?.id,
                  districtId: mailingDistricts.find(
                    (d) => d.name.trim().toLowerCase() === addressData.mailing.district.trim().toLowerCase(),
                  )?.id,
                  postofficeId: null,
                  otherPostoffice: addressData.mailing.postOffice,
                  policeStationId: null,
                  otherPoliceStation: addressData.mailing.policeStation,
                  addressLine: addressData.mailing.addressLine,
                  pincode: addressData.mailing.pinCode,
                  city: addressData.mailing.city,
                  district: addressData.mailing.district,
                  state: addressData.mailing.state,
                  country: addressData.mailing.country,
                },
              },
            },
            // Only set declaration flag if it's a new declaration
            ...(checked && { addressInfoDeclaration: true }),
          };

          console.info("[CU-REG FRONTEND] Sending Address update data:", updateData);
          console.info("[CU-REG FRONTEND] Debug - Address flags being sent:", updateData.flags);
          console.info("[CU-REG FRONTEND] Debug - Address payload being sent:", updateData.payload);

          await updateCuCorrectionRequest(correctionRequestId, updateData as any);
          console.info("[CU-REG FRONTEND] Address declaration and data submitted");

          // Refresh local correction request to reflect saved declarations/flags
          try {
            const updated = await getCuCorrectionRequestById(correctionRequestId);
            setCorrectionRequest(updated);
            setCorrectionRequestStatus(updated.status ?? null);
            console.info("[CU-REG FRONTEND] Refreshed request after address declaration", {
              status: updated.status,
              addressInfoDeclaration: updated.addressInfoDeclaration,
            });
          } catch {}

          // Check if declaration was already completed
          const isAlreadyCompleted = correctionRequest?.addressInfoDeclaration;

          if (isAlreadyCompleted) {
            toast.success("Address Info Updated", {
              description: "Data saved successfully. Proceeding to Subjects Overview tab.",
              duration: 2000,
            });
          } else {
            toast.success("Address Info Declared", {
              description: "You can now proceed to the Subjects Overview tab.",
              duration: 3000,
            });
          }

          // Automatically switch to Subjects tab after a short delay
          console.info("[CU-REG FRONTEND] Setting timeout for navigation");
          setTimeout(() => {
            console.info("[CU-REG FRONTEND] Timeout executed - attempting to navigate to subjects tab");
            console.info("[CU-REG FRONTEND] Current addressDeclared state:", addressDeclared);
            console.info("[CU-REG FRONTEND] Current addressErrors:", addressErrors);
            console.info("[CU-REG FRONTEND] isAddressTabValid():", isAddressTabValid());
            console.info("[CU-REG FRONTEND] canNavigateToTab('subjects'):", canNavigateToTab("subjects"));

            try {
              // Force navigation even if validation fails (for testing)
              console.info("[CU-REG FRONTEND] Force navigating to subjects tab");
              console.info("[CU-REG FRONTEND] Current activeTab before navigation:", activeTab);

              // Use direct setActiveTab instead of handleTabChange to avoid conflicts
              console.info("[CU-REG FRONTEND] Calling setActiveTab('subjects') directly");
              setActiveTab("subjects");
              console.info("[CU-REG FRONTEND] setActiveTab called with 'subjects'");

              // Double-check navigation after a short delay
              setTimeout(() => {
                console.info("[CU-REG FRONTEND] Checking activeTab after navigation:", activeTab);
                if (activeTab !== "subjects") {
                  console.error("[CU-REG FRONTEND] Navigation failed, activeTab is still:", activeTab);
                  // Try direct state update as fallback
                  console.info("[CU-REG FRONTEND] Attempting direct state update");
                  setActiveTab("subjects");
                } else {
                  console.info("[CU-REG FRONTEND] Navigation successful, activeTab is now:", activeTab);
                }
              }, 100);

              console.info("[CU-REG FRONTEND] Navigation completed successfully");
            } catch (error) {
              console.error("[CU-REG FRONTEND] Navigation error:", error);
            }
          }, 1000);
        } catch (error: any) {
          console.error("[ADDRESS DECLARATION] Error:", error);
          toast.error("Failed to submit address info declaration");
          setAddressDeclared(false); // Revert the checkbox state
        }
      } else {
        setAddressDeclared(false); // Revert if validation fails
      }
    }
  };

  const isAddressTabValid = () => {
    return addressDeclared && addressErrors.length === 0;
  };

  const handleSubjectsDeclarationChange = async (checked: boolean) => {
    // Prevent toggling if already declared
    if (correctionRequest?.subjectsDeclaration && !checked) {
      console.info("[CU-REG FRONTEND] Declaration already completed, cannot toggle back to false");
      return;
    }

    // Always save data and flags if checked OR if already declared (for updates)
    if (correctionRequestId && (checked || correctionRequest?.subjectsDeclaration)) {
      try {
        // If already declared, always set to true for updates
        setSubjectsDeclared(correctionRequest?.subjectsDeclaration ? true : checked);

        // Always save data and flags, regardless of declaration status
        console.info("[CU-REG FRONTEND] Saving Subjects info data and flags", {
          correctionRequestId,
          subjectsFlag: correctionFlags.subjects,
        });

        const updateData = {
          flags: { subjects: correctionFlags.subjects },
          payload: {}, // Subjects don't have specific data to save
          // Only set declaration flag if it's a new declaration
          ...(checked && { subjectsDeclaration: true }),
        };

        console.info("[CU-REG FRONTEND] Sending Subjects update data:", updateData);
        console.info("[CU-REG FRONTEND] Debug - Subjects flags being sent:", updateData.flags);

        await updateCuCorrectionRequest(correctionRequestId, updateData as any);
        console.info("[CU-REG FRONTEND] Subjects declaration and data submitted");

        // Refresh local correction request to reflect saved declarations/flags
        try {
          const updated = await getCuCorrectionRequestById(correctionRequestId);
          setCorrectionRequest(updated);
          setCorrectionRequestStatus(updated.status ?? null);
          console.info("[CU-REG FRONTEND] Refreshed request after subjects declaration", {
            status: updated.status,
            subjectsDeclaration: updated.subjectsDeclaration,
          });
        } catch {}

        // Check if declaration was already completed
        const isAlreadyCompleted = correctionRequest?.subjectsDeclaration;

        if (isAlreadyCompleted) {
          toast.success("Subjects Overview Updated", {
            description: "Data saved successfully. Proceeding to Documents tab.",
            duration: 2000,
          });
        } else {
          toast.success("Subjects Overview Declared", {
            description: "You can now proceed to the Documents tab.",
            duration: 3000,
          });
        }

        // Automatically switch to Documents tab after a short delay
        setTimeout(() => {
          handleTabChange("documents");
        }, 1000);
      } catch (error: any) {
        console.error("[SUBJECTS DECLARATION] Error:", error);
        toast.error("Failed to submit subjects declaration");
        setSubjectsDeclared(false); // Revert the checkbox state
      }
    }
  };

  const isSubjectsTabValid = () => {
    return subjectsDeclared;
  };

  const handleFileUpload = (documentType: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleFilePreview = (file: File) => {
    const fileType = file.type.startsWith("image/") ? "image" : "pdf";
    setPreviewFile({ file, type: fileType });
    setPreviewDialogOpen(true);
  };

  const getFilePreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  const getRequiredDocuments = () => {
    const required = ["classXIIMarksheet", "fatherPhotoId", "motherPhotoId"];

    // Add Aadhaar or APAAR based on personal info
    if (personalInfo.aadhaarNumber && personalInfo.aadhaarNumber !== "XXXX XXXX XXXX") {
      required.push("aadhaarCard");
    } else {
      required.push("apaarIdCard");
    }

    // Add EWS certificate if EWS is Yes
    if (personalInfo.ews === "Yes") {
      required.push("ewsCertificate");
    }

    return required;
  };

  const getMissingDocuments = () => {
    const required = getRequiredDocuments();
    return required.filter((doc) => !documents[doc as keyof typeof documents]);
  };

  const handleDocumentsDeclarationChange = async (checked: boolean) => {
    // Prevent toggling if already declared
    if (correctionRequest?.documentsDeclaration && !checked) {
      console.info("[CU-REG FRONTEND] Declaration already completed, cannot toggle back to false");
      return;
    }

    // Always save data and flags if checked OR if already declared (for updates)
    if (correctionRequestId && (checked || correctionRequest?.documentsDeclaration)) {
      const missingDocs = getMissingDocuments();
      if (missingDocs.length === 0) {
        try {
          // If already declared, always set to true for updates
          setDocumentsConfirmed(correctionRequest?.documentsDeclaration ? true : checked);

          // Always save data and flags, regardless of declaration status
          console.info("[CU-REG FRONTEND] Saving Documents declaration", { correctionRequestId });

          const updateData = {
            flags: {}, // Documents don't have specific correction flags
            payload: {}, // Documents are handled separately via file uploads
            // Only set declaration flag if it's a new declaration
            ...(checked && { documentsDeclaration: true }),
          };

          console.info("[CU-REG FRONTEND] Sending Documents update data:", updateData);
          console.info("[CU-REG FRONTEND] Debug - Documents flags being sent:", updateData.flags);

          await updateCuCorrectionRequest(correctionRequestId, updateData as any);
          console.info("[CU-REG FRONTEND] Documents declaration submitted");

          // Refresh local correction request to reflect saved declarations/flags
          try {
            const updated = await getCuCorrectionRequestById(correctionRequestId);
            setCorrectionRequest(updated);
            setCorrectionRequestStatus(updated.status ?? null);
            console.info("[CU-REG FRONTEND] Refreshed request after documents declaration", {
              status: updated.status,
              documentsDeclaration: updated.documentsDeclaration,
            });
          } catch {}

          // Check if declaration was already completed
          const isAlreadyCompleted = correctionRequest?.documentsDeclaration;

          if (isAlreadyCompleted) {
            toast.success("Documents Updated", {
              description: "Data saved successfully. Opening Review & Confirm panel.",
              duration: 2000,
            });
          } else {
            toast.success("Documents Confirmed", {
              description: "You can now proceed to review and submit your application.",
              duration: 3000,
            });
          }

          // Auto-open Review & Confirm shortly after successful documents declaration
          setTimeout(() => {
            setShowReviewConfirm(true);
          }, 700);
        } catch (error: any) {
          console.error("[DOCUMENTS DECLARATION] Error:", error);
          toast.error("Failed to submit documents declaration");
          setDocumentsConfirmed(false); // Revert the checkbox state
        }
      } else {
        setDocumentsConfirmed(false); // Revert if documents are missing
      }
    }
  };

  const isDocumentsTabValid = () => {
    return documentsConfirmed && getMissingDocuments().length === 0;
  };

  // Removed saveCurrentTabData function to prevent navigation conflicts
  // Data saving is now handled by individual declaration handlers

  // Custom tab change handler
  const handleTabChange = async (newTab: string) => {
    console.info("[CU-REG FRONTEND] handleTabChange called with:", newTab);
    console.info("[CU-REG FRONTEND] Current activeTab:", activeTab);
    // Removed saveCurrentTabData() call to prevent navigation conflicts
    console.info("[CU-REG FRONTEND] Setting activeTab to:", newTab);
    setActiveTab(newTab);
  };

  const canReviewConfirm = () => {
    return isPersonalTabValid() && isAddressTabValid() && isSubjectsTabValid() && isDocumentsTabValid();
  };

  const handleReviewConfirm = () => {
    if (canReviewConfirm()) {
      setShowReviewConfirm(true);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!correctionRequestId || !finalDeclaration || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Collect all documents that need to be uploaded
      const documentsToUpload = [];

      if (documents.classXIIMarksheet) {
        documentsToUpload.push({
          documentName: documentNameMap.classXIIMarksheet,
          file: documents.classXIIMarksheet,
        });
      }
      if (documents.aadhaarCard) {
        documentsToUpload.push({
          documentName: documentNameMap.aadhaarCard,
          file: documents.aadhaarCard,
        });
      }
      if (documents.apaarIdCard) {
        documentsToUpload.push({
          documentName: documentNameMap.apaarIdCard,
          file: documents.apaarIdCard,
        });
      }
      if (documents.fatherPhotoId) {
        documentsToUpload.push({
          documentName: documentNameMap.fatherPhotoId,
          file: documents.fatherPhotoId,
        });
      }
      if (documents.motherPhotoId) {
        documentsToUpload.push({
          documentName: documentNameMap.motherPhotoId,
          file: documents.motherPhotoId,
        });
      }
      if (documents.ewsCertificate) {
        documentsToUpload.push({
          documentName: documentNameMap.ewsCertificate,
          file: documents.ewsCertificate,
        });
      }

      // Final submit - upload documents, generate CU registration application number, and update all fields
      // Send all the data to ensure everything is properly updated in the database
      const getIdByName = (arr: IdNameDto[], name?: string | null) => {
        if (!name) return undefined;
        const n = String(name).trim().toLowerCase();
        return arr.find((x) => x.name.trim().toLowerCase() === n)?.id;
      };
      const residentialCityId = getIdByName(cities, addressData.residential.city);
      const residentialDistrictId = getIdByName(districts, addressData.residential.district);
      const mailingCityId = getIdByName(cities, addressData.mailing.city);
      const mailingDistrictId = getIdByName(mailingDistricts, addressData.mailing.district);

      await submitCuRegistrationCorrectionRequestWithDocuments({
        correctionRequestId,
        flags: correctionFlags as unknown as Record<string, boolean>,
        payload: {
          personalInfo: {
            gender: personalInfo.gender,
            nationality: personalInfo.nationality,
            apaarId: cleanApaarId(personalInfo.apaarId),
            ews: personalInfo.ews,
          },
          addressData: {
            residential: {
              cityId: residentialCityId,
              districtId: residentialDistrictId,
              postofficeId: null,
              otherPostoffice: addressData.residential.postOffice,
              policeStationId: null,
              otherPoliceStation: addressData.residential.policeStation,
              addressLine: addressData.residential.addressLine,
              pincode: addressData.residential.pinCode,
              city: addressData.residential.city,
              district: addressData.residential.district,
              state: addressData.residential.state,
              country: addressData.residential.country,
            },
            mailing: {
              cityId: mailingCityId,
              districtId: mailingDistrictId,
              postofficeId: null,
              otherPostoffice: addressData.mailing.postOffice,
              policeStationId: null,
              otherPoliceStation: addressData.mailing.policeStation,
              addressLine: addressData.mailing.addressLine,
              pincode: addressData.mailing.pinCode,
              city: addressData.mailing.city,
              district: addressData.mailing.district,
              state: addressData.mailing.state,
              country: addressData.mailing.country,
            },
          },
        },
        documents: documentsToUpload,
      });

      toast.success("CU Registration Application Submitted Successfully!");
      setShowReviewConfirm(false);
      setIsSubmitted(true); // Mark form as submitted

      // Refresh the correction request data
      if (correctionRequestId) {
        const updatedRequest = await getCuCorrectionRequestById(correctionRequestId);
        setCorrectionRequest(updatedRequest);
        setCorrectionRequestStatus(updatedRequest.status ?? null);

        // Also refetch the uploaded documents
        try {
          console.info(
            `[CU-REG FRONTEND] Refetching documents after final submission for correction request: ${correctionRequestId}`,
          );
          const docs = await getCuRegistrationDocuments(correctionRequestId);
          setUploadedDocuments(docs || []);
          console.info(`[CU-REG FRONTEND] Refetched ${docs?.length || 0} documents after final submission`);
        } catch (error) {
          console.error(`[CU-REG FRONTEND] Error refetching documents after final submission:`, error);
        }
      }

      // Refresh profile data to get updated information
      try {
        console.info(`[CU-REG FRONTEND] Refreshing profile data after final submission`);
        await refetchProfile();
        console.info(`[CU-REG FRONTEND] Profile data refreshed successfully after final submission`);
      } catch (error) {
        console.error(`[CU-REG FRONTEND] Error refreshing profile data after final submission:`, error);
      }

      console.info(
        "Final submission completed successfully. CU Registration Application Number generated and documents uploaded.",
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit CU registration application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNavigateToTab = (tabName: string) => {
    // Allow navigation to all tabs when form is not editable (read-only mode)
    if (!isFormEditable()) {
      return true;
    }

    // Original logic for editable form
    switch (tabName) {
      case "personal":
        return true;
      case "address":
        return isPersonalTabValid();
      case "subjects":
        return isPersonalTabValid() && isAddressTabValid();
      case "documents":
        return isPersonalTabValid() && isAddressTabValid() && isSubjectsTabValid();
      default:
        return false;
    }
  };

  // Show loading state while profile data is being fetched
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 ${
        correctionRequest?.onlineRegistrationDone || correctionRequest?.physicalRegistrationDone
          ? "h-screen py-2"
          : "min-h-screen py-4 sm:py-8"
      }`}
    >
      <div
        className={`mx-auto px-3 sm:px-4 ${
          correctionRequest?.onlineRegistrationDone || correctionRequest?.physicalRegistrationDone
            ? "max-w-7xl h-full"
            : "max-w-6xl"
        }`}
      >
        {/* Header */}
        {/* Dynamic heading - Hide for final submission statuses */}
        {!(correctionRequest?.onlineRegistrationDone || correctionRequest?.physicalRegistrationDone) && (
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Admission & Registration Data</h1>
          </div>
        )}

        {/* Success Alert Message with Correction Flags - Show only when all declarations are completed and final submission is done */}

        {/* Status-based messages - Hide for final submission statuses */}
        {correctionRequestStatus &&
          correctionRequestStatus !== "PENDING" &&
          correctionRequestStatus !== "ONLINE_REGISTRATION_DONE" &&
          correctionRequestStatus !== "PHYSICAL_REGISTRATION_DONE" &&
          correctionRequestStatus !== "APPROVED" &&
          showStatusAlert &&
          correctionRequest?.personalInfoDeclaration &&
          correctionRequest?.addressInfoDeclaration &&
          correctionRequest?.subjectsDeclaration &&
          correctionRequest?.documentsDeclaration &&
          correctionRequest?.onlineRegistrationDone && (
            <div className="mb-8">
              <Card
                className={`border-2 ${
                  correctionRequestStatus === "REQUEST_CORRECTION"
                    ? "border-yellow-200 bg-yellow-50"
                    : correctionRequestStatus === "APPROVED"
                      ? "border-green-200 bg-green-50"
                      : correctionRequestStatus === "REJECTED"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          correctionRequestStatus === "REQUEST_CORRECTION"
                            ? "bg-yellow-100"
                            : correctionRequestStatus === "APPROVED"
                              ? "bg-green-100"
                              : correctionRequestStatus === "REJECTED"
                                ? "bg-red-100"
                                : "bg-blue-100"
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 ${
                            correctionRequestStatus === "REQUEST_CORRECTION"
                              ? "text-yellow-600"
                              : correctionRequestStatus === "APPROVED"
                                ? "text-green-600"
                                : correctionRequestStatus === "REJECTED"
                                  ? "text-red-600"
                                  : "text-blue-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {correctionRequestStatus === "APPROVED" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : correctionRequestStatus === "REJECTED" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-medium ${
                          correctionRequestStatus === "REQUEST_CORRECTION"
                            ? "text-yellow-800"
                            : correctionRequestStatus === "APPROVED"
                              ? "text-green-800"
                              : correctionRequestStatus === "REJECTED"
                                ? "text-red-800"
                                : "text-blue-800"
                        }`}
                      >
                        {correctionRequestStatus === "REQUEST_CORRECTION"
                          ? "Correction Request Submitted"
                          : correctionRequestStatus === "APPROVED"
                            ? "Request Approved"
                            : correctionRequestStatus === "REJECTED"
                              ? "Request Rejected"
                              : "Request Status: " + correctionRequestStatus}
                      </h3>
                      <p
                        className={`${
                          correctionRequestStatus === "REQUEST_CORRECTION"
                            ? "text-yellow-700"
                            : correctionRequestStatus === "APPROVED"
                              ? "text-green-700"
                              : correctionRequestStatus === "REJECTED"
                                ? "text-red-700"
                                : "text-blue-700"
                        }`}
                      >
                        {correctionRequestStatus === "REQUEST_CORRECTION"
                          ? "Your correction request has been submitted and is under review."
                          : correctionRequestStatus === "APPROVED"
                            ? "Your CU Registration correction request has been approved."
                            : correctionRequestStatus === "REJECTED"
                              ? "Your CU Registration correction request has been rejected. Please contact the administration."
                              : "Your request status is: " + correctionRequestStatus}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        {/* Main Form Card - Show tabs for editing, PDF preview for final submission */}
        <Card className="shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            {/* Show PDF Preview when online or physical registration is done */}
            {(() => {
              const shouldShowPdf =
                correctionRequest &&
                (correctionRequest.onlineRegistrationDone || correctionRequest.physicalRegistrationDone) &&
                correctionRequest?.cuRegistrationApplicationNumber;

              console.info(`[CU-REG FRONTEND] PDF Preview condition check:`, {
                correctionRequestStatus,
                onlineRegistrationDone: correctionRequest?.onlineRegistrationDone,
                physicalRegistrationDone: correctionRequest?.physicalRegistrationDone,
                hasApplicationNumber: !!correctionRequest?.cuRegistrationApplicationNumber,
                applicationNumber: correctionRequest?.cuRegistrationApplicationNumber,
                shouldShowPdf,
              });

              return shouldShowPdf;
            })() ? (
              <div className="p-4" style={{ height: "calc(100vh - 100px)" }}>
                {/* PDF Preview */}
                {pdfUrl && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-w-none h-full flex flex-col">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-800">CU Registration Form Preview</h4>
                    </div>
                    <div className="flex-1" style={{ height: "calc(100vh - 150px)", minHeight: "600px" }}>
                      <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                        className="w-full h-full border-0"
                        title="CU Registration Form Preview"
                        allow="fullscreen"
                      />
                    </div>
                  </div>
                )}

                {pdfLoading && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600 py-8">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading PDF...</span>
                  </div>
                )}
              </div>
            ) : !showReviewConfirm ? (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-white">
                  <div className="flex w-full overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => handleTabChange("personal")}
                      disabled={!canNavigateToTab("personal")}
                      className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "personal"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("personal") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="hidden sm:inline">Personal Info</span>
                      <span className="sm:hidden">Personal</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("address")}
                      disabled={!canNavigateToTab("address")}
                      className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "address"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("address") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="hidden sm:inline">Address Info</span>
                      <span className="sm:hidden">Address</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("subjects")}
                      disabled={!canNavigateToTab("subjects")}
                      className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "subjects"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("subjects") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="hidden sm:inline">Subjects Overview</span>
                      <span className="sm:hidden">Subjects</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("documents")}
                      disabled={!canNavigateToTab("documents")}
                      className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "documents"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("documents") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                            disabled={!isFieldEditable()}
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
                            disabled={!isFieldEditable()}
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">1.3 Gender</Label>
                          <div className="flex flex-col gap-2">
                            <div className={getReadOnlyDivStyle()}>{personalInfo.gender}</div>
                            {shouldShowCorrectionFlags() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.3 Request correction</span>
                                <Switch
                                  checked={correctionFlags.gender}
                                  onCheckedChange={() => handleCorrectionToggle("gender")}
                                  disabled={!isFieldEditable()}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Nationality */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">1.4 Nationality</Label>
                          <div className="flex flex-col gap-2">
                            <div className={getReadOnlyDivStyle()}>{personalInfo.nationality}</div>
                            {shouldShowCorrectionFlags() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.4 Request correction</span>
                                <Switch
                                  checked={correctionFlags.nationality}
                                  onCheckedChange={() => handleCorrectionToggle("nationality")}
                                  disabled={!isFieldEditable()}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* EWS */}
                        <div className="space-y-2">
                          <Label htmlFor="ews" className="text-sm font-medium text-gray-700">
                            1.5 Whether belong to EWS
                          </Label>
                          <Select
                            value={personalInfo.ews}
                            onValueChange={(value) => handlePersonalInfoChange("ews", value)}
                            disabled={!isFieldEditable()}
                          >
                            <SelectTrigger className="w-full border-gray-300">
                              <SelectValue placeholder="Select EWS status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Aadhaar Number */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">1.6 Aadhaar Number</Label>
                          <div className="flex flex-col gap-2">
                            <div className={getReadOnlyDivStyle()}>{personalInfo.aadhaarNumber}</div>
                            {shouldShowCorrectionFlags() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.6 Request correction</span>
                                <Switch
                                  checked={correctionFlags.aadhaarNumber}
                                  onCheckedChange={() => handleCorrectionToggle("aadhaarNumber")}
                                  disabled={!isFieldEditable()}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* APAAR ID */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                            1.7 APAAR (ABC) ID
                          </Label>
                          <div className="flex flex-col gap-2">
                            {(() => {
                              // Check if APAAR ID came from backend (not null/empty) vs user input
                              const hasBackendApaarId = student?.apaarId && student.apaarId.trim() !== "";

                              if (hasBackendApaarId) {
                                // If backend has APAAR ID, show as read-only with correction flag
                                return (
                                  <>
                                    <div className={getReadOnlyDivStyle()}>
                                      {personalInfo.apaarId || "Not provided"}
                                    </div>
                                    {shouldShowCorrectionFlags() && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">1.7 Request correction</span>
                                        <Switch
                                          checked={correctionFlags.apaarId}
                                          onCheckedChange={() => handleCorrectionToggle("apaarId")}
                                          disabled={!isFieldEditable()}
                                          className="data-[state=checked]:bg-blue-600"
                                        />
                                      </div>
                                    )}
                                  </>
                                );
                              } else {
                                // If backend has no APAAR ID, allow editing
                                return (
                                  <Input
                                    id="apaarId"
                                    value={personalInfo.apaarId}
                                    onChange={(e) => handleApaarIdChange(e.target.value)}
                                    placeholder="Enter APAAR ID (12 digits)"
                                    className="border-gray-300"
                                    disabled={!isFieldEditable()}
                                    maxLength={15} // 12 digits + 3 hyphens = 15 characters
                                  />
                                );
                              }
                            })()}
                          </div>
                        </div>

                        {/* Declaration - Always show, but disable when completed */}
                        <div className="pt-2 md:col-span-2">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="personalDeclaration"
                              checked={personalDeclared || correctionRequest?.personalInfoDeclaration}
                              onCheckedChange={handleDeclarationChange}
                              disabled={false}
                              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label
                              htmlFor="personalDeclaration"
                              className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                              onClick={() => {
                                console.info("[CU-REG FRONTEND] Declaration label clicked");
                                handleDeclarationChange(true);
                              }}
                            >
                              {getDeclarationText()}
                              {correctionRequest?.personalInfoDeclaration && (
                                <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                              )}
                            </Label>
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
                            {/* 1. Address Line */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-address" className="text-sm font-medium text-gray-700">
                                2.1 Address Line
                              </Label>
                              <Textarea
                                id="residential-address"
                                value={addressData.residential.addressLine}
                                onChange={(e) => handleAddressChange("residential", "addressLine", e.target.value)}
                                placeholder="Enter address line"
                                className="border-gray-300 min-h-[80px]"
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 2. Country */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-country" className="text-sm font-medium text-gray-700">
                                2.2 Country
                              </Label>
                              <Input
                                id="residential-country"
                                value={addressData.residential.country}
                                className={getReadOnlyFieldStyle()}
                                readOnly
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 3. State */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-state" className="text-sm font-medium text-gray-700">
                                2.3 State
                              </Label>
                              <Input
                                id="residential-state"
                                value={addressData.residential.state}
                                className={getReadOnlyFieldStyle()}
                                readOnly
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 4. District */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-district" className="text-sm font-medium text-gray-700">
                                2.4 District
                              </Label>
                              <Combobox
                                dataArr={districts.map((d) => ({ value: String(d.id), label: d.name }))}
                                value={(() => {
                                  const id = districts.find(
                                    (d) =>
                                      d.name.trim().toLowerCase() ===
                                      (addressData.residential.district || "").trim().toLowerCase(),
                                  )?.id;
                                  return id ? String(id) : "";
                                })()}
                                onChange={(val) => {
                                  const name = districts.find((d) => String(d.id) === val)?.name || "";
                                  handleAddressChange("residential", "district", name);
                                }}
                                placeholder={addressData.residential.district || "Select district"}
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 5. City */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-city" className="text-sm font-medium text-gray-700">
                                2.5 City
                              </Label>
                              <Combobox
                                dataArr={cities.map((c) => ({ value: String(c.id), label: c.name }))}
                                value={(() => {
                                  const id = cities.find(
                                    (c) =>
                                      c.name.trim().toLowerCase() ===
                                      (addressData.residential.city || "").trim().toLowerCase(),
                                  )?.id;
                                  return id ? String(id) : "";
                                })()}
                                onChange={(val) => {
                                  const name = cities.find((c) => String(c.id) === val)?.name || "";
                                  handleAddressChange("residential", "city", name);
                                }}
                                placeholder={addressData.residential.city || "Select city"}
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 6. Pin Code */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-pin" className="text-sm font-medium text-gray-700">
                                2.6 Pin Code
                              </Label>
                              <Input
                                id="residential-pin"
                                value={addressData.residential.pinCode}
                                onChange={(e) => handleAddressChange("residential", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                                className="border-gray-300"
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 7. Police Station */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-police" className="text-sm font-medium text-gray-700">
                                2.7 Police Station
                              </Label>
                              {isFieldEditable() ? (
                                <Input
                                  id="residential-police"
                                  value={addressData.residential.policeStation}
                                  onChange={(e) => handleAddressChange("residential", "policeStation", e.target.value)}
                                  placeholder="Enter police station name"
                                  className="border-gray-300"
                                  disabled={!isFieldEditable()}
                                />
                              ) : (
                                <div className={getReadOnlyDivStyle()}>
                                  {addressData.residential.policeStation || "Not provided"}
                                </div>
                              )}
                            </div>

                            {/* 8. Post Office */}
                            <div className="space-y-2">
                              <Label htmlFor="residential-post" className="text-sm font-medium text-gray-700">
                                2.8 Post Office
                              </Label>
                              {isFieldEditable() ? (
                                <Input
                                  id="residential-post"
                                  value={addressData.residential.postOffice}
                                  onChange={(e) => handleAddressChange("residential", "postOffice", e.target.value)}
                                  placeholder="Enter post office name"
                                  className="border-gray-300"
                                  disabled={!isFieldEditable()}
                                />
                              ) : (
                                <div className={getReadOnlyDivStyle()}>
                                  {addressData.residential.postOffice || "Not provided"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mailing Address */}
                        <div className="space-y-4 xl:pl-8">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900">Mailing Address</h3>
                          <div className="space-y-3">
                            {/* 1. Address Line */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-address" className="text-sm font-medium text-gray-700">
                                2.9 Address Line
                              </Label>
                              <Textarea
                                id="mailing-address"
                                value={addressData.mailing.addressLine}
                                onChange={(e) => handleAddressChange("mailing", "addressLine", e.target.value)}
                                placeholder="Enter address line"
                                className="border-gray-300 min-h-[80px]"
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 2. Country */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-country" className="text-sm font-medium text-gray-700">
                                2.10 Country
                              </Label>
                              <Input
                                id="mailing-country"
                                value={addressData.mailing.country}
                                className={getReadOnlyFieldStyle()}
                                readOnly
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 3. State */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-state" className="text-sm font-medium text-gray-700">
                                2.11 State
                              </Label>
                              <Input
                                id="mailing-state"
                                value={addressData.mailing.state}
                                className={getReadOnlyFieldStyle()}
                                readOnly
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 4. District */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-district" className="text-sm font-medium text-gray-700">
                                2.12 District
                              </Label>
                              <Combobox
                                dataArr={mailingDistricts.map((d) => ({ value: String(d.id), label: d.name }))}
                                value={(() => {
                                  const id = mailingDistricts.find(
                                    (d) =>
                                      d.name.trim().toLowerCase() ===
                                      (addressData.mailing.district || "").trim().toLowerCase(),
                                  )?.id;
                                  return id ? String(id) : "";
                                })()}
                                onChange={(val) => {
                                  const name = mailingDistricts.find((d) => String(d.id) === val)?.name || "";
                                  handleAddressChange("mailing", "district", name);
                                }}
                                placeholder={addressData.mailing.district || "Select district"}
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 5. City */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-city" className="text-sm font-medium text-gray-700">
                                2.13 City
                              </Label>
                              <Combobox
                                dataArr={cities.map((c) => ({ value: String(c.id), label: c.name }))}
                                value={(() => {
                                  const id = cities.find(
                                    (c) =>
                                      c.name.trim().toLowerCase() ===
                                      (addressData.mailing.city || "").trim().toLowerCase(),
                                  )?.id;
                                  return id ? String(id) : "";
                                })()}
                                onChange={(val) => {
                                  const name = cities.find((c) => String(c.id) === val)?.name || "";
                                  handleAddressChange("mailing", "city", name);
                                }}
                                placeholder={addressData.mailing.city || "Select city"}
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 6. Pin Code */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-pin" className="text-sm font-medium text-gray-700">
                                2.14 Pin Code
                              </Label>
                              <Input
                                id="mailing-pin"
                                value={addressData.mailing.pinCode}
                                onChange={(e) => handleAddressChange("mailing", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                                className="border-gray-300"
                                disabled={!isFieldEditable()}
                              />
                            </div>

                            {/* 7. Police Station */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-police" className="text-sm font-medium text-gray-700">
                                2.15 Police Station
                              </Label>
                              {isFieldEditable() ? (
                                <Input
                                  id="mailing-police"
                                  value={addressData.mailing.policeStation}
                                  onChange={(e) => handleAddressChange("mailing", "policeStation", e.target.value)}
                                  placeholder="Enter police station name"
                                  className="border-gray-300"
                                  disabled={!isFieldEditable()}
                                />
                              ) : (
                                <div className={getReadOnlyDivStyle()}>
                                  {addressData.mailing.policeStation || "Not provided"}
                                </div>
                              )}
                            </div>

                            {/* 8. Post Office */}
                            <div className="space-y-2">
                              <Label htmlFor="mailing-post" className="text-sm font-medium text-gray-700">
                                2.16 Post Office
                              </Label>
                              {isFieldEditable() ? (
                                <Input
                                  id="mailing-post"
                                  value={addressData.mailing.postOffice}
                                  onChange={(e) => handleAddressChange("mailing", "postOffice", e.target.value)}
                                  placeholder="Enter post office name"
                                  className="border-gray-300"
                                  disabled={!isFieldEditable()}
                                />
                              ) : (
                                <div className={getReadOnlyDivStyle()}>
                                  {addressData.mailing.postOffice || "Not provided"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Declaration and Error Messages */}
                      <div className="mt-6 space-y-3">
                        {/* Declaration - Always show, but disable when completed */}
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="addressDeclaration"
                            checked={addressDeclared || correctionRequest?.addressInfoDeclaration}
                            onCheckedChange={() => handleAddressDeclarationChange(true)}
                            disabled={false}
                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor="addressDeclaration"
                            className={`text-sm text-gray-700 leading-relaxed ${
                              isDeclarationInteractive() ? "cursor-pointer" : "cursor-default"
                            }`}
                            onClick={() => handleAddressDeclarationChange(true)}
                          >
                            I declare that the addresses provided are correct (all fields mandatory).
                            {correctionRequest?.addressInfoDeclaration && (
                              <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                            )}
                          </Label>
                        </div>

                        {/* Error Messages */}
                        {addressErrors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="text-sm text-red-800">
                              <p className="font-medium mb-1">Please complete all address fields. Missing:</p>
                              <p className="text-red-600">{addressErrors.join(", ")}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Subjects Overview Tab */}
                  <TabsContent value="subjects" className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">3.1 Subjects Overview (Semesters 1-4)</h2>
                        {shouldShowCorrectionFlags() && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Request correction</span>
                            <Switch
                              checked={correctionFlags.subjects}
                              onCheckedChange={() => handleCorrectionToggle("subjects")}
                              disabled={!isFieldEditable()}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                        )}
                      </div>

                      {/* Subjects Table */}
                      {subjectsLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="text-gray-500">Loading subjects...</div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto no-scrollbar">
                          <table className="min-w-[800px] w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 min-w-[120px]">
                                  Category
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                                  Sem 1
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                                  Sem 2
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                                  Sem 3
                                </th>
                                <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                                  Sem 4
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjectsData).map(([category, semesters]) => (
                                <tr key={category} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 min-w-[120px]">
                                    {category}
                                  </td>
                                  {Object.entries(semesters).map(([sem, value]) => {
                                    const mandatorySubjectsList =
                                      (mandatorySubjects[category as keyof typeof mandatorySubjects]?.[
                                        sem as keyof typeof semesters
                                      ] as string[]) || [];
                                    const studentSubjectsList = Array.isArray(value) ? value : value ? [value] : [];

                                    return (
                                      <td key={sem} className="border border-gray-300 px-2 py-2 min-w-[150px]">
                                        <div className="text-sm text-gray-900">
                                          {(() => {
                                            // Combine all subjects (mandatory + optional) into one array
                                            let allSubjects: Array<{ name: string; isMandatory: boolean }> = [];

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

                                            // For Minor category, if sem4 is empty and sem3 has subjects, duplicate sem3 subjects to sem4
                                            if (category === "Minor" && sem === "sem4" && allSubjects.length === 0) {
                                              const sem3Mandatory =
                                                (mandatorySubjects[category as keyof typeof mandatorySubjects]
                                                  ?.sem3 as string[]) || [];
                                              const sem3Student = Array.isArray(semesters.sem3)
                                                ? semesters.sem3
                                                : semesters.sem3
                                                  ? [semesters.sem3]
                                                  : [];

                                              // Add sem3 mandatory subjects
                                              sem3Mandatory.forEach((subject) => {
                                                allSubjects.push({ name: subject, isMandatory: true });
                                              });

                                              // Add sem3 student subjects (filter out duplicates)
                                              const filteredSem3Subjects = sem3Student.filter(
                                                (subject) => !sem3Mandatory.includes(subject),
                                              );
                                              filteredSem3Subjects.forEach((subject) => {
                                                allSubjects.push({ name: subject, isMandatory: false });
                                              });
                                            }

                                            // If no subjects, display Not Applicable
                                            if (allSubjects.length === 0) {
                                              return <span className="text-gray-500 italic">Not Applicable</span>;
                                            }

                                            // Render all subjects as ordered list
                                            return (
                                              <div className="text-sm text-gray-900">
                                                {allSubjects.map((subject, index) => (
                                                  <span key={`subject-${index}`}>
                                                    {subject.name}
                                                    {index < allSubjects.length - 1 && ", "}
                                                  </span>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Declaration - Always show, but disable when completed */}
                      <div className="mt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="subjectsDeclaration"
                            checked={subjectsDeclared || correctionRequest?.subjectsDeclaration}
                            onCheckedChange={() => handleSubjectsDeclarationChange(true)}
                            disabled={false}
                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor="subjectsDeclaration"
                            className={`text-sm text-gray-700 leading-relaxed ${
                              isDeclarationInteractive() ? "cursor-pointer" : "cursor-default"
                            }`}
                            onClick={() => handleSubjectsDeclarationChange(true)}
                          >
                            {correctionFlags.subjects
                              ? "I confirm the subjects listed above for Semesters 1-4. Note: Corrections will be reviewed by staff."
                              : "I confirm the subjects listed above for Semesters 1-4."}
                            {correctionRequest?.subjectsDeclaration && (
                              <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads</h2>

                      {/* Uploaded Documents Table */}
                      {uploadedDocuments.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-md font-medium text-gray-800 mb-3">Uploaded Documents</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Document Type
                                  </th>
                                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Uploaded
                                  </th>
                                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Size
                                  </th>
                                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadedDocuments.map((doc, index) => {
                                  // Use document name from the document object if available, otherwise fallback to ID mapping
                                  const documentType =
                                    doc.document?.name ||
                                    (() => {
                                      const documentTypeMap: Record<number, string> = {
                                        1: "Class XII Marksheet",
                                        2: "Aadhaar Card",
                                        3: "APAAR ID Card",
                                        4: "Father's Photo ID",
                                        5: "Mother's Photo ID",
                                        10: "EWS Certificate",
                                      };
                                      return documentTypeMap[doc.documentId] || `Document ${doc.documentId}`;
                                    })();
                                  const fileSizeMB = doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : "Unknown";

                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                        {documentType}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                            {doc.fileType?.startsWith("image/") ? (
                                              <img
                                                src={docPreviewUrls[doc.id] || toAbsoluteUrl(doc.documentUrl)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={async () => {
                                                  try {
                                                    const url = await getCuRegistrationDocumentSignedUrl(doc.id);
                                                    if (url) {
                                                      setDocPreviewUrls((prev) => ({ ...prev, [doc.id]: url }));
                                                    }
                                                  } catch {}
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs">
                                                PDF
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-600 truncate max-w-[200px]">
                                              {doc.fileName}
                                            </p>
                                            <button
                                              className="text-xs text-blue-600 hover:underline"
                                              onClick={async () => {
                                                try {
                                                  const url = await getCuRegistrationDocumentSignedUrl(doc.id);
                                                  window.open(url, "_blank");
                                                } catch {}
                                              }}
                                            >
                                              Open
                                            </button>
                                          </div>
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
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Show upload sections only if form is editable */}
                      {isFieldEditable() && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {/* Class XII Original Board Marksheet */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">
                                4.1 Class XII Original Board Marksheet
                              </Label>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Required
                              </Badge>
                            </div>
                            <div className="relative">
                              <Input
                                value={documents.classXIIMarksheet?.name || "No file chosen"}
                                readOnly
                                className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("classXIIMarksheet")?.click()}
                                className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                              >
                                Upload
                              </Button>
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                              <input
                                id="classXIIMarksheet"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  console.info(`[CU-REG FRONTEND] Class XII Marksheet file selected:`, {
                                    name: f?.name,
                                    size: f?.size,
                                    sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                    type: f?.type,
                                  });
                                  setDocuments((prev) => ({ ...prev, classXIIMarksheet: f }));
                                }}
                              />
                            </div>
                            {documents.classXIIMarksheet && (
                              <div className="mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {documents.classXIIMarksheet.type.startsWith("image/") ? (
                                      <img
                                        src={getFilePreviewUrl(documents.classXIIMarksheet)}
                                        alt="Preview"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleFilePreview(documents.classXIIMarksheet!)}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                        onClick={() => handleFilePreview(documents.classXIIMarksheet!)}
                                      >
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 truncate">{documents.classXIIMarksheet.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(documents.classXIIMarksheet.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Aadhaar Card */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">4.2 Aadhaar Card (if Indian)</Label>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Required
                              </Badge>
                            </div>
                            <div className="relative">
                              <Input
                                value={documents.aadhaarCard?.name || "No file chosen"}
                                readOnly
                                className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("aadhaarCard")?.click()}
                                className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                              >
                                Upload
                              </Button>
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                              <input
                                id="aadhaarCard"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  console.info(`[CU-REG FRONTEND] Aadhaar Card file selected:`, {
                                    name: f?.name,
                                    size: f?.size,
                                    sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                    type: f?.type,
                                  });
                                  setDocuments((prev) => ({ ...prev, aadhaarCard: f }));
                                }}
                              />
                            </div>
                            {documents.aadhaarCard && (
                              <div className="mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {documents.aadhaarCard.type.startsWith("image/") ? (
                                      <img
                                        src={getFilePreviewUrl(documents.aadhaarCard)}
                                        alt="Preview"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleFilePreview(documents.aadhaarCard!)}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                        onClick={() => handleFilePreview(documents.aadhaarCard!)}
                                      >
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 truncate">{documents.aadhaarCard.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(documents.aadhaarCard.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* APAAR ID Card */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">4.3 APAAR (ABC) ID Card</Label>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Required
                              </Badge>
                            </div>
                            <div className="relative">
                              <Input
                                value={documents.apaarIdCard?.name || "No file chosen"}
                                readOnly
                                className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("apaarIdCard")?.click()}
                                className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                              >
                                Upload
                              </Button>
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                              <input
                                id="apaarIdCard"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  console.info(`[CU-REG FRONTEND] APAAR ID Card file selected:`, {
                                    name: f?.name,
                                    size: f?.size,
                                    sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                    type: f?.type,
                                  });
                                  setDocuments((prev) => ({ ...prev, apaarIdCard: f }));
                                }}
                              />
                            </div>
                            {documents.apaarIdCard && (
                              <div className="mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {documents.apaarIdCard.type.startsWith("image/") ? (
                                      <img
                                        src={getFilePreviewUrl(documents.apaarIdCard)}
                                        alt="Preview"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleFilePreview(documents.apaarIdCard!)}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                        onClick={() => handleFilePreview(documents.apaarIdCard!)}
                                      >
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 truncate">{documents.apaarIdCard.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(documents.apaarIdCard.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Father's Government-issued Photo ID */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">
                                4.4 Father's Government-issued Photo ID
                              </Label>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Required
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Passport / Voter ID / Driving Licence (photo)</p>
                            <div className="relative">
                              <Input
                                value={documents.fatherPhotoId?.name || "No file chosen"}
                                readOnly
                                className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                              />
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("fatherPhotoId")?.click()}
                                className="absolute right-2 top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                              >
                                Upload
                              </Button>
                              <input
                                id="fatherPhotoId"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  console.info(`[CU-REG FRONTEND] Father Photo ID file selected:`, {
                                    name: f?.name,
                                    size: f?.size,
                                    sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                    type: f?.type,
                                  });
                                  setDocuments((prev) => ({ ...prev, fatherPhotoId: f }));
                                }}
                              />
                            </div>
                            {documents.fatherPhotoId && (
                              <div className="mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {documents.fatherPhotoId.type.startsWith("image/") ? (
                                      <img
                                        src={getFilePreviewUrl(documents.fatherPhotoId)}
                                        alt="Preview"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleFilePreview(documents.fatherPhotoId!)}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                        onClick={() => handleFilePreview(documents.fatherPhotoId!)}
                                      >
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 truncate">{documents.fatherPhotoId.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(documents.fatherPhotoId.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Mother's Government-issued Photo ID */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-700">
                                4.5 Mother's Government-issued Photo ID
                              </Label>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                Required
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Passport / Voter ID / Driving Licence (photo)</p>
                            <div className="relative">
                              <Input
                                value={documents.motherPhotoId?.name || "No file chosen"}
                                readOnly
                                className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                              />
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("motherPhotoId")?.click()}
                                className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                              >
                                Upload
                              </Button>
                              <input
                                id="motherPhotoId"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  console.info(`[CU-REG FRONTEND] Mother Photo ID file selected:`, {
                                    name: f?.name,
                                    size: f?.size,
                                    sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                    type: f?.type,
                                  });
                                  setDocuments((prev) => ({ ...prev, motherPhotoId: f }));
                                }}
                              />
                            </div>
                            {documents.motherPhotoId && (
                              <div className="mt-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {documents.motherPhotoId.type.startsWith("image/") ? (
                                      <img
                                        src={getFilePreviewUrl(documents.motherPhotoId)}
                                        alt="Preview"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleFilePreview(documents.motherPhotoId!)}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                        onClick={() => handleFilePreview(documents.motherPhotoId!)}
                                      >
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-600 truncate">{documents.motherPhotoId.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(documents.motherPhotoId.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* EWS Certificate - Only show if EWS is Yes */}
                          {personalInfo.ews === "Yes" && (
                            <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-medium text-gray-700">4.6 EWS Certificate</Label>
                                <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                  Required
                                </Badge>
                              </div>
                              <div className="relative">
                                <Input
                                  value={documents.ewsCertificate?.name || "No file chosen"}
                                  readOnly
                                  className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG / PNG</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById("ewsCertificate")?.click()}
                                  className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                                >
                                  Upload
                                </Button>
                                <input
                                  id="ewsCertificate"
                                  type="file"
                                  accept=".jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0] || null;
                                    console.info(`[CU-REG FRONTEND] EWS Certificate file selected:`, {
                                      name: f?.name,
                                      size: f?.size,
                                      sizeMB: f ? (f.size / 1024 / 1024).toFixed(2) : "N/A",
                                      type: f?.type,
                                    });
                                    setDocuments((prev) => ({ ...prev, ewsCertificate: f }));
                                  }}
                                />
                              </div>
                              {documents.ewsCertificate && (
                                <div className="mt-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                      {documents.ewsCertificate.type.startsWith("image/") ? (
                                        <img
                                          src={getFilePreviewUrl(documents.ewsCertificate)}
                                          alt="Preview"
                                          className="w-full h-full object-cover cursor-pointer"
                                          onClick={() => handleFilePreview(documents.ewsCertificate!)}
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                          onClick={() => handleFilePreview(documents.ewsCertificate!)}
                                        >
                                          PDF
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-600 truncate">{documents.ewsCertificate.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {(documents.ewsCertificate.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirmation Checkbox - Always show, but disable when completed */}
                      <div className="mt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="documentsConfirmation"
                            checked={documentsConfirmed || correctionRequest?.documentsDeclaration}
                            onCheckedChange={handleDocumentsDeclarationChange}
                            disabled={false}
                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor="documentsConfirmation"
                            className={`text-sm text-gray-700 leading-relaxed ${
                              isDeclarationInteractive() ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            I confirm that the uploaded documents correspond to the data provided.
                            {correctionRequest?.documentsDeclaration && (
                              <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                            )}
                          </Label>
                        </div>
                      </div>

                      {/* Error Messages - Only show if form is editable */}
                      {isFieldEditable() && getMissingDocuments().length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-red-600">
                            Missing required documents:{" "}
                            {getMissingDocuments()
                              .map((doc) => {
                                const names: { [key: string]: string } = {
                                  classXIIMarksheet: "Class XII marksheet",
                                  aadhaarCard: "Aadhaar Card",
                                  apaarIdCard: "APAAR ID Card",
                                  fatherPhotoId: "Father's government photo ID",
                                  motherPhotoId: "Mother's government photo ID",
                                  ewsCertificate: "EWS Certificate",
                                };
                                return names[doc] || doc;
                              })
                              .join(", ")}
                          </p>
                        </div>
                      )}

                      {/* Review & Confirm Button */}
                      {isFieldEditable() && (
                        <div className="mt-6">
                          <Button
                            onClick={handleReviewConfirm}
                            disabled={!canReviewConfirm()}
                            className={`w-full py-2 text-sm font-medium rounded-md border ${
                              canReviewConfirm()
                                ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                                : "bg-blue-200 text-white border-blue-200 cursor-not-allowed"
                            }`}
                          >
                            Review & Confirm
                          </Button>
                        </div>
                      )}

                      {/* Bottom Instruction - Only show if form is editable */}
                      {isFieldEditable() && (
                        <div className="mt-3">
                          <p className="text-sm text-red-600">
                            To Review & Confirm you must: declare Personal, Address and Subjects tabs and upload all
                            required documents.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile && (
              <div className="w-full">
                {previewFile.type === "image" ? (
                  <img
                    src={getFilePreviewUrl(previewFile.file)}
                    alt="File preview"
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="w-full h-[70vh] border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl text-red-600 mb-4">📄</div>
                      <p className="text-lg font-medium text-gray-700 mb-2">{previewFile.file.name}</p>
                      <p className="text-sm text-gray-500">{(previewFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-sm text-gray-500 mt-2">
                        PDF files cannot be previewed in the browser. Please download to view.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review & Confirm - Inline Panel */}
      {showReviewConfirm && (
        <div className="max-w-6xl mx-auto mt-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Flagged fields</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {correctionFlags.gender && <li>Gender</li>}
                    {correctionFlags.nationality && <li>Nationality</li>}
                    {correctionFlags.aadhaarNumber && <li>Aadhaar Number</li>}
                    {correctionFlags.apaarId && <li>APAAR (ABC) ID</li>}
                    {correctionFlags.subjects && <li>Subjects</li>}
                    {!Object.values(correctionFlags).some(Boolean) && <li>None</li>}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Documents</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border-b border-gray-200 px-3 py-2 text-left">Doc type</th>
                          <th className="border-b border-gray-200 px-3 py-2 text-left">Uploaded</th>
                          <th className="border-b border-gray-200 px-3 py-2 text-left">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "classXIIMarksheet", label: "Class XII Marksheet" },
                          { key: "aadhaarCard", label: "Aadhaar Card" },
                          { key: "apaarIdCard", label: "APAAR (ABC) ID Card" },
                          { key: "fatherPhotoId", label: "Father's Photo ID" },
                          { key: "motherPhotoId", label: "Mother's Photo ID" },
                          ...(personalInfo.ews === "Yes" ? [{ key: "ewsCertificate", label: "EWS Certificate" }] : []),
                        ].map((d: any) => {
                          const file: File | null = (documents as any)[d.key] || null;
                          const isImage = file && file.type.startsWith("image/");
                          const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-";
                          return (
                            <tr key={d.key} className="align-middle">
                              <td className="border-t border-gray-200 px-3 py-2">{d.label}</td>
                              <td className="border-t border-gray-200 px-3 py-2">
                                {file ? (
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
                                      {isImage ? (
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt="preview"
                                          className="w-8 h-8 object-cover"
                                        />
                                      ) : (
                                        <span className="text-lg">📄</span>
                                      )}
                                    </div>
                                    <span className="truncate max-w-[260px]" title={file.name}>
                                      {file.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Missing</span>
                                )}
                              </td>
                              <td className="border-t border-gray-200 px-3 py-2">{file ? size : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="finalDeclare"
                    checked={finalDeclaration}
                    onCheckedChange={(c: boolean) => setFinalDeclaration(c)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                  />
                  <Label htmlFor="finalDeclare" className="text-sm text-gray-700">
                    I confirm the above information and uploaded documents are correct.
                  </Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                    onClick={() => setShowReviewConfirm(false)}
                  >
                    Back
                  </Button>
                  <Button
                    className={`border ${finalDeclaration && !isSubmitting ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "bg-blue-200 text-white border-blue-200"}`}
                    disabled={!finalDeclaration || isSubmitting}
                    onClick={handleSubmitCorrection}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
