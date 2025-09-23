import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PersonalDetailsDto } from "@repo/db/dtos";
import type { ReligionT as UiReligion, CategoryT as UiCategory, NationalityT as UiNationality } from "@repo/db/schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disability } from "@/types/enums";
import { getAllReligions } from "@/services/religion.service";
import { getAllCategories } from "@/services/categories.service";
import { getAllNationalities } from "@/services/nationalities.service";
import { getAllCountries } from "@/services/country.service";
import { getStatesByCountry } from "@/services/state.service";
import { getCitiesByState } from "@/services/city.service";
import { getDistrictsByState } from "@/services/address.service";
import { getAllLanguageMediums } from "@/services/language-medium.service";
import type { LanguageMedium } from "@/types/resources/language-medium.types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updatePersonalDetail, updatePersonalDetailByStudentId } from "@/services/personal-details.service";

function stripDates<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(stripDates) as T;
  if (obj && typeof obj === "object") {
    const input = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const k in input) {
      if (k === "createdAt" || k === "updatedAt") continue;
      const v = input[k];
      result[k] = typeof v === "object" && v !== null ? stripDates(v) : v;
    }
    return result as T;
  }
  return obj;
}

type IdName = { id: number; name: string };

type PersonalDetailProps = {
  studentId: number;
  initialData?: PersonalDetailsDto | null;
  personalEmail?: string | null;
};

function FieldLabel({ children }: { children: string }) {
  return <Label className="text-xs text-gray-600">{children}</Label>;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-5 w-1.5 rounded bg-gradient-to-b from-violet-500 to-purple-400" />
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="flex-1 border-b border-gray-200 ml-2" />
    </div>
  );
}

// Typed helpers to safely update address without using any or {}
type AddressRel = NonNullable<PersonalDetailsDto["residentialAddress"]>;
function ensureAddress(address: PersonalDetailsDto["residentialAddress"]): AddressRel {
  return (
    (address as AddressRel) ??
    ({
      id: 0,
      addressLine: "",
      landmark: "",
      otherCity: null,
      otherState: null,
      otherCountry: null,
      country: null,
      state: null,
      city: null,
      district: null,
    } as unknown as AddressRel)
  );
}

type UpdatePayload = Partial<PersonalDetailsDto>;

