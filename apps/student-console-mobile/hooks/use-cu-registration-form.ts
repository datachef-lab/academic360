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

  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, string[]>>>({});
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
      const [sel, mand] = await Promise.all([
        fetchStudentSubjectSelections(student.id),
        fetchMandatorySubjects(student.id).catch(() => []),
      ]);
      const next: Record<string, Record<string, string[]>> = {
        DSCC: { sem1: [], sem2: [], sem3: [], sem4: [] },
        Minor: { sem1: [], sem2: [], sem3: [], sem4: [] },
        IDC: { sem1: [], sem2: [], sem3: [], sem4: [] },
        AEC: { sem1: [], sem2: [], sem3: [], sem4: [] },
        CVAC: { sem1: [], sem2: [], sem3: [], sem4: [] },
      };
      (sel?.actualStudentSelections || []).forEach(
        (r: {
          metaLabel?: string;
          subjectName?: string;
          subject?: { name?: string };
          forClasses?: { name?: string }[];
        }) => {
          const label = String(r?.metaLabel || "");
          const name = r?.subjectName || r?.subject?.name || "";
          if (!label || !name) return;
          let key = "IDC";
          if (/DSCC|Discipline Specific/i.test(label)) key = "DSCC";
          else if (/Minor/i.test(label)) key = "Minor";
          else if (/IDC|Interdisciplinary/i.test(label)) key = "IDC";
          else if (/AEC/i.test(label)) key = "AEC";
          else if (/CVAC/i.test(label)) key = "CVAC";
          const classes = r?.forClasses || [];
          const sems = classes
            .map((c) => {
              const n = String(c?.name || "").match(/\b(I|II|III|IV)\b/i);
              return n ? { I: 1, II: 2, III: 3, IV: 4 }[n[1].toUpperCase()] : 0;
            })
            .filter(Boolean);
          if (sems.length === 0) sems.push(1);
          sems.forEach((s) => {
            if (next[key]?.[`sem${s}`]) next[key][`sem${s}`].push(name);
            else if (next[key]) next[key][`sem${s}`] = [name];
          });
        },
      );
      setSubjectsData(next);
    } finally {
      setSubjectsLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (correctionRequest?.subjectsDeclaration) setSubjectsDeclared(true);
    if (correctionRequest?.personalInfoDeclaration) setPersonalDeclared(true);
    if (correctionRequest?.addressInfoDeclaration) setAddressDeclared(true);
    if (correctionRequest?.documentsDeclaration) setDocumentsConfirmed(true);
    if (correctionRequest?.introductoryDeclaration) setInstructionsConfirmed(true);
  }, [correctionRequest]);

  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string) => {
    setPersonalInfo((p) => ({ ...p, [field]: value }));
  };

  const handleCorrectionToggle = (field: keyof CorrectionFlags) => {
    setCorrectionFlags((f) => ({ ...f, [field]: !f[field] }));
  };

  const handleSubmitPersonal = useCallback(async () => {
    if (!correctionRequestId) return;
    const flags = {
      gender: correctionFlags.gender,
      nationality: correctionFlags.nationality,
      aadhaarNumber: correctionFlags.aadhaarNumber,
      apaarId: correctionFlags.apaarId,
    };
    await submitPersonalInfoDeclaration({
      correctionRequestId,
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
    const updated = await getCuCorrectionRequestById(correctionRequestId);
    setCorrectionRequest(updated);
  }, [correctionRequestId, personalInfo, correctionFlags]);

  const handleSubmitAddress = useCallback(async () => {
    if (!correctionRequestId) return;
    await submitAddressInfoDeclaration({
      correctionRequestId,
      addressData: { residential: residentialAddress, mailing: mailingAddress },
    });
    setAddressDeclared(true);
    const updated = await getCuCorrectionRequestById(correctionRequestId);
    setCorrectionRequest(updated);
  }, [correctionRequestId, residentialAddress, mailingAddress]);

  const handleSubmitSubjects = useCallback(async () => {
    if (!correctionRequestId) return;
    await submitSubjectsDeclaration({
      correctionRequestId,
      flags: { subjects: correctionFlags.subjects },
    });
    setSubjectsDeclared(true);
    const updated = await getCuCorrectionRequestById(correctionRequestId);
    setCorrectionRequest(updated);
  }, [correctionRequestId, correctionFlags.subjects]);

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
      if (!file || !correctionRequestId) return;
      const docId = DOCUMENT_IDS[key];
      if (!docId) return;
      setUploadingDoc(key);
      try {
        await uploadCuRegistrationDocument({
          file,
          cuRegistrationCorrectionRequestId: correctionRequestId,
          documentId: docId,
        });
        const list = await getCuRegistrationDocuments(correctionRequestId);
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
    [documents, correctionRequestId],
  );

  const handleDocumentsDeclaration = useCallback(
    async (checked: boolean) => {
      if (!correctionRequestId) return;
      setDocumentsConfirmed(checked);
      if (checked) {
        await updateCuCorrectionRequest(correctionRequestId, { documentsDeclaration: true });
        const updated = await getCuCorrectionRequestById(correctionRequestId);
        setCorrectionRequest(updated);
      }
    },
    [correctionRequestId],
  );

  const handleFinalDeclarationChange = useCallback((checked: boolean) => {
    setFinalDeclaration(checked);
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    if (!correctionRequestId || submitting || !finalDeclaration) return;
    setSubmitting(true);
    try {
      await updateCuCorrectionRequest(correctionRequestId, { onlineRegistrationDone: true });
      const updated = await getCuCorrectionRequestById(correctionRequestId);
      setCorrectionRequest(updated);
      setSubmitSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [correctionRequestId, submitting, finalDeclaration]);

  const handleInstructionsConfirm = useCallback(
    async (checked: boolean) => {
      setInstructionsConfirmed(checked);
      if (checked && correctionRequestId) {
        await updateCuCorrectionRequest(correctionRequestId, { introductoryDeclaration: true });
        const updated = await getCuCorrectionRequestById(correctionRequestId);
        setCorrectionRequest(updated);
      }
    },
    [correctionRequestId],
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
