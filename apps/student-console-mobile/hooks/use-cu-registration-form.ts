import type { StudentDto } from "@repo/db/dtos/user";
import { useCallback, useEffect, useState } from "react";
import {
  createCuCorrectionRequest,
  getCuCorrectionRequestById,
  getStudentCuCorrectionRequests,
  submitAddressInfoDeclaration,
  submitDocumentsDeclaration,
  submitPersonalInfoDeclaration,
  submitSubjectsDeclaration,
  updateCuCorrectionRequest,
  type CuRegistrationCorrectionRequestDto,
} from "@/services/cu-registration";
import { getCuRegistrationDocuments, uploadCuRegistrationDocument } from "@/services/cu-registration-documents";
import { fetchStudentSubjectSelections, fetchMandatorySubjects } from "@/services/subject-selection";
import { fetchPersonalDetailsByStudentId } from "@/services/personal-details";
import { fetchCities, fetchDistricts, type IdNameDto } from "@/services/resources";
import { useProfile } from "@/hooks/use-profile";

export interface PersonalInfoData {
  fullName: string;
  parentName: string;
  gender: string;
  nationality: string;
  ews: string;
  aadhaarNumber: string;
  apaarId: string;
}

export interface AddressData {
  addressLine: string;
  city: string;
  district: string;
  policeStation: string;
  postOffice: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface CorrectionFlags {
  gender: boolean;
  nationality: boolean;
  aadhaarNumber: boolean;
  apaarId: boolean;
  subjects: boolean;
}

const DOCUMENT_IDS: Record<string, number> = {
  classXIIMarksheet: 1,
  aadhaarCard: 2,
  apaarIdCard: 3,
  fatherPhotoId: 4,
  motherPhotoId: 5,
  ewsCertificate: 10,
  migrationCertificate: 11,
};

export type DocumentKey = keyof typeof DOCUMENT_IDS;

export interface DocumentFile {
  uri: string;
  type?: string;
  name?: string;
  fileSize?: number;
}

export function useCuRegistrationForm(student: StudentDto | undefined) {
  const { profileInfo } = useProfile();

  const [correctionRequest, setCorrectionRequest] = useState<CuRegistrationCorrectionRequestDto | null>(null);
  const [correctionRequestId, setCorrectionRequestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instructionsConfirmed, setInstructionsConfirmed] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    fullName: "",
    parentName: "",
    gender: "",
    nationality: "",
    ews: "No",
    aadhaarNumber: "",
    apaarId: "",
  });
  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
    aadhaarNumber: false,
    apaarId: false,
    subjects: false,
  });
  const [personalDeclared, setPersonalDeclared] = useState(false);

  const [residentialAddress, setResidentialAddress] = useState<AddressData>({
    addressLine: "",
    city: "",
    district: "",
    policeStation: "",
    postOffice: "",
    state: "West Bengal",
    country: "India",
    pinCode: "",
  });
  const [mailingAddress, setMailingAddress] = useState<AddressData>({
    addressLine: "",
    city: "",
    district: "",
    policeStation: "",
    postOffice: "",
    state: "West Bengal",
    country: "India",
    pinCode: "",
  });
  const [addressDeclared, setAddressDeclared] = useState(false);

  const [cities, setCities] = useState<IdNameDto[]>([]);
  const [districts, setDistricts] = useState<IdNameDto[]>([]);
  const [mailingDistricts, setMailingDistricts] = useState<IdNameDto[]>([]);

  const createInitialSubjects = () => ({
    DSCC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    Minor: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    IDC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    SEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    AEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    CVAC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
  });

  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, string[]>>>(createInitialSubjects);
  const [mandatorySubjects, setMandatorySubjects] =
    useState<Record<string, Record<string, string[]>>>(createInitialSubjects);
  const [subjectsDeclared, setSubjectsDeclared] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, DocumentFile>>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<unknown[]>([]);
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentKey | null>(null);

  const [finalDeclaration, setFinalDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isFormEditable = !correctionRequest?.onlineRegistrationDone;
  const isFieldEditable = isFormEditable;

  const ensureCorrectionRequest = useCallback(async () => {
    if (!student?.id) return;
    try {
      const requests = await getStudentCuCorrectionRequests(student.id);
      const existing = requests?.[0];
      if (existing?.id) {
        setCorrectionRequest(existing);
        setCorrectionRequestId(existing.id);
        return existing;
      }
      const created = await createCuCorrectionRequest({ studentId: student.id });
      setCorrectionRequest(created);
      setCorrectionRequestId(created.id ?? null);
      return created;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      throw e;
    }
  }, [student?.id]);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await ensureCorrectionRequest();
        const [pd] = await Promise.all([
          fetchPersonalDetailsByStudentId(student.id!).catch(() => null),
          fetchCities().then((c) => {
            if (!cancelled) setCities(c);
            return c;
          }),
        ]);
        if (cancelled) return;
        if (pd) {
          const fullName = [pd.firstName, pd.middleName, pd.lastName].filter(Boolean).join(" ");
          setPersonalInfo((prev) => ({
            ...prev,
            fullName: fullName || prev.fullName,
            gender: pd.gender || prev.gender,
            aadhaarNumber: pd.aadhaarCardNumber || prev.aadhaarNumber,
            ews: pd.ewsStatus === "Yes" || pd.isEWS ? "Yes" : "No",
          }));
        }
        const profile = profileInfo as {
          name?: string;
          studentFamily?: { members?: { type: string; name?: string }[] };
        } | null;
        if (profile?.name) setPersonalInfo((p) => ({ ...p, fullName: p.fullName || profile.name! }));
        const family = profile?.studentFamily?.members;
        const father = family?.find((m) => m.type === "FATHER");
        const mother = family?.find((m) => m.type === "MOTHER");
        if (father?.name) setPersonalInfo((p) => ({ ...p, parentName: p.parentName || father.name! }));
        else if (mother?.name) setPersonalInfo((p) => ({ ...p, parentName: p.parentName || mother.name! }));
        const studentWithApaar = student as { apaarId?: string };
        if (studentWithApaar?.apaarId) setPersonalInfo((p) => ({ ...p, apaarId: studentWithApaar.apaarId! }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student?.id, ensureCorrectionRequest, profileInfo]);

  useEffect(() => {
    if (!residentialAddress.city) return;
    const cityId = cities.find((c) => c.name.trim().toLowerCase() === residentialAddress.city.trim().toLowerCase())?.id;
    if (cityId) fetchDistricts({ cityId }).then((d) => setDistricts(d));
  }, [residentialAddress.city, cities]);

  useEffect(() => {
    if (!mailingAddress.city) return;
    const cityId = cities.find((c) => c.name.trim().toLowerCase() === mailingAddress.city.trim().toLowerCase())?.id;
    if (cityId) fetchDistricts({ cityId }).then((d) => setMailingDistricts(d));
  }, [mailingAddress.city, cities]);

  useEffect(() => {
    if (!correctionRequestId) return;
    getCuRegistrationDocuments(correctionRequestId).then(setUploadedDocuments);
  }, [correctionRequestId]);

  const loadSubjects = useCallback(async () => {
    if (!student?.id) return;
    setSubjectsLoading(true);
    try {
      const [studentRows, mandatoryRows] = await Promise.all([
        fetchStudentSubjectSelections(student.id),
        fetchMandatorySubjects(student.id).catch(() => []),
      ]);

      const programName = student?.programCourse?.name || student?.currentPromotion?.programCourse?.name || "";
      const normalizedName = programName
        .normalize("NFKD")
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();
      const isBcomProgram = normalizedName.startsWith("BCOM");
      const isBbaProgram = normalizedName.startsWith("BBA");
      const isMdcProgramForDisplay = isBcomProgram || isBbaProgram;

      const toSemNumFromLabel = (label: string) => {
        const m = /\b(I|II|III|IV)\b/i.exec(label || "");
        const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
        return m ? map[m[1].toUpperCase()] : undefined;
      };
      const toSemNumsFromClasses = (forClasses?: unknown[]) => {
        if (!Array.isArray(forClasses)) return [] as number[];
        const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
        const nums: number[] = [];
        forClasses.forEach((c: unknown) => {
          const obj = c as { name?: string; shortName?: string; class?: { name?: string; shortName?: string } };
          const label = String(obj?.name || obj?.shortName || obj?.class?.name || obj?.class?.shortName || "");
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

      type CategoryKey = "DSCC" | "Minor" | "IDC" | "SEC" | "AEC" | "CVAC";
      const getCategoryKey = (label: string): CategoryKey | undefined => {
        if (/Discipline Specific Core Courses/i.test(label) || /DSCC/i.test(label)) return "DSCC";
        if (isBbaProgram && (/Core\s*Course/i.test(label) || /\bCC\b/i.test(label))) return "DSCC";
        if (/Minor/i.test(label)) return "Minor";
        if (isMdcProgramForDisplay) {
          if (/Major Discipline Course/i.test(label) || /Multi Disciplinary Course/i.test(label) || /MDC/i.test(label))
            return "IDC";
          if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) return undefined;
        } else {
          if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) return "IDC";
        }
        if (/Ability Enhancement Course/i.test(label) || /AEC/i.test(label)) return "AEC";
        if (/Common Value Added Course/i.test(label) || /CVAC/i.test(label)) return "CVAC";
        return undefined;
      };

      const next = createInitialSubjects();
      const mandatoryNext = createInitialSubjects();

      const actualSelections = ((studentRows as { actualStudentSelections?: unknown[] })?.actualStudentSelections ||
        []) as Record<string, unknown>[];
      actualSelections.forEach((r) => {
        const label = String(r?.metaLabel || (r?.subjectSelectionMeta as { label?: string })?.label || "");
        const name = String(
          r?.subjectName ||
            (r?.subject as { name?: string; code?: string })?.name ||
            (r?.subject as { name?: string; code?: string })?.code ||
            "",
        );
        if (!label || !name) return;
        const key = getCategoryKey(label);
        if (!key || !next[key]) return;

        const forClasses = (r?.subjectSelectionMeta as { forClasses?: unknown[] })?.forClasses;
        let semesters: number[] = toSemNumsFromClasses(forClasses);

        if (semesters.length === 0 && /Minor\s*1/i.test(label)) semesters = [1, 2];
        if (semesters.length === 0 && /Minor\s*2/i.test(label)) semesters = [3, 4];
        if (semesters.length === 0 && /Minor\s*3/i.test(label)) semesters = [3];
        if (isMdcProgramForDisplay) {
          if (semesters.length === 0 && /MDC\s*1/i.test(label)) semesters = [1];
          if (semesters.length === 0 && /MDC\s*2/i.test(label)) semesters = [2];
          if (semesters.length === 0 && /MDC\s*3/i.test(label)) semesters = [3];
          if (semesters.length === 0 && /Major Discipline Course/i.test(label)) semesters = [1, 2, 3];
          if (semesters.length === 0 && /Multi Disciplinary Course/i.test(label)) semesters = [1, 2, 3];
        } else {
          if (semesters.length === 0 && /IDC\s*1/i.test(label)) semesters = [1];
          if (semesters.length === 0 && /IDC\s*2/i.test(label)) semesters = [2];
          if (semesters.length === 0 && /IDC\s*3/i.test(label)) semesters = [3];
        }
        if (isBbaProgram && (/Core\s*Course/i.test(label) || /\bCC\b/i.test(label)) && semesters.length === 0)
          semesters = [1, 2, 3, 4];
        if (semesters.length === 0 && /AEC/i.test(label)) semesters = [3, 4];
        if (semesters.length === 0 && /CVAC/i.test(label)) semesters = [2];
        if (semesters.length === 0) {
          const n = toSemNumFromLabel(label);
          if (n) semesters = [n];
        }

        semesters.forEach((s) => {
          const semKey = `sem${s}` as "sem1" | "sem2" | "sem3" | "sem4";
          if (next[key] && next[key][semKey] !== undefined) {
            const arr = next[key][semKey];
            if (!arr.includes(name)) arr.push(name);
          }
        });
      });

      const mandatoryList = mandatoryRows as Record<string, unknown>[];
      mandatoryList.forEach((r) => {
        const subjectTypeName = String((r?.subjectType as { name?: string })?.name || "");
        const subjectName = String(
          (r?.subject as { name?: string; code?: string })?.name ||
            (r?.subject as { name?: string; code?: string })?.code ||
            "",
        );
        const className = String(
          (r?.class as { name?: string; shortName?: string })?.name ||
            (r?.class as { name?: string; shortName?: string })?.shortName ||
            "",
        );
        if (!subjectTypeName || !subjectName) return;
        const key = getCategoryKey(subjectTypeName);
        if (!key || !mandatoryNext[key]) return;

        let semesters: number[] = [];
        const semMatch = className.match(/\b(I|II|III|IV|1|2|3|4)\b/i);
        if (semMatch) {
          const sem = semMatch[1].toUpperCase();
          const semMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, "1": 1, "2": 2, "3": 3, "4": 4 };
          semesters = [semMap[sem]];
        }
        if (semesters.length === 0) {
          if (isBbaProgram && (/Core\s*Course/i.test(subjectTypeName) || /\bCC\b/i.test(subjectTypeName)))
            semesters = [1, 2, 3, 4];
          if (/Minor\s*1/i.test(subjectTypeName)) semesters = [1, 2];
          else if (/Minor\s*2/i.test(subjectTypeName)) semesters = [3, 4];
          else if (/Minor\s*3/i.test(subjectTypeName)) semesters = [3];
          else if (isMdcProgramForDisplay) {
            if (/MDC\s*1/i.test(subjectTypeName)) semesters = [1];
            else if (/MDC\s*2/i.test(subjectTypeName)) semesters = [2];
            else if (/MDC\s*3/i.test(subjectTypeName)) semesters = [3];
            else if (/Major Discipline Course/i.test(subjectTypeName)) semesters = [1, 2, 3];
            else if (/Multi Disciplinary Course/i.test(subjectTypeName)) semesters = [1, 2, 3];
          } else {
            if (/IDC\s*1/i.test(subjectTypeName)) semesters = [1];
            else if (/IDC\s*2/i.test(subjectTypeName)) semesters = [2];
            else if (/IDC\s*3/i.test(subjectTypeName)) semesters = [3];
          }
          if (/AEC/i.test(subjectTypeName)) semesters = [3, 4];
          else if (/CVAC/i.test(subjectTypeName)) semesters = [2];
          else semesters = [1, 2, 3, 4];
        }

        semesters.forEach((s) => {
          const semKey = `sem${s}` as "sem1" | "sem2" | "sem3" | "sem4";
          if (mandatoryNext[key] && mandatoryNext[key][semKey] !== undefined) {
            const arr = mandatoryNext[key][semKey];
            if (!arr.includes(subjectName)) arr.push(subjectName);
          }
        });
      });

      setSubjectsData(next);
      setMandatorySubjects(mandatoryNext);
    } finally {
      setSubjectsLoading(false);
    }
  }, [student?.id, student?.programCourse?.name, student?.currentPromotion?.programCourse?.name]);

  useEffect(() => {
    if (correctionRequest?.subjectsDeclaration) setSubjectsDeclared(true);
    if (correctionRequest?.personalInfoDeclaration) setPersonalDeclared(true);
    if (correctionRequest?.addressInfoDeclaration) setAddressDeclared(true);
    if (correctionRequest?.documentsDeclaration) setDocumentsConfirmed(true);
    if (correctionRequest?.introductoryDeclaration) setInstructionsConfirmed(true);
  }, [correctionRequest]);

  // Populate address from profile personalDetails (like web)
  useEffect(() => {
    type Addr = {
      type?: string;
      addressLine?: string;
      city?: { name?: string };
      otherCity?: string;
      district?: { name?: string };
      otherDistrict?: string;
      policeStation?: { name?: string };
      otherPoliceStation?: string;
      postoffice?: { name?: string };
      otherPostoffice?: string;
      state?: { name?: string };
      otherState?: string;
      country?: { name?: string };
      otherCountry?: string;
      pincode?: string;
    };
    const pd = profileInfo?.personalDetails as { address?: Addr[] } | null;
    const addresses = pd?.address || [];
    const resAddr = addresses.find((a) => a?.type === "RESIDENTIAL");
    const mailAddr = addresses.find((a) => a?.type === "MAILING");
    const get = (p: string | undefined, o: string | undefined, f: string | undefined, d = "") => p || o || f || d;
    if (resAddr || mailAddr) {
      setResidentialAddress((prev) => ({
        ...prev,
        addressLine: get(resAddr?.addressLine, mailAddr?.addressLine, prev.addressLine) || prev.addressLine,
        city:
          get(resAddr?.city?.name, resAddr?.otherCity, mailAddr?.city?.name || mailAddr?.otherCity, prev.city) ||
          prev.city,
        district:
          get(
            resAddr?.district?.name,
            resAddr?.otherDistrict,
            mailAddr?.district?.name || mailAddr?.otherDistrict,
            prev.district,
          ) || prev.district,
        policeStation:
          get(
            resAddr?.policeStation?.name,
            resAddr?.otherPoliceStation,
            mailAddr?.policeStation?.name || mailAddr?.otherPoliceStation,
            prev.policeStation,
          ) || prev.policeStation,
        postOffice:
          get(
            resAddr?.postoffice?.name,
            resAddr?.otherPostoffice,
            mailAddr?.postoffice?.name || mailAddr?.otherPostoffice,
            prev.postOffice,
          ) || prev.postOffice,
        state:
          get(
            resAddr?.state?.name,
            resAddr?.otherState,
            mailAddr?.state?.name || mailAddr?.otherState,
            "West Bengal",
          ) || prev.state,
        country:
          get(
            resAddr?.country?.name,
            resAddr?.otherCountry,
            mailAddr?.country?.name || mailAddr?.otherCountry,
            "India",
          ) || prev.country,
        pinCode: get(resAddr?.pincode, mailAddr?.pincode, prev.pinCode) || prev.pinCode,
      }));
    }
    if (mailAddr || resAddr) {
      setMailingAddress((prev) => ({
        ...prev,
        addressLine: get(mailAddr?.addressLine, resAddr?.addressLine, prev.addressLine) || prev.addressLine,
        city:
          get(mailAddr?.city?.name, mailAddr?.otherCity, resAddr?.city?.name || resAddr?.otherCity, prev.city) ||
          prev.city,
        district:
          get(
            mailAddr?.district?.name,
            mailAddr?.otherDistrict,
            resAddr?.district?.name || resAddr?.otherDistrict,
            prev.district,
          ) || prev.district,
        policeStation:
          get(
            mailAddr?.policeStation?.name,
            mailAddr?.otherPoliceStation,
            resAddr?.policeStation?.name || resAddr?.otherPoliceStation,
            prev.policeStation,
          ) || prev.policeStation,
        postOffice:
          get(
            mailAddr?.postoffice?.name,
            mailAddr?.otherPostoffice,
            resAddr?.postoffice?.name || resAddr?.otherPostoffice,
            prev.postOffice,
          ) || prev.postOffice,
        state:
          get(
            mailAddr?.state?.name,
            mailAddr?.otherState,
            resAddr?.state?.name || resAddr?.otherState,
            "West Bengal",
          ) || prev.state,
        country:
          get(
            mailAddr?.country?.name,
            mailAddr?.otherCountry,
            resAddr?.country?.name || resAddr?.otherCountry,
            "India",
          ) || prev.country,
        pinCode: get(mailAddr?.pincode, resAddr?.pincode, prev.pinCode) || prev.pinCode,
      }));
    }
  }, [profileInfo]);

  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string) => {
    setPersonalInfo((p) => ({ ...p, [field]: value }));
  };

  const handleCorrectionToggle = (field: keyof CorrectionFlags) => {
    setCorrectionFlags((f) => ({ ...f, [field]: !f[field] }));
  };

  const handleSubmitPersonal = useCallback(async () => {
    const req = await ensureCorrectionRequest();
    const id = req?.id ?? correctionRequestId;
    if (!id) return;
    const flags = {
      gender: correctionFlags.gender,
      nationality: correctionFlags.nationality,
      aadhaarNumber: correctionFlags.aadhaarNumber,
      apaarId: correctionFlags.apaarId,
    };
    await submitPersonalInfoDeclaration({
      correctionRequestId: id as number,
      flags,
      personalInfo: {
        fullName: personalInfo.fullName,
        fatherMotherName: personalInfo.parentName,
        parentType: "FATHER",
        gender: personalInfo.gender,
        nationality: personalInfo.nationality,
        ews: personalInfo.ews,
        aadhaarNumber: personalInfo.aadhaarNumber,
        apaarId: personalInfo.apaarId,
      },
    });
    setPersonalDeclared(true);
    const updated = await getCuCorrectionRequestById(id);
    setCorrectionRequest(updated);
  }, [correctionRequestId, personalInfo, correctionFlags, ensureCorrectionRequest]);

  const handleSubmitAddress = useCallback(async () => {
    const req = await ensureCorrectionRequest();
    const id = req?.id ?? correctionRequestId;
    if (!id) return;
    const toPayload = (addr: AddressData) => ({
      addressLine: addr.addressLine,
      pincode: addr.pinCode,
      otherPostoffice: addr.postOffice,
      otherPoliceStation: addr.policeStation,
      otherCity: addr.city,
      otherDistrict: addr.district,
      otherState: addr.state,
      otherCountry: addr.country,
    });
    await submitAddressInfoDeclaration({
      correctionRequestId: id,
      addressData: {
        residential: toPayload(residentialAddress),
        mailing: toPayload(mailingAddress),
      },
    });
    setAddressDeclared(true);
    const updated = await getCuCorrectionRequestById(id);
    setCorrectionRequest(updated);
  }, [correctionRequestId, residentialAddress, mailingAddress, ensureCorrectionRequest]);

  const handleSubmitSubjects = useCallback(async () => {
    const req = await ensureCorrectionRequest();
    const id = req?.id ?? correctionRequestId;
    if (!id) return;
    await submitSubjectsDeclaration({
      correctionRequestId: id,
      flags: { subjects: correctionFlags.subjects },
    });
    setSubjectsDeclared(true);
    const updated = await getCuCorrectionRequestById(id);
    setCorrectionRequest(updated);
  }, [correctionRequestId, correctionFlags.subjects, ensureCorrectionRequest]);

  const handleDocumentSelect = (key: DocumentKey, file: DocumentFile | null) => {
    if (file) setDocuments((d) => ({ ...d, [key]: file }));
    else
      setDocuments((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
  };

  const handleDocumentUpload = useCallback(
    async (key: DocumentKey) => {
      const file = documents[key];
      if (!file) return;
      const req = await ensureCorrectionRequest();
      const id = req?.id ?? correctionRequestId;
      if (!id) return;
      const docId = DOCUMENT_IDS[key];
      if (!docId) return;
      setUploadingDoc(key);
      try {
        await uploadCuRegistrationDocument({
          file,
          cuRegistrationCorrectionRequestId: id,
          documentId: docId,
        });
        const list = await getCuRegistrationDocuments(id);
        setUploadedDocuments(list);
        setDocuments((d) => {
          const next = { ...d };
          delete next[key];
          return next;
        });
      } finally {
        setUploadingDoc(null);
      }
    },
    [documents, correctionRequestId, ensureCorrectionRequest],
  );

  const handleDocumentsDeclaration = useCallback(
    async (checked: boolean) => {
      setDocumentsConfirmed(checked);
      if (checked) {
        const req = await ensureCorrectionRequest();
        const id = req?.id ?? correctionRequestId;
        if (!id) return;
        await updateCuCorrectionRequest(id, { documentsDeclaration: true });
        const updated = await getCuCorrectionRequestById(id);
        setCorrectionRequest(updated);
      }
    },
    [correctionRequestId, ensureCorrectionRequest],
  );

  const handleFinalDeclarationChange = useCallback((checked: boolean) => {
    setFinalDeclaration(checked);
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (submitting || !finalDeclaration) return;
    const req = await ensureCorrectionRequest();
    const id = req?.id ?? correctionRequestId;
    if (!id) return;
    setSubmitting(true);
    try {
      await updateCuCorrectionRequest(id, { onlineRegistrationDone: true });
      const updated = await getCuCorrectionRequestById(id);
      setCorrectionRequest(updated);
      setSubmitSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [correctionRequestId, submitting, finalDeclaration, ensureCorrectionRequest]);

  const handleInstructionsConfirm = useCallback(
    async (checked: boolean) => {
      setInstructionsConfirmed(checked);
      if (checked) {
        const req = await ensureCorrectionRequest();
        const id = req?.id ?? correctionRequestId;
        if (!id) return;
        await updateCuCorrectionRequest(id, { introductoryDeclaration: true });
        const updated = await getCuCorrectionRequestById(id);
        setCorrectionRequest(updated);
      }
    },
    [correctionRequestId, ensureCorrectionRequest],
  );

  return {
    loading,
    error,
    correctionRequest,
    correctionRequestId,
    instructionsConfirmed,
    personalInfo,
    setPersonalInfo: handlePersonalInfoChange,
    correctionFlags,
    handleCorrectionToggle,
    personalDeclared,
    handleSubmitPersonal,
    residentialAddress,
    setResidentialAddress,
    mailingAddress,
    setMailingAddress,
    addressDeclared,
    handleSubmitAddress,
    cities,
    districts,
    mailingDistricts,
    subjectsData,
    mandatorySubjects,
    subjectsLoading,
    loadSubjects,
    subjectsDeclared,
    handleSubmitSubjects,
    documents,
    handleDocumentSelect,
    handleDocumentUpload,
    uploadedDocuments,
    documentsConfirmed,
    handleDocumentsDeclaration,
    uploadingDoc,
    isFormEditable,
    isFieldEditable,
    submitting,
    submitSuccess,
    handleFinalSubmit,
    handleInstructionsConfirm,
    ensureCorrectionRequest,
    finalDeclaration,
    handleFinalDeclarationChange,
  };
}
