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
import { updateAddress } from "@/services/address.service";

function stripDates<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (key === "createdAt" || key === "updatedAt" ? undefined : value)),
  ) as T;
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

// Typed helpers to safely update address without unsafe casts
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
    } as AddressRel)
  );
}

type UpdatePayload = Partial<PersonalDetailsDto>;

type AddressExtras = {
  otherPostoffice?: string | null;
  otherPoliceStation?: string | null;
};

type AddressUpdate = {
  id?: number;
  addressLine?: string | null;
  pincode?: string | null;
  phone?: string | null;
  countryId?: number | null;
  stateId?: number | null;
  cityId?: number | null;
  districtId?: number | null;
} & AddressExtras;

export default function PersonalDetailsReadOnly({ studentId, initialData, personalEmail }: PersonalDetailProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>(personalEmail ?? "");
  const [pd, setPd] = useState<PersonalDetailsDto | null>(initialData ?? null);
  const [residentialPostOffice, setResidentialPostOffice] = useState<string>("");
  const [residentialPoliceStation, setResidentialPoliceStation] = useState<string>("");
  const [mailingPostOffice, setMailingPostOffice] = useState<string>("");
  const [mailingPoliceStation, setMailingPoliceStation] = useState<string>("");
  // Local selection state to avoid assigning partial objects to DTO relations
  const [resCountryIdSel, setResCountryIdSel] = useState<number | null>(
    initialData?.residentialAddress?.country?.id ?? null,
  );
  const [resStateIdSel, setResStateIdSel] = useState<number | null>(initialData?.residentialAddress?.state?.id ?? null);
  const [resCityIdSel, setResCityIdSel] = useState<number | null>(initialData?.residentialAddress?.city?.id ?? null);
  const [resDistrictId, setResDistrictId] = useState<number | null>(
    initialData?.residentialAddress?.district?.id ?? null,
  );
  const [mailCountryIdSel, setMailCountryIdSel] = useState<number | null>(
    initialData?.mailingAddress?.country?.id ?? null,
  );
  const [mailStateIdSel, setMailStateIdSel] = useState<number | null>(initialData?.mailingAddress?.state?.id ?? null);
  const [mailCityIdSel, setMailCityIdSel] = useState<number | null>(initialData?.mailingAddress?.city?.id ?? null);
  const [mailDistrictId, setMailDistrictId] = useState<number | null>(
    initialData?.mailingAddress?.district?.id ?? null,
  );

  useEffect(() => {
    setPd(initialData ?? null);
    const resAddr = initialData?.residentialAddress as (AddressRel & AddressExtras) | null | undefined;
    const mailAddr = initialData?.mailingAddress as (AddressRel & AddressExtras) | null | undefined;
    setResidentialPostOffice(resAddr?.otherPostoffice ?? "");
    setResidentialPoliceStation(resAddr?.otherPoliceStation ?? "");
    setMailingPostOffice(mailAddr?.otherPostoffice ?? "");
    setMailingPoliceStation(mailAddr?.otherPoliceStation ?? "");
    setResCountryIdSel(initialData?.residentialAddress?.country?.id ?? null);
    setResStateIdSel(initialData?.residentialAddress?.state?.id ?? null);
    setResCityIdSel(initialData?.residentialAddress?.city?.id ?? null);
    setResDistrictId(initialData?.residentialAddress?.district?.id ?? null);
    setMailCountryIdSel(initialData?.mailingAddress?.country?.id ?? null);
    setMailStateIdSel(initialData?.mailingAddress?.state?.id ?? null);
    setMailCityIdSel(initialData?.mailingAddress?.city?.id ?? null);
    setMailDistrictId(initialData?.mailingAddress?.district?.id ?? null);
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

  // Selected IDs for addresses (from local state)
  const resCountryId = resCountryIdSel;
  const resStateId = resStateIdSel;
  const mailCountryId = mailCountryIdSel;
  const mailStateId = mailStateIdSel;

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

  // Ensure currently selected residential district is visible even if it doesn't belong to the loaded state options
  type DistrictLike = { id: number; name?: string } | null | undefined;
  const resSelectedDistrict = pd?.residentialAddress?.district as DistrictLike;
  const resDistrictOptionsWithSelected = useMemo(() => {
    const list = [...resDistrictOptions];
    if (resSelectedDistrict?.id != null && !list.some((d) => String(d.id) === String(resSelectedDistrict.id))) {
      const name =
        resSelectedDistrict && typeof (resSelectedDistrict as { name?: string }).name === "string"
          ? (resSelectedDistrict as { name?: string }).name!
          : `#${resSelectedDistrict?.id}`;
      list.unshift({ id: Number(resSelectedDistrict.id), name });
    }
    return list;
  }, [resDistrictOptions, resSelectedDistrict?.id]);

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
    const cleaned = stripDates(payload) as Partial<PersonalDetailsDto>;
    // Flatten address relations to basic ids for backend API compatibility
    if (cleaned?.residentialAddress) {
      const ra = cleaned.residentialAddress;
      (cleaned as Partial<{ residentialAddress: AddressUpdate }>).residentialAddress = {
        id: ra.id,
        addressLine: ra.addressLine ?? null,
        pincode: ra.pincode ?? null,
        phone: ra.phone ?? null,
        countryId: resCountryIdSel ?? ra.country?.id ?? null,
        stateId: resStateIdSel ?? ra.state?.id ?? null,
        cityId: resCityIdSel ?? ra.city?.id ?? null,
        districtId: resDistrictId ?? ra.district?.id ?? null,
      };
    }
    if (cleaned?.mailingAddress) {
      const ma = cleaned.mailingAddress;
      (cleaned as Partial<{ mailingAddress: AddressUpdate }>).mailingAddress = {
        id: ma.id,
        addressLine: ma.addressLine ?? null,
        pincode: ma.pincode ?? null,
        phone: ma.phone ?? null,
        countryId: mailCountryIdSel ?? ma.country?.id ?? null,
        stateId: mailStateIdSel ?? ma.state?.id ?? null,
        cityId: mailCityIdSel ?? ma.city?.id ?? null,
        districtId: mailDistrictId ?? ma.district?.id ?? null,
      };
    }
    return cleaned as Partial<PersonalDetailsDto>;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload() as UpdatePayload;

      // Persist address changes first so personal details can reference updated address ids
      const residential = (payload as Partial<{ residentialAddress: AddressUpdate }>).residentialAddress;
      if (residential && residential.id) {
        try {
          const resUpdate: AddressUpdate = {
            addressLine: residential.addressLine ?? null,
            pincode: residential.pincode ?? null,
            phone: residential.phone ?? null,
            countryId: residential.countryId ?? null,
            stateId: residential.stateId ?? null,
            cityId: residential.cityId ?? null,
            districtId: residential.districtId ?? null,
            otherPostoffice: residentialPostOffice || null,
            otherPoliceStation: residentialPoliceStation || null,
          };
          await updateAddress(residential.id, resUpdate);
        } catch {}
      }

      const mailing = (payload as Partial<{ mailingAddress: AddressUpdate }>).mailingAddress;
      if (mailing && mailing.id) {
        try {
          const mailUpdate: AddressUpdate = {
            addressLine: mailing.addressLine ?? null,
            pincode: mailing.pincode ?? null,
            phone: mailing.phone ?? null,
            countryId: mailing.countryId ?? null,
            stateId: mailing.stateId ?? null,
            cityId: mailing.cityId ?? null,
            districtId: mailing.districtId ?? null,
            otherPostoffice: mailingPostOffice || null,
            otherPoliceStation: mailingPoliceStation || null,
          };
          await updateAddress(mailing.id, mailUpdate);
        } catch {}
      }
      if (pd?.id) {
        return updatePersonalDetail(String(pd.id), payload);
      }
      return updatePersonalDetailByStudentId(String(studentId), payload);
    },
    onSuccess: (data) => {
      // Debug: inspect API response after saving
      // eslint-disable-next-line no-console
      console.log("Personal details save response:", data);
      toast.success("Personal details saved");
      queryClient.invalidateQueries({ queryKey: ["user-profile"], exact: false });
    },
    onError: () => toast.error("Failed to save personal details"),
  });

  return (
    <Card className="max-w-5xl mx-auto my-6 shadow border bg-white py-3">
      <CardContent>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Personal Details Form</h2>
        </div>
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
                  const lm = languageOptions.find((l) => String(l.id) === v) ?? null;
                  const mt = lm ? ({ id: lm.id, name: lm.name } as { id: number; name: string }) : null;
                  setPd((prev) => (prev ? { ...prev, motherTongue: mt as PersonalDetailsDto["motherTongue"] } : prev));
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
                  value={resCountryIdSel != null ? String(resCountryIdSel) : ""}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setResCountryIdSel(id);
                    setResStateIdSel(null);
                    setResCityIdSel(null);
                    setResDistrictId(null);
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
                  value={resStateIdSel != null ? String(resStateIdSel) : ""}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setResStateIdSel(id);
                    setResCityIdSel(null);
                    setResDistrictId(null);
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
                  value={resCityIdSel != null ? String(resCityIdSel) : ""}
                  onValueChange={(v) => setResCityIdSel(Number(v))}
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
                  value={resDistrictId != null ? String(resDistrictId) : ""}
                  onValueChange={(v) => setResDistrictId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {resDistrictOptionsWithSelected.map((d) => (
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
                  value={mailCountryIdSel != null ? String(mailCountryIdSel) : ""}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setMailCountryIdSel(id);
                    setMailStateIdSel(null);
                    setMailCityIdSel(null);
                    setMailDistrictId(null);
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
                  value={mailStateIdSel != null ? String(mailStateIdSel) : ""}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setMailStateIdSel(id);
                    setMailCityIdSel(null);
                    setMailDistrictId(null);
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
                  value={mailCityIdSel != null ? String(mailCityIdSel) : ""}
                  onValueChange={(v) => setMailCityIdSel(Number(v))}
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
                  value={mailDistrictId != null ? String(mailDistrictId) : ""}
                  onValueChange={(v) => setMailDistrictId(Number(v))}
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
      <CardFooter className="flex justify-center items-center mt-4">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {mutation.isLoading ? "Saving..." : "Save Personal Details"}
        </Button>
      </CardFooter>
    </Card>
  );
}
