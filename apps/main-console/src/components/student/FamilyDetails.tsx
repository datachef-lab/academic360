import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFamilyDetail, updateFamilyDetail } from "@/services/family-details.service";
import { createPerson, updatePerson } from "@/services/person.service";
import type { FamilyDetailDto } from "@repo/db/dtos/user";
import type { AnnualIncome } from "@/types/resources/annual-income.types";
import { ParentType } from "@/types/enums";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, CheckCircle } from "lucide-react";
import { getAllAnnualIncomes } from "@/services/annual-income.service";
import { getAllOccupations } from "@/services/occupation.service";
import { personTitleType } from "@repo/db/enums";

interface FamilyDetailsProps {
  studentId: number;
  initialData?: FamilyDetailDto | null;
}

type Person = {
  id?: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  aadhaarCardNumber: string | null;
  qualification: { id?: number; name?: string } | null;
  occupation: { id?: number; name?: string } | null;
  title: PersonTitle | null;
  officePhone?: string | null;
  image?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type FormState = {
  id?: number;
  studentId: number;
  parentType: ParentType | null;
  fatherDetails: Person | null;
  motherDetails: Person | null;
  guardianDetails: Person | null;
  annualIncome: { id?: number; range?: string } | null;
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-5 w-1.5 rounded bg-gradient-to-b from-violet-500 to-purple-400" />
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="flex-1 border-b border-gray-200 ml-2" />
    </div>
  );
}

// Available person titles
const PERSON_TITLES = personTitleType.enumValues;

type PersonTitle = (typeof PERSON_TITLES)[number];

