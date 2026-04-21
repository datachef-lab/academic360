"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  orderTableFieldsTypeFirst,
  sortCpCertificateMasters,
  usesInternshipWorkRowLayout,
} from "@/lib/career-progression-form-utils";
import { axiosInstance } from "@/lib/utils";
import { isFirstSemesterClassName } from "@/lib/semester-class-utils";
import { useStudent } from "@/providers/student-provider";
import { Plus, Sparkles, Trash2 } from "lucide-react";

type ApiResponse<T> = { payload: T; message?: string };
type AcademicYear = { id: number; year: string };
type FieldOption = { id?: number; name: string; sequence: number };
type Field = {
  id?: number;
  name: string;
  type: string;
  sequence: number;
  isQuestion?: boolean;
  isRequired?: boolean;
  options: FieldOption[];
};
type CertificateMaster = {
  id?: number;
  name: string;
  description: string;
  sequence: number;
  fields: Field[];
};
type CareerProgressionTemplatePayload = {
  academicYear: AcademicYear;
  hasExistingForms: boolean;
  certificateMasters: CertificateMaster[];
};
type RowField = { certificateFieldMasterId: number; value: string };
type RowDraft = { certificateMasterId: number; fields: RowField[] };
type CareerProgressionFormPayload = {
  id: number;
  academicYear: { id: number; year: string };
  certificates: Array<{
    certificateMaster: { id: number; name: string };
    fields: Array<{
      certificateFieldMaster: { id: number; name: string };
      certificateFieldOptionMaster: { id: number; name: string } | null;
      value: string | null;
    }>;
  }>;
};

const buildEmptyRowDraft = (master: CertificateMaster): RowDraft => {
  const tableFields = master.fields
    .filter((f) => !f.isQuestion)
    .sort((a, b) => a.sequence - b.sequence);
  return {
    certificateMasterId: Number(master.id) || 0,
    fields: tableFields
      .filter((f) => f.id != null)
      .map((f) => ({
        certificateFieldMasterId: Number(f.id),
        value: "",
      })),
  };
};

const buildRowDraftFromEditingValues = (
  master: CertificateMaster,
  editingValues: Record<number, string>,
  certificateMasterId: number,
): RowDraft => ({
  certificateMasterId: Number(master.id) || certificateMasterId || 0,
  fields: master.fields
    .filter((f) => !f.isQuestion)
    .sort((a, b) => a.sequence - b.sequence)
    .filter((f) => f.id != null)
    .map((f) => {
      const fid = Number(f.id);
      return {
        certificateFieldMasterId: fid,
        value: editingValues[fid] ?? "",
      };
    }),
});

const isInternshipOnlySection = (name: string) => {
  const n = name.trim().toLowerCase();
  return n.includes("internship") && !n.includes("work experience");
};

const shouldAlwaysShowDeleteForSection = (name: string) => {
  const n = name.trim().toLowerCase();
  return (
    n.includes("work experience") ||
    n.includes("skills") ||
    n.includes("certification") ||
    n.includes("professional") ||
    n.includes("competitive") ||
    n.includes("club") ||
    n.includes("committee")
  );
};

/** True if at least one table cell has non-whitespace text (used to drop blank rows on load / avoid duplicate empties). */
function rowHasTableData(master: CertificateMaster, row: RowDraft): boolean {
  const tableIds = master.fields
    .filter((f) => !f.isQuestion)
    .map((f) => Number(f.id))
    .filter((id) => Number.isFinite(id));
  return tableIds.some((id) => {
    const v = row.fields.find((x) => x.certificateFieldMasterId === id)?.value ?? "";
    return String(v).trim() !== "";
  });
}

/** Keep only rows with data; if none, show a single empty row for editing. */
function normalizeTableRowsForMaster(master: CertificateMaster, rows: RowDraft[]): RowDraft[] {
  if (isInternshipOnlySection(master.name)) return rows;
  const tableFields = master.fields.filter((f) => !f.isQuestion);
  if (tableFields.length === 0) return rows.length > 0 ? rows : [buildEmptyRowDraft(master)];
  const nonEmpty = rows.filter((r) => rowHasTableData(master, r));
  if (nonEmpty.length > 0) return nonEmpty;
  return [buildEmptyRowDraft(master)];
}

