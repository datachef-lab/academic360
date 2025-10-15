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
import { fetchStudentSubjectSelections, fetchCurrentActiveSelections } from "@/services/subject-selection";
import {
  createCuCorrectionRequest,
  getStudentCuCorrectionRequests,
  getCuCorrectionRequestById,
  updateCuCorrectionRequest,
  getNextCuRegistrationApplicationNumber,
  submitCuRegistrationCorrectionRequestWithDocuments,
} from "@/services/cu-registration";
import type { CuRegistrationCorrectionRequestDto } from "@repo/db/dtos/admissions";
import {
  uploadCuRegistrationDocument,
  getCuRegistrationDocuments,
  getCuRegistrationDocumentSignedUrl,
} from "@/services/cu-registration-documents";
import { fetchPoliceStations, fetchPostOffices, fetchCities, fetchDistricts, IdNameDto } from "@/services/resources";
import { useRouter } from "next/navigation";

interface CorrectionFlags {
  gender: boolean;
  nationality: boolean;
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
  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
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
  // Track selected IDs for police station and post office while showing names from "other" fields by default
  const [residentialPoliceStationId, setResidentialPoliceStationId] = useState<number | null>(null);
  const [residentialPostOfficeId, setResidentialPostOfficeId] = useState<number | null>(null);
  const [mailingPoliceStationId, setMailingPoliceStationId] = useState<number | null>(null);
  const [mailingPostOfficeId, setMailingPostOfficeId] = useState<number | null>(null);
  const [policeStations, setPoliceStations] = useState<IdNameDto[]>([]);
  const [postOffices, setPostOffices] = useState<IdNameDto[]>([]);
  const [cities, setCities] = useState<IdNameDto[]>([]);
  const [districts, setDistricts] = useState<IdNameDto[]>([]);
  const [mailingDistricts, setMailingDistricts] = useState<IdNameDto[]>([]);
  const [addressDeclared, setAddressDeclared] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);

  // If NODE_ENV is production, then redirect back and dont render
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.push("/");
    }
  }, []);

  // When prefilled, set dropdown IDs from other fields (these are display names in DB)
  useEffect(() => {
    // This assumes we will later map names -> ids via dropdown lists
    setResidentialPoliceStationId((prev) => prev ?? null);
    setResidentialPostOfficeId((prev) => prev ?? null);
    setMailingPoliceStationId((prev) => prev ?? null);
    setMailingPostOfficeId((prev) => prev ?? null);
  }, [
    addressData.residential.policeStation,
    addressData.residential.postOffice,
    addressData.mailing.policeStation,
    addressData.mailing.postOffice,
  ]);

  // Load dropdown options (PS/PO) based on state and preselect by name if possible
  useEffect(() => {
    (async () => {
      try {
        const stateName = addressData?.residential?.state || addressData?.mailing?.state || "";
        const [ps, po] = await Promise.all([
          fetchPoliceStations({ stateName }).catch(() => []),
          fetchPostOffices({ stateName }).catch(() => []),
        ]);
        setPoliceStations(ps || []);
        setPostOffices(po || []);
        // Also load cities and districts for state filter
        const [cityList] = await Promise.all([fetchCities().catch(() => [])]);
        setCities(cityList || []);

        const matchByName = (arr: IdNameDto[], name?: string | null) => {
          if (!name) return null;
          const n = String(name).trim().toLowerCase();
          const found = arr.find((x) => x.name.trim().toLowerCase() === n);
          return found?.id ?? null;
        };

        setResidentialPoliceStationId((prev) => prev ?? matchByName(ps, addressData.residential.policeStation));
        setResidentialPostOfficeId((prev) => prev ?? matchByName(po, addressData.residential.postOffice));
        setMailingPoliceStationId((prev) => prev ?? matchByName(ps, addressData.mailing.policeStation));
        setMailingPostOfficeId((prev) => prev ?? matchByName(po, addressData.mailing.postOffice));
      } catch {}
    })();
  }, [addressData.residential.state, addressData.mailing.state]);

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
  const [subjectsData, setSubjectsData] = useState({
    DSCC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    Minor: { sem1: "", sem2: "", sem3: "", sem4: "" },
    IDC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    SEC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    AEC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    CVAC: { sem1: "", sem2: "", sem3: "", sem4: "" },
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
        aadhaarNumber: personalDetails?.aadhaarCardNumber || "XXXX XXXX XXXX",
        // APAAR (ABC) ID may be stored as apaarId, abcId, or apprid
        apaarId:
          (student?.apaarId && student.apaarId.trim()) ||
          (student?.abcId && student.abcId.trim()) ||
          (student?.apprid && String(student.apprid).trim()) ||
          prev.apaarId ||
          "",
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
          aadhaarNumber: pd.aadhaarCardNumber || prev.aadhaarNumber,
        }));
      })
      .catch(() => undefined);
  }, [student?.id]);

  // Load subject overview from backend selections
  useEffect(() => {
    if (!student?.id) return;
    // Use current active selections endpoint for authoritative data
    fetchCurrentActiveSelections(Number(student.id))
      .then((rows: any[]) => {
        const next: any = { ...subjectsData };

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
          if (/DSCC/i.test(label)) return "DSCC" as any;
          if (/Minor/i.test(label)) return "Minor" as any;
          if (/IDC/i.test(label)) return "IDC" as any;
          if (/SEC/i.test(label)) return "SEC" as any;
          if (/AEC/i.test(label)) return "AEC" as any;
          if (/CVAC/i.test(label)) return "CVAC" as any;
          return undefined;
        };

        rows.forEach((r: any) => {
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
              next[key][`sem${s}`] = name;
            }
          });
        });
        setSubjectsData(next);
      })
      .catch(() => {
        // Fallback to broader service if needed
        fetchStudentSubjectSelections(Number(student.id))
          .then(() => undefined)
          .catch(() => undefined);
      });
  }, [student?.id]);

  // Ensure a correction request exists (create draft if none)
  const [correctionRequest, setCorrectionRequest] = useState<CuRegistrationCorrectionRequestDto | null>(null);
  const [correctionRequestId, setCorrectionRequestId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showStatusAlert, setShowStatusAlert] = useState<boolean>(true);
  const [correctionRequestStatus, setCorrectionRequestStatus] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<Record<number, string>>({});

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

          // Update correction flags from the existing request
          setCorrectionFlags({
            gender: existing.genderCorrectionRequest ?? false,
            nationality: existing.nationalityCorrectionRequest ?? false,
            apaarId: existing.apaarIdCorrectionRequest ?? false,
            subjects: existing.subjectsCorrectionRequest ?? false,
          });

          // Set uploaded documents from the existing request
          if (existing.documents) {
            setUploadedDocuments(existing.documents);
          }
        } else {
          console.info(`[CU-REG FRONTEND] No existing correction request, creating new one for student: ${student.id}`);
          let cuRegAppNo = "";
          try {
            cuRegAppNo = await getNextCuRegistrationApplicationNumber();
            console.info(`[CU-REG FRONTEND] Got application number: ${cuRegAppNo}`);
          } catch (error) {
            console.error(`[CU-REG FRONTEND] Error getting application number:`, error);
          }
          const created = await createCuCorrectionRequest({
            studentId: Number(student.id),
            flags: correctionFlags as unknown as Record<string, boolean>,
            payload: {},
            cuRegistrationApplicationNumber: cuRegAppNo || undefined,
          });
          console.info(`[CU-REG FRONTEND] Created new correction request: ${created.id}`);
          setCorrectionRequest(created);
          setCorrectionRequestId(created.id ?? null);
          setCorrectionRequestStatus(created.status ?? null);
        }
      } catch (error) {
        console.error("[CU-REG FRONTEND] Error handling CU correction request:", error);
      }
    })();
  }, [student?.id]);

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
    return !correctionRequestStatus || correctionRequestStatus === "PENDING";
  };

  // Helper function to determine if individual fields are editable
  const isFieldEditable = () => {
    return !correctionRequestStatus || correctionRequestStatus === "PENDING";
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

  const handleCorrectionToggle = (field: keyof CorrectionFlags) => {
    setCorrectionFlags((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
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

  const handleDeclarationChange = (checked: boolean) => {
    setPersonalDeclared(checked);

    if (checked) {
      toast.success("Personal Info Declared", {
        description: "You can now proceed to the Address Info tab.",
        duration: 3000,
      });

      // Automatically switch to Address tab after a short delay
      setTimeout(() => {
        setActiveTab("address");
      }, 1000);
    }
  };

  const getDeclarationText = () => {
    const hasCorrections = Object.values(correctionFlags).some((flag) => flag);
    if (hasCorrections) {
      return "I declare that the information in Personal Info is accurate. Note: Corrections will be reviewed by staff.";
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

  const handleAddressDeclarationChange = (checked: boolean) => {
    setAddressDeclared(checked);

    if (checked) {
      const isValid = validateAddressFields();
      if (isValid) {
        toast.success("Address Info Declared", {
          description: "You can now proceed to the Subjects Overview tab.",
          duration: 3000,
        });

        // Automatically switch to Subjects tab after a short delay
        setTimeout(() => {
          setActiveTab("subjects");
        }, 1000);
      }
    }
  };

  const isAddressTabValid = () => {
    return addressDeclared && addressErrors.length === 0;
  };

  const handleSubjectChange = (category: string, semester: string, value: string) => {
    setSubjectsData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [semester]: value,
      },
    }));
  };

  const handleSubjectsDeclarationChange = (checked: boolean) => {
    setSubjectsDeclared(checked);

    if (checked) {
      toast.success("Subjects Overview Declared", {
        description: "You can now proceed to the Documents tab.",
        duration: 3000,
      });

      // Automatically switch to Documents tab after a short delay
      setTimeout(() => {
        setActiveTab("documents");
      }, 1000);
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

  const isDocumentsTabValid = () => {
    return documentsConfirmed && getMissingDocuments().length === 0;
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
    if (!correctionRequestId || !finalDeclaration) return;
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

      // Look up IDs for address fields (case/whitespace-insensitive)
      const getIdByName = (arr: IdNameDto[], name?: string | null) => {
        if (!name) return undefined;
        const n = String(name).trim().toLowerCase();
        return arr.find((x) => x.name.trim().toLowerCase() === n)?.id;
      };
      const residentialCityId = getIdByName(cities, addressData.residential.city);
      const residentialDistrictId = getIdByName(districts, addressData.residential.district);
      const mailingCityId = getIdByName(cities, addressData.mailing.city);
      const mailingDistrictId = getIdByName(mailingDistricts, addressData.mailing.district);

      // Always use batch submit approach since correction request already exists in DB
      // This ensures documents are uploaded and database fields are updated consistently
      await submitCuRegistrationCorrectionRequestWithDocuments({
        correctionRequestId,
        flags: correctionFlags as unknown as Record<string, boolean>,
        payload: {
          personalInfo: {
            gender: personalInfo.gender,
            nationality: personalInfo.nationality, // Send nationality name, backend will look up ID
            apaarId: personalInfo.apaarId,
            ews: personalInfo.ews, // EWS status is editable by students
          },
          addressData: {
            residential: {
              cityId: residentialCityId,
              districtId: residentialDistrictId,
              // stateId and countryId can be looked up by backend from names
              postofficeId: residentialPostOfficeId,
              otherPostoffice: addressData.residential.postOffice,
              policeStationId: residentialPoliceStationId,
              otherPoliceStation: addressData.residential.policeStation,
              addressLine: addressData.residential.addressLine,
              pincode: addressData.residential.pinCode,
              // Include names for backend lookup
              city: addressData.residential.city,
              district: addressData.residential.district,
              state: addressData.residential.state,
              country: addressData.residential.country,
            },
            mailing: {
              cityId: mailingCityId,
              districtId: mailingDistrictId,
              // stateId and countryId can be looked up by backend from names
              postofficeId: mailingPostOfficeId,
              otherPostoffice: addressData.mailing.postOffice,
              policeStationId: mailingPoliceStationId,
              otherPoliceStation: addressData.mailing.policeStation,
              addressLine: addressData.mailing.addressLine,
              pincode: addressData.mailing.pinCode,
              // Include names for backend lookup
              city: addressData.mailing.city,
              district: addressData.mailing.district,
              state: addressData.mailing.state,
              country: addressData.mailing.country,
            },
          },
          // Note: Subject selections are not updated by students in CU registration
          // Subject changes require admin approval and should be handled separately
        },
        documents: documentsToUpload, // This will be empty array if no documents, which is fine
      });

      toast.success("Submitted correction request successfully");
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
            `[CU-REG FRONTEND] Refetching documents after submission for correction request: ${correctionRequestId}`,
          );
          const docs = await getCuRegistrationDocuments(correctionRequestId);
          setUploadedDocuments(docs || []);
          console.info(`[CU-REG FRONTEND] Refetched ${docs?.length || 0} documents after submission`);
          console.info(
            `[CU-REG FRONTEND] Document URLs:`,
            docs?.map((doc) => ({ fileName: doc.fileName, documentUrl: doc.documentUrl })),
          );
          console.info(
            `[CU-REG FRONTEND] Document structure:`,
            docs?.map((doc) => ({
              documentId: doc.documentId,
              documentName: doc.document?.name,
              fileName: doc.fileName,
            })),
          );
        } catch (error) {
          console.error(`[CU-REG FRONTEND] Error refetching documents after submission:`, error);
        }
      }

      // Refresh profile data to get updated address information
      try {
        console.info(`[CU-REG FRONTEND] Refreshing profile data to get updated addresses`);
        await refetchProfile();
        console.info(`[CU-REG FRONTEND] Profile data refreshed successfully`);
      } catch (error) {
        console.error(`[CU-REG FRONTEND] Error refreshing profile data:`, error);
      }

      console.info("Submission completed successfully. Profile data refreshed to show updated addresses.");

      // Debug: Log the current address data to see what was submitted
      console.info("Current address data after submission:", {
        residential: {
          policeStation: addressData.residential.policeStation,
          postOffice: addressData.residential.postOffice,
          policeStationId: residentialPoliceStationId,
          postOfficeId: residentialPostOfficeId,
        },
        mailing: {
          policeStation: addressData.mailing.policeStation,
          postOffice: addressData.mailing.postOffice,
          policeStationId: mailingPoliceStationId,
          postOfficeId: mailingPostOfficeId,
        },
      });

      // Debug: Log the full payload being sent to backend
      console.info("Full payload being sent to backend:", {
        personalInfo: {
          gender: personalInfo.gender,
          nationality: personalInfo.nationality,
          apaarId: personalInfo.apaarId,
          ews: personalInfo.ews,
        },
        addressData: {
          residential: {
            cityId: residentialCityId,
            districtId: residentialDistrictId,
            postofficeId: residentialPostOfficeId,
            otherPostoffice: addressData.residential.postOffice,
            policeStationId: residentialPoliceStationId,
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
            postofficeId: mailingPostOfficeId,
            otherPostoffice: addressData.mailing.postOffice,
            policeStationId: mailingPoliceStationId,
            otherPoliceStation: addressData.mailing.policeStation,
            addressLine: addressData.mailing.addressLine,
            pincode: addressData.mailing.pinCode,
            city: addressData.mailing.city,
            district: addressData.mailing.district,
            state: addressData.mailing.state,
            country: addressData.mailing.country,
          },
        },
      });

      // Debug: Log the payload that was sent to backend
      console.info("Payload sent to backend:", {
        personalInfo: {
          gender: personalInfo.gender,
          nationality: personalInfo.nationality,
          apaarId: personalInfo.apaarId,
          ews: personalInfo.ews,
        },
        addressData: {
          residential: {
            cityId: residentialCityId,
            districtId: residentialDistrictId,
            postofficeId: residentialPostOfficeId,
            otherPostoffice: addressData.residential.postOffice,
            policeStationId: residentialPoliceStationId,
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
            postofficeId: mailingPostOfficeId,
            otherPostoffice: addressData.mailing.postOffice,
            policeStationId: mailingPoliceStationId,
            otherPoliceStation: addressData.mailing.policeStation,
            addressLine: addressData.mailing.addressLine,
            pincode: addressData.mailing.pinCode,
            city: addressData.mailing.city,
            district: addressData.mailing.district,
            state: addressData.mailing.state,
            country: addressData.mailing.country,
          },
        },
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit correction request");
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Calcutta University - Registration</h1>
        </div>

        {/* Success Alert Message with Correction Flags - Show only when status is present and not PENDING */}
        {correctionRequest && correctionRequestStatus && correctionRequestStatus !== "PENDING" && (
          <div className="mb-8">
            <Card
              className={`border-2 ${
                correctionRequestStatus === "REQUEST_CORRECTION"
                  ? "border-green-200 bg-green-50"
                  : correctionRequestStatus === "APPROVED"
                    ? "border-green-300 bg-green-100"
                    : correctionRequestStatus === "REJECTED"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        correctionRequestStatus === "REQUEST_CORRECTION"
                          ? "bg-green-100"
                          : correctionRequestStatus === "APPROVED"
                            ? "bg-green-200"
                            : correctionRequestStatus === "REJECTED"
                              ? "bg-red-100"
                              : "bg-blue-100"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${
                          correctionRequestStatus === "REQUEST_CORRECTION"
                            ? "text-green-600"
                            : correctionRequestStatus === "APPROVED"
                              ? "text-green-700"
                              : correctionRequestStatus === "REJECTED"
                                ? "text-red-600"
                                : "text-blue-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-green-800">
                      {correctionRequestStatus === "REQUEST_CORRECTION"
                        ? "CU Registration - Correction Request Submitted!"
                        : correctionRequestStatus === "APPROVED" ||
                            (correctionRequest &&
                              !correctionRequest.genderCorrectionRequest &&
                              !correctionRequest.nationalityCorrectionRequest &&
                              !correctionRequest.apaarIdCorrectionRequest &&
                              !correctionRequest.subjectsCorrectionRequest)
                          ? "Congratulations! CU Registration Successfully Submitted!"
                          : "CU Registration Successfully Submitted!"}
                    </h3>
                    <p className="text-green-700 mb-2 text-sm">
                      Application Number: {correctionRequest?.cuRegistrationApplicationNumber} | Status:{" "}
                      {correctionRequestStatus === "REQUEST_CORRECTION"
                        ? "Correction Request Submitted"
                        : correctionRequestStatus === "APPROVED"
                          ? "Approved"
                          : correctionRequestStatus === "REJECTED"
                            ? "Rejected"
                            : "Submitted"}
                    </p>

                    {/* Display Correction Flags Permanently */}
                    {correctionRequest &&
                      (correctionRequest.genderCorrectionRequest ||
                        correctionRequest.nationalityCorrectionRequest ||
                        correctionRequest.apaarIdCorrectionRequest ||
                        correctionRequest.subjectsCorrectionRequest) && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 bg-green-200 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-green-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-green-800">Correction Requests Submitted:</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {correctionRequest.genderCorrectionRequest && (
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                <span className="text-xs text-green-700">Gender</span>
                              </div>
                            )}
                            {correctionRequest.nationalityCorrectionRequest && (
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                <span className="text-xs text-green-700">Nationality</span>
                              </div>
                            )}
                            {correctionRequest.apaarIdCorrectionRequest && (
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                <span className="text-xs text-green-700">APAAR ID</span>
                              </div>
                            )}
                            {correctionRequest.subjectsCorrectionRequest && (
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                <span className="text-xs text-green-700">Subject Selections</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-green-600">
                            These corrections will be reviewed by the administration team.
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status-based messages */}
        {correctionRequestStatus && correctionRequestStatus !== "PENDING" && showStatusAlert && (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

        {/* Main Form Card - Always show, but make read-only when not editable */}
        <Card className="shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            {!showReviewConfirm && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-white">
                  <div className="flex w-full">
                    <button
                      onClick={() => setActiveTab("personal")}
                      disabled={!canNavigateToTab("personal")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "personal"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("personal") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Personal Info
                    </button>
                    <button
                      onClick={() => setActiveTab("address")}
                      disabled={!canNavigateToTab("address")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "address"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("address") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Address Info
                    </button>
                    <button
                      onClick={() => setActiveTab("subjects")}
                      disabled={!canNavigateToTab("subjects")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "subjects"
                          ? "text-blue-600 border-blue-600 bg-transparent"
                          : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                      } ${!canNavigateToTab("subjects") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Subjects Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("documents")}
                      disabled={!canNavigateToTab("documents")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
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
                <div className="p-6 bg-white">
                  {/* Personal Info Tab */}
                  <TabsContent value="personal" className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Name</h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {isFieldEditable() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.3 Request correction</span>
                                <Switch
                                  checked={correctionFlags.gender}
                                  onCheckedChange={() => handleCorrectionToggle("gender")}
                                  disabled={!isFieldEditable()}
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
                            {isFieldEditable() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.4 Request correction</span>
                                <Switch
                                  checked={correctionFlags.nationality}
                                  onCheckedChange={() => handleCorrectionToggle("nationality")}
                                  disabled={!isFieldEditable()}
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
                          <Label htmlFor="aadhaarNumber" className="text-sm font-medium text-gray-700">
                            1.6 Aadhaar Number
                          </Label>
                          <Input
                            id="aadhaarNumber"
                            value={personalInfo.aadhaarNumber}
                            className={getReadOnlyFieldStyle()}
                            readOnly
                          />
                        </div>

                        {/* APAAR ID */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                            1.7 APAAR (ABC) ID
                          </Label>
                          <div className="flex flex-col gap-2">
                            <div className={getReadOnlyDivStyle()}>{personalInfo.apaarId || "Not provided"}</div>
                            {isFieldEditable() && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">1.7 Request correction</span>
                                <Switch
                                  checked={correctionFlags.apaarId}
                                  onCheckedChange={() => handleCorrectionToggle("apaarId")}
                                  disabled={!isFieldEditable()}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Declaration */}
                        {isFieldEditable() && (
                          <div className="pt-2 md:col-span-2">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id="personalDeclaration"
                                checked={personalDeclared}
                                onCheckedChange={handleDeclarationChange}
                                className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                              />
                              <Label
                                htmlFor="personalDeclaration"
                                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                              >
                                {getDeclarationText()}
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Address Info Tab */}
                  <TabsContent value="address" className="space-y-6">
                    <div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Residential Address */}
                        <div className="space-y-4 lg:pr-8 lg:border-r lg:border-gray-200">
                          <h3 className="text-base font-medium text-gray-900">Residential Address</h3>
                          <div className="space-y-3">
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

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="residential-city" className="text-sm font-medium text-gray-700">
                                  2.2 City
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
                              <div className="space-y-2">
                                <Label htmlFor="residential-district" className="text-sm font-medium text-gray-700">
                                  2.3 District
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="residential-police" className="text-sm font-medium text-gray-700">
                                  2.4 Police Station
                                </Label>
                                {isFieldEditable() ? (
                                  <Combobox
                                    dataArr={policeStations.map((p) => ({ value: String(p.id), label: p.name }))}
                                    value={residentialPoliceStationId ? String(residentialPoliceStationId) : ""}
                                    onChange={(val) => {
                                      const id = val ? Number(val) : null;
                                      setResidentialPoliceStationId(id);
                                      const name = policeStations.find((p) => String(p.id) === val)?.name || "";
                                      handleAddressChange("residential", "policeStation", name);
                                    }}
                                    placeholder={addressData.residential.policeStation || "Select police station"}
                                  />
                                ) : (
                                  <div className={getReadOnlyDivStyle()}>
                                    {addressData.residential.policeStation || "Not provided"}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="residential-post" className="text-sm font-medium text-gray-700">
                                  2.5 Post Office
                                </Label>
                                {isFieldEditable() ? (
                                  <Combobox
                                    dataArr={postOffices.map((p) => ({ value: String(p.id), label: p.name }))}
                                    value={residentialPostOfficeId ? String(residentialPostOfficeId) : ""}
                                    onChange={(val) => {
                                      const id = val ? Number(val) : null;
                                      setResidentialPostOfficeId(id);
                                      const name = postOffices.find((p) => String(p.id) === val)?.name || "";
                                      handleAddressChange("residential", "postOffice", name);
                                    }}
                                    placeholder={addressData.residential.postOffice || "Select post office"}
                                  />
                                ) : (
                                  <div className={getReadOnlyDivStyle()}>
                                    {addressData.residential.postOffice || "Not provided"}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="residential-state" className="text-sm font-medium text-gray-700">
                                  2.6 State
                                </Label>
                                <Input
                                  id="residential-state"
                                  value={addressData.residential.state}
                                  className={getReadOnlyFieldStyle()}
                                  readOnly
                                  disabled={!isFieldEditable()}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="residential-country" className="text-sm font-medium text-gray-700">
                                  2.7 Country
                                </Label>
                                <Input
                                  id="residential-country"
                                  value={addressData.residential.country}
                                  className={getReadOnlyFieldStyle()}
                                  readOnly
                                  disabled={!isFieldEditable()}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="residential-pin" className="text-sm font-medium text-gray-700">
                                  2.8 Pin Code
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
                            </div>
                          </div>
                        </div>

                        {/* Mailing Address */}
                        <div className="space-y-4 lg:pl-8">
                          <h3 className="text-base font-medium text-gray-900">Mailing Address</h3>
                          <div className="space-y-3">
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

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="mailing-city" className="text-sm font-medium text-gray-700">
                                  2.10 City
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
                              <div className="space-y-2">
                                <Label htmlFor="mailing-district" className="text-sm font-medium text-gray-700">
                                  2.11 District
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="mailing-police" className="text-sm font-medium text-gray-700">
                                  2.12 Police Station
                                </Label>
                                {isFieldEditable() ? (
                                  <Combobox
                                    dataArr={policeStations.map((p) => ({ value: String(p.id), label: p.name }))}
                                    value={mailingPoliceStationId ? String(mailingPoliceStationId) : ""}
                                    onChange={(val) => {
                                      const id = val ? Number(val) : null;
                                      setMailingPoliceStationId(id);
                                      const name = policeStations.find((p) => String(p.id) === val)?.name || "";
                                      handleAddressChange("mailing", "policeStation", name);
                                    }}
                                    placeholder={addressData.mailing.policeStation || "Select police station"}
                                  />
                                ) : (
                                  <div className={getReadOnlyDivStyle()}>
                                    {addressData.mailing.policeStation || "Not provided"}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="mailing-post" className="text-sm font-medium text-gray-700">
                                  2.13 Post Office
                                </Label>
                                {isFieldEditable() ? (
                                  <Combobox
                                    dataArr={postOffices.map((p) => ({ value: String(p.id), label: p.name }))}
                                    value={mailingPostOfficeId ? String(mailingPostOfficeId) : ""}
                                    onChange={(val) => {
                                      const id = val ? Number(val) : null;
                                      setMailingPostOfficeId(id);
                                      const name = postOffices.find((p) => String(p.id) === val)?.name || "";
                                      handleAddressChange("mailing", "postOffice", name);
                                    }}
                                    placeholder={addressData.mailing.postOffice || "Select post office"}
                                  />
                                ) : (
                                  <div className={getReadOnlyDivStyle()}>
                                    {addressData.mailing.postOffice || "Not provided"}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="mailing-state" className="text-sm font-medium text-gray-700">
                                  2.14 State
                                </Label>
                                <Input
                                  id="mailing-state"
                                  value={addressData.mailing.state}
                                  className={getReadOnlyFieldStyle()}
                                  readOnly
                                  disabled={!isFieldEditable()}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="mailing-country" className="text-sm font-medium text-gray-700">
                                  2.15 Country
                                </Label>
                                <Input
                                  id="mailing-country"
                                  value={addressData.mailing.country}
                                  className={getReadOnlyFieldStyle()}
                                  readOnly
                                  disabled={!isFieldEditable()}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="mailing-pin" className="text-sm font-medium text-gray-700">
                                  2.16 Pin Code
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
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Declaration and Error Messages */}
                      <div className="mt-6 space-y-3">
                        {isFieldEditable() && (
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="addressDeclaration"
                              checked={addressDeclared}
                              onCheckedChange={handleAddressDeclarationChange}
                              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label
                              htmlFor="addressDeclaration"
                              className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                            >
                              I declare that the addresses provided are correct (all fields mandatory).
                            </Label>
                          </div>
                        )}

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
                        <h2 className="text-lg font-semibold text-gray-900">Subjects Overview (Semesters 1-4)</h2>
                        {isFieldEditable() && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">3.1 Request correction</span>
                            <Switch
                              checked={correctionFlags.subjects}
                              onCheckedChange={() => handleCorrectionToggle("subjects")}
                              disabled={!isFieldEditable()}
                            />
                          </div>
                        )}
                      </div>

                      {/* Subjects Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                                3.1 Category
                              </th>
                              <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                                3.2 Sem 1
                              </th>
                              <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                                3.3 Sem 2
                              </th>
                              <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                                3.4 Sem 3
                              </th>
                              <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                                3.5 Sem 4
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(subjectsData).map(([category, semesters]) => (
                              <tr key={category} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                  {category}
                                </td>
                                {Object.entries(semesters).map(([sem, value]) => (
                                  <td key={sem} className="border border-gray-300 px-2 py-2">
                                    <div className="relative">
                                      <Input
                                        value={value}
                                        onChange={(e) => handleSubjectChange(category, sem, e.target.value)}
                                        readOnly={correctionFlags.subjects}
                                        className="w-full text-center text-sm h-8 bg-transparent border-0 focus-visible:ring-0"
                                      />
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Declaration */}
                      {isFieldEditable() && (
                        <div className="mt-6">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="subjectsDeclaration"
                              checked={subjectsDeclared}
                              onCheckedChange={handleSubjectsDeclarationChange}
                              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label
                              htmlFor="subjectsDeclaration"
                              className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                            >
                              {correctionFlags.subjects
                                ? "I confirm the subjects listed above for Semesters 1-4. Note: Corrections will be reviewed by staff."
                                : "I confirm the subjects listed above for Semesters 1-4."}
                            </Label>
                          </div>
                        </div>
                      )}
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
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
                              <input
                                id="classXIIMarksheet"
                                type="file"
                                accept=".pdf,.jpg,.jpeg"
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
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
                              <input
                                id="aadhaarCard"
                                type="file"
                                accept=".pdf,.jpg,.jpeg"
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
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
                              <input
                                id="apaarIdCard"
                                type="file"
                                accept=".pdf,.jpg,.jpeg"
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
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
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
                                accept=".pdf,.jpg,.jpeg"
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
                              <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
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
                                accept=".pdf,.jpg,.jpeg"
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
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              </div>
                              <div className="relative">
                                <Input
                                  value={documents.ewsCertificate?.name || "No file chosen"}
                                  readOnly
                                  className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF / JPG</p>
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
                                  accept=".pdf,.jpg,.jpeg"
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

                      {/* Confirmation Checkbox - Only show if form is editable */}
                      {isFieldEditable() && (
                        <div className="mt-6">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="documentsConfirmation"
                              checked={documentsConfirmed}
                              onCheckedChange={(checked: boolean) => setDocumentsConfirmed(checked)}
                              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                            />
                            <Label
                              htmlFor="documentsConfirmation"
                              className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                            >
                              I confirm that the uploaded documents correspond to the data provided.
                            </Label>
                          </div>
                        </div>
                      )}

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
            )}
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
                    className={`border ${finalDeclaration ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "bg-blue-200 text-white border-blue-200"}`}
                    disabled={!finalDeclaration}
                    onClick={handleSubmitCorrection}
                  >
                    Submit
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