export default function PersonalDetailsReadOnly({ studentId, initialData, personalEmail }: PersonalDetailProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>(personalEmail ?? "");
  const [pd, setPd] = useState<PersonalDetailsDto | null>(initialData ?? null);
  const [residentialPostOffice, setResidentialPostOffice] = useState<string>("");
  const [residentialPoliceStation, setResidentialPoliceStation] = useState<string>("");
  const [mailingPostOffice, setMailingPostOffice] = useState<string>("");
  const [mailingPoliceStation, setMailingPoliceStation] = useState<string>("");

  useEffect(() => {
    setPd(initialData ?? null);
  }, [initialData]);

  // Master dropdowns
  const { data: religions } = useQuery({ queryKey: ["religions"], queryFn: getAllReligions });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getAllCategories });
  const { data: nationalities } = useQuery({ queryKey: ["nationalities"], queryFn: getAllNationalities });
  const { data: countries } = useQuery({ queryKey: ["countries"], queryFn: getAllCountries });
  const { data: languages } = useQuery({ queryKey: ["language-mediums"], queryFn: getAllLanguageMediums });

  // Normalize lists to avoid undefined
  const countryOptions: IdName[] = (countries as IdName[] | undefined) ?? [];
  const religionOptions: UiReligion[] = (religions as UiReligion[] | undefined) ?? [];
  const categoryOptions: UiCategory[] = (categories as UiCategory[] | undefined) ?? [];
  const nationalityOptions: UiNationality[] = (nationalities as UiNationality[] | undefined) ?? [];
  const languageOptions: LanguageMedium[] = (languages as LanguageMedium[] | undefined) ?? [];

  // Derived selected IDs for addresses
  const resCountryId = useMemo(
    () => pd?.residentialAddress?.country?.id ?? null,
    [pd?.residentialAddress?.country?.id],
  );
  const resStateId = useMemo(() => pd?.residentialAddress?.state?.id ?? null, [pd?.residentialAddress?.state?.id]);
  const mailCountryId = useMemo(() => pd?.mailingAddress?.country?.id ?? null, [pd?.mailingAddress?.country?.id]);
  const mailStateId = useMemo(() => pd?.mailingAddress?.state?.id ?? null, [pd?.mailingAddress?.state?.id]);

  // Dependent dropdowns: states by country
  const { data: resStates } = useQuery({
    queryKey: ["states-by-country", resCountryId],
    queryFn: () => getStatesByCountry(resCountryId as number),
    enabled: !!resCountryId,
  });
  const { data: mailStates } = useQuery({
    queryKey: ["states-by-country", mailCountryId, "mail"],
    queryFn: () => getStatesByCountry(mailCountryId as number),
    enabled: !!mailCountryId,
  });

  const resStateOptions: IdName[] = (resStates as IdName[] | undefined) ?? [];
  const mailStateOptions: IdName[] = (mailStates as IdName[] | undefined) ?? [];

  // Cities by state
  const { data: resCities } = useQuery({
    queryKey: ["cities-by-state", resStateId],
    queryFn: () => getCitiesByState(resStateId as number),
    enabled: !!resStateId,
  });
  const { data: mailCities } = useQuery({
    queryKey: ["cities-by-state", mailStateId, "mail"],
    queryFn: () => getCitiesByState(mailStateId as number),
    enabled: !!mailStateId,
  });

  const resCityOptions: IdName[] = (resCities as IdName[] | undefined) ?? [];
  const mailCityOptions: IdName[] = (mailCities as IdName[] | undefined) ?? [];

  // Districts by state
  const { data: resDistricts } = useQuery({
    queryKey: ["districts-by-state", resStateId],
    queryFn: () => getDistrictsByState(resStateId as number),
    enabled: !!resStateId,
  });
  const { data: mailDistricts } = useQuery({
    queryKey: ["districts-by-state", mailStateId, "mail"],
    queryFn: () => getDistrictsByState(mailStateId as number),
    enabled: !!mailStateId,
  });

  const resDistrictOptions: IdName[] = (resDistricts as IdName[] | undefined) ?? [];
  const mailDistrictOptions: IdName[] = (mailDistricts as IdName[] | undefined) ?? [];

  const genderOptions: { value: "MALE" | "FEMALE" | "OTHER"; label: string }[] = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];
  const disabilityOptions: { value: Disability; label: string }[] = [
    { value: "VISUAL", label: "Visual" },
    { value: "HEARING_IMPAIRMENT", label: "Hearing Impairment" },
    { value: "VISUAL_IMPAIRMENT", label: "Visual Impairment" },
    { value: "ORTHOPEDIC", label: "Orthopedic" },
    { value: "OTHER", label: "Other" },
  ];

  function buildPayload(): Partial<PersonalDetailsDto> {
    const payload: Partial<PersonalDetailsDto> = {
      ...(pd ?? {}),
      personalEmail: email ?? null,
    } as Partial<PersonalDetailsDto>;
    const cleaned = stripDates(payload) as any;
    // Flatten address relations to basic ids for backend API compatibility
    if (cleaned?.residentialAddress) {
      cleaned.residentialAddress = {
        id: cleaned.residentialAddress.id,
        addressLine: cleaned.residentialAddress.addressLine ?? null,
        pincode: cleaned.residentialAddress.pincode ?? null,
        phone: cleaned.residentialAddress.phone ?? null,
        countryId: cleaned.residentialAddress.country?.id ?? cleaned.residentialAddress.countryId ?? null,
        stateId: cleaned.residentialAddress.state?.id ?? cleaned.residentialAddress.stateId ?? null,
        cityId: cleaned.residentialAddress.city?.id ?? cleaned.residentialAddress.cityId ?? null,
        districtId: cleaned.residentialAddress.district?.id ?? cleaned.residentialAddress.districtId ?? null,
      };
    }
    if (cleaned?.mailingAddress) {
      cleaned.mailingAddress = {
        id: cleaned.mailingAddress.id,
        addressLine: cleaned.mailingAddress.addressLine ?? null,
        pincode: cleaned.mailingAddress.pincode ?? null,
        phone: cleaned.mailingAddress.phone ?? null,
        countryId: cleaned.mailingAddress.country?.id ?? cleaned.mailingAddress.countryId ?? null,
        stateId: cleaned.mailingAddress.state?.id ?? cleaned.mailingAddress.stateId ?? null,
        cityId: cleaned.mailingAddress.city?.id ?? cleaned.mailingAddress.cityId ?? null,
        districtId: cleaned.mailingAddress.district?.id ?? cleaned.mailingAddress.districtId ?? null,
      };
    }
    return cleaned as Partial<PersonalDetailsDto>;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload() as UpdatePayload;
      if (pd?.id) {
        return updatePersonalDetail(String(pd.id), payload);
      }
      return updatePersonalDetailByStudentId(String(studentId), payload);
    },
    onSuccess: () => {
      toast.success("Personal details saved");
      queryClient.invalidateQueries({ queryKey: ["user-profile"], exact: false });
    },
    onError: () => toast.error("Failed to save personal details"),
  });

  return (
    <Card className="max-w-5xl mx-auto my-6 shadow border bg-white py-3">
      <CardContent>
        <div className="pr-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1 md:col-span-2">
              <FieldLabel>Personal Email</FieldLabel>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter personal email" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <FieldLabel>Date of Birth</FieldLabel>
              <Input
                type="date"
                value={pd?.dateOfBirth ?? ""}
                onChange={(e) =>
                  setPd((prev) => (prev ? ({ ...prev, dateOfBirth: e.target.value } as PersonalDetailsDto) : prev))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Place of Birth</FieldLabel>
              <Input
                value={pd?.placeOfBirth ?? ""}
                onChange={(e) => setPd((prev) => (prev ? { ...prev, placeOfBirth: e.target.value } : prev))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Gender</FieldLabel>
              <Select
                value={pd?.gender ?? ""}
                onValueChange={(v) =>
                  setPd((prev) => (prev ? { ...prev, gender: v as "MALE" | "FEMALE" | "OTHER" } : prev))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nationality / Religion / Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <FieldLabel>Nationality</FieldLabel>
              <Select
                value={pd?.nationality?.id ? String(pd.nationality.id) : ""}
                onValueChange={(v) => {
                  const selected = nationalityOptions.find((n) => String(n.id) === v) ?? null;
                  setPd((prev) => (prev ? { ...prev, nationality: selected } : prev));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalityOptions.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Religion</FieldLabel>
              <Select
                value={pd?.religion?.id ? String(pd.religion.id) : ""}
                onValueChange={(v) => {
                  const selected = religionOptions.find((r) => String(r.id) === v) ?? null;
                  setPd((prev) => (prev ? { ...prev, religion: selected } : prev));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {religionOptions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Category</FieldLabel>
              <Select
                value={pd?.category?.id ? String(pd.category.id) : ""}
                onValueChange={(v) => {
                  const selected = categoryOptions.find((c) => String(c.id) === v) ?? null;
                  setPd((prev) => (prev ? { ...prev, category: selected } : prev));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language medium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <FieldLabel>Mother Tongue (Language Medium)</FieldLabel>
              <Select
                value={pd?.motherTongue?.id ? String(pd.motherTongue.id) : ""}
                onValueChange={(v) => {
                  const selected = languageOptions.find((lm) => String(lm.id) === v) ?? null;
                  setPd((prev) =>
                    prev ? { ...prev, motherTongue: selected as unknown as PersonalDetailsDto["motherTongue"] } : prev,
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language medium" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lm) => (
                    <SelectItem key={lm.id} value={String(lm.id)}>
                      {lm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Gujarati</FieldLabel>
              <Select
                value={pd?.isGujarati ? "YES" : "NO"}
                onValueChange={(v) => setPd((prev) => (prev ? { ...prev, isGujarati: v === "YES" } : prev))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Yes</SelectItem>
                  <SelectItem value="NO">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Disability</FieldLabel>
              <Select
                value={pd?.disability ?? ""}
                onValueChange={(v) => setPd((prev) => (prev ? { ...prev, disability: v as Disability } : prev))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select disability" />
                </SelectTrigger>
                <SelectContent>
                  {disabilityOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Identification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <FieldLabel>Aadhaar Number</FieldLabel>
              <Input
                value={pd?.aadhaarCardNumber ?? ""}
                onChange={(e) => setPd((prev) => (prev ? { ...prev, aadhaarCardNumber: e.target.value } : prev))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Passport Number</FieldLabel>
              <Input
                value={pd?.passportNumber ?? ""}
                onChange={(e) => setPd((prev) => (prev ? { ...prev, passportNumber: e.target.value } : prev))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Voter ID</FieldLabel>
              <Input
                value={pd?.voterId ?? ""}
                onChange={(e) => setPd((prev) => (prev ? { ...prev, voterId: e.target.value } : prev))}
              />
            </div>
          </div>

          {/* Residential Address */}
          <div className="mt-6">
            <SectionHeader title="Residential Address" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <FieldLabel>Country</FieldLabel>
                <Select
                  value={pd?.residentialAddress?.country?.id ? String(pd.residentialAddress.country.id) : ""}
                  onValueChange={(v) => {
                    const selected = countryOptions.find((c) => String(c.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              country: selected as unknown as AddressRel["country"],
                              state: null,
                              city: null,
                              district: null,
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>State</FieldLabel>
                <Select
                  value={pd?.residentialAddress?.state?.id ? String(pd.residentialAddress.state.id) : ""}
                  onValueChange={(v) => {
                    const selected = resStateOptions.find((s) => String(s.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              state: selected as unknown as AddressRel["state"],
                              city: null,
                              district: null,
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {resStateOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>City</FieldLabel>
                <Select
                  value={pd?.residentialAddress?.city?.id ? String(pd.residentialAddress.city.id) : ""}
                  onValueChange={(v) => {
                    const selected = resCityOptions.find((c) => String(c.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              city: selected as unknown as AddressRel["city"],
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {resCityOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>District</FieldLabel>
                <Select
                  value={
                    pd?.residentialAddress?.district?.id
                      ? String((pd.residentialAddress.district as unknown as IdName).id)
                      : ""
                  }
                  onValueChange={(v) => {
                    const selected = resDistrictOptions.find((d) => String(d.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              district: selected as unknown as AddressRel["district"],
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {resDistrictOptions.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Post Office</FieldLabel>
                <Input value={residentialPostOffice} onChange={(e) => setResidentialPostOffice(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Police Station</FieldLabel>
                <Input value={residentialPoliceStation} onChange={(e) => setResidentialPoliceStation(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Address Line</FieldLabel>
                <Input
                  value={pd?.residentialAddress?.addressLine ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              addressLine: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Pincode</FieldLabel>
                <Input
                  value={pd?.residentialAddress?.pincode ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              pincode: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={pd?.residentialAddress?.phone ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            residentialAddress: {
                              ...ensureAddress(prev.residentialAddress),
                              phone: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Mailing Address */}
          <div className="mt-6">
            <SectionHeader title="Mailing Address" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <FieldLabel>Country</FieldLabel>
                <Select
                  value={pd?.mailingAddress?.country?.id ? String(pd.mailingAddress.country.id) : ""}
                  onValueChange={(v) => {
                    const selected = countryOptions.find((c) => String(c.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              country: selected as unknown as AddressRel["country"],
                              state: null,
                              city: null,
                              district: null,
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>State</FieldLabel>
                <Select
                  value={pd?.mailingAddress?.state?.id ? String(pd.mailingAddress.state.id) : ""}
                  onValueChange={(v) => {
                    const selected = mailStateOptions.find((s) => String(s.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              state: selected as unknown as AddressRel["state"],
                              city: null,
                              district: null,
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {mailStateOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>City</FieldLabel>
                <Select
                  value={pd?.mailingAddress?.city?.id ? String(pd.mailingAddress.city.id) : ""}
                  onValueChange={(v) => {
                    const selected = mailCityOptions.find((c) => String(c.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              city: selected as unknown as AddressRel["city"],
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {mailCityOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>District</FieldLabel>
                <Select
                  value={
                    pd?.mailingAddress?.district?.id ? String((pd.mailingAddress.district as unknown as IdName).id) : ""
                  }
                  onValueChange={(v) => {
                    const selected = mailDistrictOptions.find((d) => String(d.id) === v) ?? null;
                    setPd((prev) =>
                      prev
                        ? {
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              district: selected as unknown as AddressRel["district"],
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {mailDistrictOptions.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Post Office</FieldLabel>
                <Input value={mailingPostOffice} onChange={(e) => setMailingPostOffice(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Police Station</FieldLabel>
                <Input value={mailingPoliceStation} onChange={(e) => setMailingPoliceStation(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Address Line</FieldLabel>
                <Input
                  value={pd?.mailingAddress?.addressLine ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              addressLine: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Pincode</FieldLabel>
                <Input
                  value={pd?.mailingAddress?.pincode ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              pincode: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={pd?.mailingAddress?.phone ?? ""}
                  onChange={(e) =>
                    setPd((prev) =>
                      prev
                        ? ({
                            ...prev,
                            mailingAddress: {
                              ...ensureAddress(prev.mailingAddress),
                              phone: e.target.value,
                            },
                          } as PersonalDetailsDto)
                        : prev,
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end mt-4">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {mutation.isLoading ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