export default function CareerProgressionPage() {
  const { student } = useStudent();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cpData, setCpData] = useState<CareerProgressionTemplatePayload | null>(null);

  const [rowsByMaster, setRowsByMaster] = useState<Record<string, RowDraft[]>>({});
  const [questionByField, setQuestionByField] = useState<Record<number, string>>({});

  const studentGenderRaw = String(
    (
      student as {
        gender?: string | null;
        personalDetails?: { gender?: string | null };
      } | null
    )?.personalDetails?.gender ??
      (
        student as {
          gender?: string | null;
          personalDetails?: { gender?: string | null };
        } | null
      )?.gender ??
      "",
  ).trim();
  const studentGender = studentGenderRaw.toUpperCase();
  const careerProgressionImageSrc =
    studentGender.includes("FEMALE") || studentGender === "F"
      ? `${process.env.NEXT_PUBLIC_URL}/career-progression-female.png`
      : `${process.env.NEXT_PUBLIC_URL}/career-progression-male.png`;

  const getMasterKey = (master: CertificateMaster, idx: number) => {
    const idNum = Number(master.id);
    if (Number.isFinite(idNum) && idNum > 0) return `master_${idNum}`;
    return `master_${master.name}_${idx}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!student?.id) return;
      const currentClassName = (
        student as { currentPromotion?: { class?: { name?: string | null } | null } | null }
      )?.currentPromotion?.class?.name;

      if (isFirstSemesterClassName(currentClassName)) {
        setLoading(false);
        await Swal.fire({
          icon: "info",
          title: "Not available yet",
          text: "Career progression is available from Semester 2 onward. Semester 1 students use Enrolment & Fees for payments only.",
        });
        router.replace("/dashboard/enrollment-fees");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data } = await axiosInstance.get<ApiResponse<CareerProgressionTemplatePayload>>(
          `/api/academics/career-progression-forms/student/${student.id}/current`,
        );
        const payload = data?.payload ?? null;
        if (payload && !payload.hasExistingForms) {
          setCpData(payload);
          setLoading(false);
          await Swal.fire({
            icon: "info",
            title: "Use Enrolment & Fees first",
            text: "Submit your career progression form once from Enrolment & Fees before opening this page.",
          });
          router.replace("/dashboard/enrollment-fees");
          return;
        }
        setCpData(payload);
      } catch (e) {
        console.error(e);
        setError("Failed to load career progression form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [
    student?.id,
    (student as { currentPromotion?: { class?: { name?: string | null } | null } | null } | null)
      ?.currentPromotion?.class?.name,
    router,
  ]);

  useEffect(() => {
    if (!cpData || cpData.hasExistingForms) return;
    const sorted = sortCpCertificateMasters(cpData.certificateMasters);
    setRowsByMaster((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Record<string, RowDraft[]> = {};
      sorted.forEach((master, idx) => {
        const hasTableFields = master.fields.some((f) => !f.isQuestion);
        if (!isInternshipOnlySection(master.name) && hasTableFields) {
          next[getMasterKey(master, idx)] = [buildEmptyRowDraft(master)];
        }
      });
      return next;
    });
  }, [cpData?.academicYear?.id, cpData?.hasExistingForms]);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!student?.id || !cpData?.hasExistingForms) return;
      try {
        const { data } = await axiosInstance.get<ApiResponse<CareerProgressionFormPayload[]>>(
          `/api/academics/career-progression-forms?studentId=${student.id}`,
        );
        const forms = Array.isArray(data?.payload) ? data.payload : [];
        const currentForm = [...forms]
          .reverse()
          .find((f) => Number(f.academicYear?.id) === Number(cpData.academicYear.id));
        if (!currentForm) return;

        const nextRowsByMaster: Record<string, RowDraft[]> = {};
        const nextQuestionByField: Record<number, string> = {};

        sortCpCertificateMasters(cpData.certificateMasters).forEach((master, idx) => {
          const masterId = Number(master.id);
          const masterKey = getMasterKey(master, idx);
          const questionIds = new Set(
            master.fields.filter((f) => f.isQuestion).map((f) => Number(f.id)),
          );
          const tableIds = new Set(
            master.fields.filter((f) => !f.isQuestion).map((f) => Number(f.id)),
          );

          const certsForMaster = currentForm.certificates.filter(
            (c) => Number(c.certificateMaster?.id) === masterId,
          );
          if (!certsForMaster.length) return;

          const rows: RowDraft[] = [];
          certsForMaster.forEach((cert) => {
            const rowFields: RowField[] = [];
            cert.fields.forEach((field) => {
              const fieldId = Number(field.certificateFieldMaster?.id);
              if (!fieldId) return;
              const value = (
                field.value ??
                field.certificateFieldOptionMaster?.name ??
                ""
              ).toString();
              if (!value) return;
              if (questionIds.has(fieldId)) {
                if (!nextQuestionByField[fieldId]) nextQuestionByField[fieldId] = value;
              } else if (tableIds.has(fieldId)) {
                rowFields.push({ certificateFieldMasterId: fieldId, value });
              }
            });
            if (rowFields.length > 0) {
              rows.push({
                certificateMasterId: masterId,
                fields: rowFields,
              });
            }
          });

          if (rows.length > 0) {
            nextRowsByMaster[masterKey] = normalizeTableRowsForMaster(master, rows);
          }
        });

        sortCpCertificateMasters(cpData.certificateMasters).forEach((master, idx) => {
          const mk = getMasterKey(master, idx);
          if (!nextRowsByMaster[mk]?.length && !isInternshipOnlySection(master.name)) {
            nextRowsByMaster[mk] = [buildEmptyRowDraft(master)];
          }
        });

        setRowsByMaster(nextRowsByMaster);
        setQuestionByField(nextQuestionByField);
      } catch (e) {
        console.error("Failed to load existing career progression data", e);
      }
    };
    loadExistingData();
  }, [student?.id, cpData?.academicYear?.id, cpData?.hasExistingForms]);

  const appendEmptyRow = (master: CertificateMaster, idx: number) => {
    const key = getMasterKey(master, idx);
    setRowsByMaster((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), buildEmptyRowDraft(master)],
    }));
  };

  const updateRowCell = (
    master: CertificateMaster,
    masterKey: string,
    rowIdx: number,
    fieldId: number,
    value: string,
  ) => {
    setRowsByMaster((prev) => {
      const current = prev[masterKey] || [];
      const row = current[rowIdx];
      if (!row) return prev;
      const tableFields = master.fields
        .filter((f) => !f.isQuestion)
        .sort((a, b) => a.sequence - b.sequence);
      const values: Record<number, string> = {};
      tableFields.forEach((f) => {
        if (f.id == null) return;
        const fid = Number(f.id);
        values[fid] = row.fields.find((rf) => rf.certificateFieldMasterId === fid)?.value ?? "";
      });
      values[fieldId] = value;
      const newRow = buildRowDraftFromEditingValues(master, values, Number(master.id) || 0);
      const next = [...current];
      next[rowIdx] = newRow;
      return { ...prev, [masterKey]: next };
    });
  };

  const canSave = useMemo(() => {
    if (!cpData) return false;
    const sortedMasters = sortCpCertificateMasters(cpData.certificateMasters);
    for (let idx = 0; idx < sortedMasters.length; idx++) {
      const master = sortedMasters[idx];
      const key = getMasterKey(master, idx);
      const rows = rowsByMaster[key] || [];
      const questionReq = master.fields.filter(
        (f) => f.isQuestion && (f.isRequired || f.isQuestion),
      );
      for (const qf of questionReq) {
        const val = questionByField[Number(qf.id)] || "";
        if (!val.trim()) return false;
      }
      const requiredTableFields = isInternshipOnlySection(master.name)
        ? []
        : master.fields.filter((f) => !f.isQuestion && f.isRequired);
      if (requiredTableFields.length > 0) {
        if (rows.length === 0) return false;
        for (const row of rows) {
          for (const rf of requiredTableFields) {
            const v =
              row.fields.find((x) => x.certificateFieldMasterId === Number(rf.id))?.value || "";
            if (!v.trim()) return false;
          }
        }
      }
    }
    return true;
  }, [cpData, questionByField, rowsByMaster]);

  const handleSaveForm = async () => {
    if (!student?.id || !cpData) return;
    try {
      setSaving(true);
      const certificates: Array<{
        certificateMasterId: number;
        fields: Array<{
          certificateFieldMasterId: number;
          certificateFieldOptionMasterId?: number | null;
          value?: string | null;
        }>;
      }> = [];

      sortCpCertificateMasters(cpData.certificateMasters).forEach((master, idx) => {
        const key = getMasterKey(master, idx);
        const rows = rowsByMaster[key] || [];
        const questionFields = master.fields.filter((f) => f.isQuestion);
        const tableFields = isInternshipOnlySection(master.name)
          ? []
          : master.fields.filter((f) => !f.isQuestion);

        const qMapped = questionFields
          .map((f) => {
            const raw = (questionByField[Number(f.id)] || "").trim();
            if (!raw) return null;
            const selectedOpt = f.options.find((o) => o.name === raw);
            return {
              certificateFieldMasterId: Number(f.id),
              certificateFieldOptionMasterId: selectedOpt?.id ? Number(selectedOpt.id) : null,
              value: raw,
            };
          })
          .filter(Boolean) as Array<{
          certificateFieldMasterId: number;
          certificateFieldOptionMasterId?: number | null;
          value?: string | null;
        }>;

        if (rows.length === 0 && qMapped.length > 0) {
          certificates.push({ certificateMasterId: Number(master.id), fields: qMapped });
          return;
        }

        rows.forEach((row) => {
          const mappedRowFields = row.fields
            .map((rf) => {
              const fm = tableFields.find((f) => Number(f.id) === rf.certificateFieldMasterId);
              if (!fm) return null;
              const raw = (rf.value || "").trim();
              if (!raw) return null;
              const selectedOpt =
                fm.type === "SELECT" ? fm.options.find((o) => o.name === raw) : null;
              return {
                certificateFieldMasterId: rf.certificateFieldMasterId,
                certificateFieldOptionMasterId: selectedOpt?.id ? Number(selectedOpt.id) : null,
                value: raw,
              };
            })
            .filter(Boolean) as Array<{
            certificateFieldMasterId: number;
            certificateFieldOptionMasterId?: number | null;
            value?: string | null;
          }>;

          const merged = [...qMapped, ...mappedRowFields];
          if (merged.length === 0) return;

          certificates.push({
            certificateMasterId: Number(master.id),
            fields: merged,
          });
        });
      });

      await axiosInstance.post(
        `/api/academics/career-progression-forms/student/${student.id}/current/submit`,
        { certificates, academicYearId: cpData.academicYear.id },
      );

      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Career progression form saved successfully.",
        confirmButtonColor: "#7c3aed",
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "We could not save your career progression form. Please try again.",
        confirmButtonColor: "#7c3aed",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !cpData?.hasExistingForms) {
      router.replace("/dashboard/enrollment-fees");
    }
  }, [loading, cpData?.hasExistingForms, router]);

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
      </Card>
    );
  }

  if (!cpData?.hasExistingForms) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-lg border border-indigo-200 bg-white">
            <img
              src={careerProgressionImageSrc}
              alt="Career progression"
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-700" />
              <p className="text-lg font-semibold text-indigo-900">Career Progression Form</p>
            </div>
            <p className="mt-1 text-sm text-indigo-800">
              Academic Year: {cpData.academicYear.year}
            </p>
          </div>
        </div>
      </div>

      {sortCpCertificateMasters(cpData.certificateMasters).map((cm, idx) => {
        const masterId = Number(cm.id);
        const masterKey = getMasterKey(cm, idx);
        const sortedFields = cm.fields.slice().sort((a, b) => a.sequence - b.sequence);
        const questionFields = sortedFields.filter((f) => f.isQuestion);
        const tableFields = orderTableFieldsTypeFirst(sortedFields.filter((f) => !f.isQuestion));
        const rows = rowsByMaster[masterKey] || [];
        const isInternshipOnly = isInternshipOnlySection(cm.name);
        const showTable = !isInternshipOnly && tableFields.length > 0;
        const isInternshipWorkLayout = usesInternshipWorkRowLayout(cm.name);
        return (
          <div
            key={`${cm.name}-${idx}`}
            className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-100 via-white to-slate-100 px-5 py-4">
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">
                  {String.fromCharCode(65 + idx)}. {cm.name}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{cm.description}</p>
              </div>
              {!isInternshipWorkLayout && showTable ? (
                <Button
                  size="sm"
                  className="shrink-0 bg-violet-600 text-sm text-white hover:bg-violet-700"
                  onClick={() => appendEmptyRow(cm, idx)}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Row
                </Button>
              ) : null}
            </div>

            <div className="bg-white px-5 pb-5 pt-4">
              {questionFields.length > 0 ? (
                <div className="mb-5 space-y-4 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                  {questionFields.map((qf) => {
                    const qfId = Number(qf.id);
                    return (
                      <div
                        key={`${masterId}-${qfId}`}
                        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                      >
                        <label className="text-base font-semibold leading-snug text-slate-800">
                          {qf.name}
                          {qf.isRequired || qf.isQuestion ? (
                            <span className="ml-1 text-red-600">*</span>
                          ) : null}
                        </label>
                        {qf.type === "SELECT" ? (
                          <Select
                            value={questionByField[qfId] || ""}
                            onValueChange={(next) =>
                              setQuestionByField((prev) => ({ ...prev, [qfId]: next }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-11 w-full max-w-[260px] bg-white text-base md:mt-0 md:justify-self-end">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              {qf.options.map((opt) => (
                                <SelectItem key={`${qfId}-${opt.id}-${opt.name}`} value={opt.name}>
                                  {opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <input
                            className="mt-1 h-11 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-base outline-none md:mt-0"
                            value={questionByField[qfId] || ""}
                            onChange={(e) =>
                              setQuestionByField((prev) => ({ ...prev, [qfId]: e.target.value }))
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {isInternshipWorkLayout && showTable ? (
                <div className="mb-4 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-violet-600 text-sm text-white hover:bg-violet-700"
                    onClick={() => appendEmptyRow(cm, idx)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Row
                  </Button>
                </div>
              ) : null}

              {showTable ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                    <thead className="bg-slate-100/90 text-slate-800">
                      <tr>
                        {tableFields.map((f) => (
                          <th
                            key={`${masterId}-${f.id}`}
                            className="border border-slate-200 px-3 py-3 text-left text-sm font-semibold whitespace-normal break-words"
                          >
                            {f.name.toUpperCase()}
                            {f.isRequired ? <span className="ml-1 text-red-600">*</span> : null}
                          </th>
                        ))}
                        <th className="w-[120px] border border-slate-200 px-3 py-3 text-left text-sm font-semibold whitespace-normal break-words">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            className="border px-3 py-6 text-center text-sm text-slate-500"
                            colSpan={tableFields.length + 1}
                          >
                            No rows yet. Use "Add Row" to add one.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, rowIdx) => (
                          <tr key={`${masterId}-row-${rowIdx}`}>
                            {tableFields.map((f) => {
                              const fieldId = Number(f.id);
                              const cellValue =
                                row.fields.find((rf) => rf.certificateFieldMasterId === fieldId)
                                  ?.value ?? "";
                              return (
                                <td
                                  key={`${masterId}-${rowIdx}-${fieldId}`}
                                  className="border border-slate-200 p-2 align-top whitespace-normal break-words"
                                >
                                  {f.type === "SELECT" ? (
                                    <Select
                                      value={cellValue}
                                      onValueChange={(nextValue) =>
                                        updateRowCell(cm, masterKey, rowIdx, fieldId, nextValue)
                                      }
                                    >
                                      <SelectTrigger className="h-10 w-full text-sm">
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {f.options.map((opt) => (
                                          <SelectItem key={`${fieldId}-${opt.id}`} value={opt.name}>
                                            {opt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <input
                                      type="text"
                                      inputMode={f.type === "NUMBER" ? "numeric" : undefined}
                                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                                      value={cellValue}
                                      onChange={(e) =>
                                        updateRowCell(
                                          cm,
                                          masterKey,
                                          rowIdx,
                                          fieldId,
                                          f.type === "NUMBER"
                                            ? e.target.value.replace(/[^\d]/g, "")
                                            : e.target.value,
                                        )
                                      }
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="border border-slate-200 p-2 align-top whitespace-normal break-words">
                              {rows.length > 1 || shouldAlwaysShowDeleteForSection(cm.name) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 w-9 border-slate-300 p-0 text-rose-700 hover:bg-rose-50"
                                  onClick={() =>
                                    setRowsByMaster((prev) => ({
                                      ...prev,
                                      [masterKey]: (prev[masterKey] || []).filter(
                                        (_, i) => i !== rowIdx,
                                      ),
                                    }))
                                  }
                                  title="Delete row"
                                  aria-label="Delete row"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button
          className="bg-violet-600 px-6 text-white hover:bg-violet-700"
          disabled={!canSave || saving}
          onClick={handleSaveForm}
        >
          {saving ? "Saving..." : "Save Form"}
        </Button>
      </div>
    </div>
  );
}