export default function FamilyDetails({ studentId, initialData }: FamilyDetailsProps) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormState>(() => {
    return {
      id: initialData?.id ?? undefined,
      studentId,
      parentType: initialData?.parentType ?? null,
      fatherDetails: initialData?.father
        ? {
            name: initialData.father.name ?? null,
            email: initialData.father.email ?? null,
            phone: initialData.father.phone ?? null,
            aadhaarCardNumber: initialData.father.aadhaarCardNumber ?? null,
            qualification: initialData.father.qualification ?? null,
            occupation: initialData.father.occupation ?? null,
            title: (initialData.father as { title?: PersonTitle })?.title ?? null,
          }
        : null,
      motherDetails: initialData?.mother
        ? {
            name: initialData.mother.name ?? null,
            email: initialData.mother.email ?? null,
            phone: initialData.mother.phone ?? null,
            aadhaarCardNumber: initialData.mother.aadhaarCardNumber ?? null,
            qualification: initialData.mother.qualification ?? null,
            occupation: initialData.mother.occupation ?? null,
            title: (initialData.mother as { title?: PersonTitle })?.title ?? null,
          }
        : null,
      guardianDetails: initialData?.guardian
        ? {
            name: initialData.guardian.name ?? null,
            email: initialData.guardian.email ?? null,
            phone: initialData.guardian.phone ?? null,
            aadhaarCardNumber: initialData.guardian.aadhaarCardNumber ?? null,
            qualification: initialData.guardian.qualification ?? null,
            occupation: initialData.guardian.occupation ?? null,
            title: (initialData.guardian as { title?: PersonTitle })?.title ?? null,
          }
        : null,
      annualIncome: initialData?.annualIncome
        ? { id: initialData.annualIncome.id, range: (initialData.annualIncome as { range?: string } | null)?.range }
        : null,
    };
  });
  const [annualIncomes, setAnnualIncomes] = useState<AnnualIncome[]>([]);
  const [occupations, setOccupations] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    getAllAnnualIncomes()
      .then((inc) => {
        setAnnualIncomes(inc ?? []);
      })
      .catch(() => {
        setAnnualIncomes([]);
      });
    // Fetch occupations for person fields
    getAllOccupations()
      .then((occ) => setOccupations(occ ?? []))
      .catch(() => setOccupations([]));
  }, []);

  // Keep parentType in sync when initialData changes (e.g., after refresh)
  useEffect(() => {
    if (!initialData) return;
    setFormData((p) => ({
      ...p,
      id: initialData.id ?? p.id,
      parentType: initialData.parentType ?? null,
      annualIncome: initialData.annualIncome
        ? { id: initialData.annualIncome.id, range: (initialData.annualIncome as { range?: string } | null)?.range }
        : null,
      fatherDetails: initialData.father
        ? {
            id: (initialData.father as { id?: number })?.id,
            name: initialData.father.name ?? null,
            email: initialData.father.email ?? null,
            phone: initialData.father.phone ?? null,
            aadhaarCardNumber: initialData.father.aadhaarCardNumber ?? null,
            qualification: initialData.father.qualification ?? null,
            occupation: initialData.father.occupation ?? null,
            title: (initialData.father as { title?: PersonTitle })?.title ?? null,
          }
        : null,
      motherDetails: initialData.mother
        ? {
            id: (initialData.mother as { id?: number })?.id,
            name: initialData.mother.name ?? null,
            email: initialData.mother.email ?? null,
            phone: initialData.mother.phone ?? null,
            aadhaarCardNumber: initialData.mother.aadhaarCardNumber ?? null,
            qualification: initialData.mother.qualification ?? null,
            occupation: initialData.mother.occupation ?? null,
            title: (initialData.mother as { title?: PersonTitle })?.title ?? null,
          }
        : null,
      guardianDetails: initialData.guardian
        ? {
            id: (initialData.guardian as { id?: number })?.id,
            name: initialData.guardian.name ?? null,
            email: initialData.guardian.email ?? null,
            phone: initialData.guardian.phone ?? null,
            aadhaarCardNumber: initialData.guardian.aadhaarCardNumber ?? null,
            qualification: initialData.guardian.qualification ?? null,
            occupation: initialData.guardian.occupation ?? null,
            title: (initialData.guardian as { title?: PersonTitle })?.title ?? null,
          }
        : null,
    }));
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      // Upsert persons first, then update family IDs and scalar fields
      const upsert = async (p: Person | null): Promise<number | null> => {
        if (!p) return null;
        const base = {
          name: p.name ?? null,
          email: p.email ?? null,
          phone: p.phone ?? null,
          aadhaarCardNumber: p.aadhaarCardNumber ?? null,
          occupationId: p.occupation?.id ?? null,
          qualificationId: p.qualification?.id ?? null,
          title: p.title as PersonTitle | null,
        };
        try {
          const maybeId = (p as { id?: number }).id;
          if (typeof maybeId === "number") {
            await updatePerson(maybeId, base);
            return maybeId;
          }
          const created = await createPerson(base);
          return created?.payload?.id ?? null;
        } catch {
          return null;
        }
      };

      const fatherId = await upsert(payload.fatherDetails);
      const motherId = await upsert(payload.motherDetails);
      const guardianId = await upsert(payload.guardianDetails);

      const { id, parentType, annualIncome, studentId } = payload;
      const update = {
        parentType: parentType ?? "BOTH",
        annualIncomeId: annualIncome?.id ?? null,
        fatherDetailsId: fatherId ?? undefined,
        motherDetailsId: motherId ?? undefined,
        guardianDetailsId: guardianId ?? undefined,
      } as const;
      if (typeof id === "number") return updateFamilyDetail(id, update);
      return createFamilyDetail({ studentId, ...update });
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast.success("Family details updated");
      setTimeout(() => setShowSuccess(false), 1200);
      queryClient.invalidateQueries({ queryKey: ["user-profile"], exact: false });
    },
    onError: () => toast.error("Failed to update family details"),
  });

  return (
    <Card className="max-w-5xl mx-auto my-6 shadow border bg-white py-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(formData);
        }}
      >
        <CardContent className="[&_label]:text-xs [&_label]:text-gray-600">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Family Details Form</h2>
          </div>
          {/* Row: Parent Type / Annual Income */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <Label>Parent Type</Label>
              <Select
                value={formData.parentType ?? ""}
                onValueChange={(v) => setFormData((p) => ({ ...p, parentType: v as ParentType }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Parent Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Both</SelectItem>
                  <SelectItem value="FATHER_ONLY">Father Only</SelectItem>
                  <SelectItem value="MOTHER_ONLY">Mother Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Annual Income</Label>
              <Select
                value={formData.annualIncome?.id ? String(formData.annualIncome.id) : ""}
                onValueChange={(v) => {
                  const sel = annualIncomes.find((ai) => String(ai.id) === v) ?? null;
                  setFormData((p) => ({ ...p, annualIncome: sel }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Annual Income" />
                </SelectTrigger>
                <SelectContent>
                  {annualIncomes.map((ai) => (
                    <SelectItem key={ai.id} value={String(ai.id)}>
                      {ai.range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Father's Details */}
          <SectionHeader title="Father's Details" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <Label>Title</Label>
              <Select
                value={formData.fatherDetails?.title ?? ""}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    fatherDetails: { ...(p.fatherDetails ?? {}), title: v } as Person,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  {PERSON_TITLES.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input
                value={formData.fatherDetails?.name ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    fatherDetails: { ...(p.fatherDetails ?? {}), name: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.fatherDetails?.email ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    fatherDetails: { ...(p.fatherDetails ?? {}), email: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Phone</Label>
              <Input
                value={formData.fatherDetails?.phone ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    fatherDetails: { ...(p.fatherDetails ?? {}), phone: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Occupation</Label>
              <Select
                value={formData.fatherDetails?.occupation?.id ? String(formData.fatherDetails.occupation.id) : ""}
                onValueChange={(v) => {
                  const sel = occupations.find((o) => String(o.id) === v) ?? null;
                  setFormData((p) => ({
                    ...p,
                    fatherDetails: { ...(p.fatherDetails ?? {}), occupation: sel } as Person,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Occupation" />
                </SelectTrigger>
                <SelectContent>
                  {occupations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mother's Details */}
          <SectionHeader title="Mother's Details" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <Label>Title</Label>
              <Select
                value={formData.motherDetails?.title ?? ""}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    motherDetails: { ...(p.motherDetails ?? {}), title: v } as Person,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  {PERSON_TITLES.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input
                value={formData.motherDetails?.name ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    motherDetails: { ...(p.motherDetails ?? {}), name: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.motherDetails?.email ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    motherDetails: { ...(p.motherDetails ?? {}), email: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Phone</Label>
              <Input
                value={formData.motherDetails?.phone ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    motherDetails: { ...(p.motherDetails ?? {}), phone: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Occupation</Label>
              <Select
                value={formData.motherDetails?.occupation?.id ? String(formData.motherDetails.occupation.id) : ""}
                onValueChange={(v) => {
                  const sel = occupations.find((o) => String(o.id) === v) ?? null;
                  setFormData((p) => ({
                    ...p,
                    motherDetails: { ...(p.motherDetails ?? {}), occupation: sel } as Person,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Occupation" />
                </SelectTrigger>
                <SelectContent>
                  {occupations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Guardian's Details */}
          <SectionHeader title="Guardian's Details" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <div className="flex flex-col gap-1">
              <Label>Title</Label>
              <Select
                value={formData.guardianDetails?.title ?? ""}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    guardianDetails: { ...(p.guardianDetails ?? {}), title: v } as Person,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  {PERSON_TITLES.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input
                value={formData.guardianDetails?.name ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    guardianDetails: { ...(p.guardianDetails ?? {}), name: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.guardianDetails?.email ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    guardianDetails: { ...(p.guardianDetails ?? {}), email: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Phone</Label>
              <Input
                value={formData.guardianDetails?.phone ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    guardianDetails: { ...(p.guardianDetails ?? {}), phone: e.target.value } as Person,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Occupation</Label>
              <Select
                value={formData.guardianDetails?.occupation?.id ? String(formData.guardianDetails.occupation.id) : ""}
                onValueChange={(v) => {
                  const sel = occupations.find((o) => String(o.id) === v) ?? null;
                  setFormData((p) => ({
                    ...p,
                    guardianDetails: { ...(p.guardianDetails ?? {}), occupation: sel } as Person,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Occupation" />
                </SelectTrigger>
                <SelectContent>
                  {occupations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2">
          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Family Details
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
