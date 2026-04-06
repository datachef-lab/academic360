"use client";

import { useEffect, useMemo, useState } from "react";
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
import { axiosInstance } from "@/lib/utils";
import { useStudent } from "@/providers/student-provider";
import { Check, CircleMinus, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";

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

export default function CareerProgressionPage() {
  const { student } = useStudent();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [cpData, setCpData] = useState<CareerProgressionTemplatePayload | null>(null);

  const [rowsByMaster, setRowsByMaster] = useState<Record<string, RowDraft[]>>({});
  const [questionByField, setQuestionByField] = useState<Record<number, string>>({});
  const [editingMasterKey, setEditingMasterKey] = useState<string | null>(null);
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<number, string>>({});
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
      ? "/career-progression-female.png"
      : "/career-progression-male.png";

  const getMasterKey = (master: CertificateMaster, idx: number) => {
    const idNum = Number(master.id);
    if (Number.isFinite(idNum) && idNum > 0) return `master_${idNum}`;
    return `master_${master.name}_${idx}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!student?.id) return;
      try {
        setLoading(true);
        setError(null);
        const { data } = await axiosInstance.get<ApiResponse<CareerProgressionTemplatePayload>>(
          `/api/academics/career-progression-forms/student/${student.id}/current`,
        );
        setCpData(data?.payload ?? null);
      } catch (e) {
        console.error(e);
        setError("Failed to load career progression form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [student?.id]);

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

        cpData.certificateMasters
          .slice()
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
          .forEach((master, idx) => {
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

            if (rows.length > 0) nextRowsByMaster[masterKey] = rows;
          });

        setRowsByMaster(nextRowsByMaster);
        setQuestionByField(nextQuestionByField);
      } catch (e) {
        console.error("Failed to load existing career progression data", e);
      }
    };
    loadExistingData();
  }, [student?.id, cpData?.academicYear?.id, cpData?.hasExistingForms]);

  const startAddRow = (master: CertificateMaster, idx: number) => {
    const masterId = Number(master.id) || 0;
    const key = getMasterKey(master, idx);
    const initial: Record<number, string> = {};
    master.fields
      .filter((f) => !f.isQuestion)
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((f) => {
        if (f.id) initial[Number(f.id)] = "";
      });
    setEditingMasterKey(key);
    setEditingMasterId(masterId);
    setEditingRowIndex(null);
    setEditingValues(initial);
  };

  const startEditRow = (master: CertificateMaster, rowIdx: number, idx: number) => {
    const key = getMasterKey(master, idx);
    const row = rowsByMaster[key]?.[rowIdx];
    if (!row) return;
    const values: Record<number, string> = {};
    row.fields.forEach((f) => (values[f.certificateFieldMasterId] = f.value));
    setEditingMasterKey(key);
    setEditingMasterId(Number(master.id) || 0);
    setEditingRowIndex(rowIdx);
    setEditingValues(values);
  };

  const saveRow = () => {
    if (!editingMasterKey) return;
    const row: RowDraft = {
      certificateMasterId: editingMasterId || 0,
      fields: Object.entries(editingValues).map(([id, value]) => ({
        certificateFieldMasterId: Number(id),
        value: value ?? "",
      })),
    };
    setRowsByMaster((prev) => {
      const current = prev[editingMasterKey] || [];
      if (editingRowIndex == null) return { ...prev, [editingMasterKey]: [...current, row] };
      const next = [...current];
      next[editingRowIndex] = row;
      return { ...prev, [editingMasterKey]: next };
    });
    setEditingMasterKey(null);
    setEditingMasterId(null);
    setEditingRowIndex(null);
    setEditingValues({});
  };

  const canSave = useMemo(() => {
    if (!cpData) return false;
    for (let idx = 0; idx < cpData.certificateMasters.length; idx++) {
      const master = cpData.certificateMasters[idx];
      const key = getMasterKey(master, idx);
      const rows = rowsByMaster[key] || [];
      const questionReq = master.fields.filter(
        (f) => f.isQuestion && (f.isRequired || f.isQuestion),
      );
      for (const qf of questionReq) {
        const val = questionByField[Number(qf.id)] || "";
        if (!val.trim()) return false;
      }
      const requiredTableFields = master.fields.filter((f) => !f.isQuestion && f.isRequired);
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
      setSavedMsg(null);
      const certificates: Array<{
        certificateMasterId: number;
        fields: Array<{
          certificateFieldMasterId: number;
          certificateFieldOptionMasterId?: number | null;
          value?: string | null;
        }>;
      }> = [];

      cpData.certificateMasters.forEach((master, idx) => {
        const key = getMasterKey(master, idx);
        const rows = rowsByMaster[key] || [];
        const questionFields = master.fields.filter((f) => f.isQuestion);
        const tableFields = master.fields.filter((f) => !f.isQuestion);

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

          certificates.push({
            certificateMasterId: Number(master.id),
            fields: [...qMapped, ...mappedRowFields],
          });
        });
      });

      await axiosInstance.post(
        `/api/academics/career-progression-forms/student/${student.id}/current/submit`,
        { certificates },
      );

      setSavedMsg("Career progression form saved successfully.");
    } catch (e) {
      console.error(e);
      setError("Failed to save career progression form");
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
              <p className="font-semibold text-indigo-900">Career Progression Form</p>
            </div>
            <p className="mt-1 text-xs text-indigo-700">
              Academic Year: {cpData.academicYear.year}
            </p>
          </div>
        </div>
      </div>

      {savedMsg ? (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{savedMsg}</div>
      ) : null}

      {cpData.certificateMasters
        .slice()
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .map((cm, idx) => {
          const masterId = Number(cm.id);
          const masterKey = getMasterKey(cm, idx);
          const sortedFields = cm.fields.slice().sort((a, b) => a.sequence - b.sequence);
          const questionFields = sortedFields.filter((f) => f.isQuestion);
          const tableFields = sortedFields.filter((f) => !f.isQuestion);
          const rows = rowsByMaster[masterKey] || [];
          const isEditing = editingMasterKey === masterKey;
          const sectionTint =
            idx % 2 === 0 ? "border-sky-200/70 bg-sky-50" : "border-emerald-200/70 bg-emerald-50";
          return (
            <div key={`${cm.name}-${idx}`} className={`rounded-xl border ${sectionTint}`}>
              <div className="flex items-start justify-between gap-3 border-b border-black/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {String.fromCharCode(65 + idx)}. {cm.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{cm.description}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => startAddRow(cm, idx)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
                </Button>
              </div>

              <div className="p-4">
                {questionFields.length > 0 ? (
                  <div className="mb-4 space-y-3 rounded-lg border border-slate-200/80 bg-white/70 p-4">
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
                              <SelectTrigger className="mt-1 h-10 w-full max-w-[240px] bg-white text-base md:mt-0 md:justify-self-end">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                {qf.options.map((opt) => (
                                  <SelectItem
                                    key={`${qfId}-${opt.id}-${opt.name}`}
                                    value={opt.name}
                                  >
                                    {opt.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <input
                              className="mt-1 h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-base outline-none md:mt-0"
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

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {tableFields.map((f) => (
                          <th
                            key={`${masterId}-${f.id}`}
                            className="border px-2 py-2 text-left font-semibold whitespace-normal break-words"
                          >
                            {f.name.toUpperCase()}
                            {f.isRequired ? <span className="ml-1 text-red-600">*</span> : null}
                          </th>
                        ))}
                        <th className="w-[120px] border px-2 py-2 text-left font-semibold whitespace-normal break-words">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isEditing ? (
                        <tr>
                          {tableFields.map((f) => {
                            const fieldId = Number(f.id);
                            const value = editingValues[fieldId] || "";
                            return (
                              <td
                                key={`${masterId}-edit-${fieldId}`}
                                className="border p-1.5 align-top whitespace-normal break-words"
                              >
                                {f.type === "SELECT" ? (
                                  <Select
                                    value={value}
                                    onValueChange={(nextValue) =>
                                      setEditingValues((prev) => ({
                                        ...prev,
                                        [fieldId]: nextValue,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-full text-xs">
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
                                    className="h-8 w-full rounded px-2 text-xs outline-none"
                                    value={value}
                                    onChange={(e) =>
                                      setEditingValues((prev) => ({
                                        ...prev,
                                        [fieldId]:
                                          f.type === "NUMBER"
                                            ? e.target.value.replace(/[^\d]/g, "")
                                            : e.target.value,
                                      }))
                                    }
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="border p-1.5 align-top whitespace-normal break-words">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-8 w-8 bg-violet-600 p-0 text-white hover:bg-violet-700"
                                onClick={saveRow}
                                title="Save row"
                                aria-label="Save row"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-violet-300 p-0 text-violet-700"
                                onClick={() => setEditingMasterKey(null)}
                                title="Cancel editing row"
                                aria-label="Cancel editing row"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : null}

                      {rows.length === 0 ? (
                        <tr>
                          <td
                            className="border px-3 py-5 text-center text-xs text-slate-500"
                            colSpan={tableFields.length + 1}
                          >
                            No entries yet. Click “Add Row” to begin.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, rowIdx) => (
                          <tr key={`${masterId}-row-${rowIdx}`}>
                            {tableFields.map((f) => {
                              const fieldId = Number(f.id);
                              const v =
                                row.fields.find((rf) => rf.certificateFieldMasterId === fieldId)
                                  ?.value || "-";
                              return (
                                <td
                                  key={`${masterId}-${rowIdx}-${fieldId}`}
                                  className="border px-2 py-2 align-top whitespace-normal break-words"
                                >
                                  {v}
                                </td>
                              );
                            })}
                            <td className="border px-2 py-2 align-top whitespace-normal break-words">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 border-violet-300 p-0 text-violet-700 hover:bg-violet-50"
                                onClick={() => startEditRow(cm, rowIdx, idx)}
                                title="Edit row"
                                aria-label="Edit row"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-2 h-8 w-8 border-rose-300 p-0 text-rose-700 hover:bg-rose-50"
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
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
