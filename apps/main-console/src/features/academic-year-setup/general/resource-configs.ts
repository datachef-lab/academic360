import {
  Droplet,
  Wallet,
  Tags,
  Church,
  Flag,
  Briefcase,
  GraduationCap,
  Languages,
  Building2,
  Award,
  Globe,
  Map,
  Building,
  MapPin,
  Landmark,
  Bus,
  ShieldAlert,
  Mailbox,
  Accessibility,
  type LucideIcon,
} from "lucide-react";

export type FieldType = "text" | "number" | "boolean" | "select";

export type ResourceField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** For type "select": load options from `/api/<optionsBasePath>`. */
  optionsBasePath?: string;
  /** Property on the option row to use as the visible label (default "name"). */
  optionLabelKey?: string;
};

export type ResourceConfig = {
  /** Route segment + nav key (e.g. "blood-groups"). */
  key: string;
  title: string;
  icon: LucideIcon;
  /** API base after "/api/" (e.g. "blood-groups", "admissions/boards"). */
  basePath: string;
  /** Primary text field used as the row's headline + search. */
  labelField: string;
  fields: ResourceField[];
};

const seq: ResourceField = { key: "sequence", label: "Sequence", type: "number" };
const active: ResourceField = { key: "isActive", label: "Active", type: "boolean" };

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    key: "blood-groups",
    title: "Blood Groups",
    icon: Droplet,
    basePath: "blood-groups",
    labelField: "type",
    fields: [{ key: "type", label: "Type", type: "text", required: true }, seq, active],
  },
  {
    key: "annual-incomes",
    title: "Annual Incomes",
    icon: Wallet,
    basePath: "annual-incomes",
    labelField: "range",
    fields: [{ key: "range", label: "Range", type: "text", required: true }, seq, active],
  },
  {
    key: "categories",
    title: "Categories",
    icon: Tags,
    basePath: "categories",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "code", label: "Code", type: "text" },
      { key: "documentRequired", label: "Document Required", type: "boolean" },
      seq,
      active,
    ],
  },
  {
    key: "religions",
    title: "Religions",
    icon: Church,
    basePath: "religions",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "nationalities",
    title: "Nationalities",
    icon: Flag,
    basePath: "nationalities",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "occupations",
    title: "Occupations",
    icon: Briefcase,
    basePath: "occupations",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "qualifications",
    title: "Qualifications",
    icon: GraduationCap,
    basePath: "qualifications",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "languages",
    title: "Languages",
    icon: Languages,
    basePath: "languages",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "institutions",
    title: "Institutions",
    icon: Building2,
    basePath: "institutions",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "degrees",
    title: "Degrees",
    icon: Award,
    basePath: "degree",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq, active],
  },
  {
    key: "countries",
    title: "Countries",
    icon: Globe,
    basePath: "countries",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      seq,
      { key: "disabled", label: "Disabled", type: "boolean" },
    ],
  },
  {
    key: "states",
    title: "States",
    icon: Map,
    basePath: "states",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "countryId",
        label: "Country",
        type: "select",
        required: true,
        optionsBasePath: "countries",
        optionLabelKey: "name",
      },
      seq,
      active,
    ],
  },
  {
    key: "cities",
    title: "Cities",
    icon: Building,
    basePath: "cities",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "stateId",
        label: "State",
        type: "select",
        required: true,
        optionsBasePath: "states",
        optionLabelKey: "name",
      },
      { key: "code", label: "Code", type: "text" },
      { key: "documentRequired", label: "Document Required", type: "boolean" },
      seq,
      active,
    ],
  },
  {
    key: "districts",
    title: "Districts",
    icon: MapPin,
    basePath: "districts",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "cityId",
        label: "City",
        type: "select",
        required: true,
        optionsBasePath: "cities",
        optionLabelKey: "name",
      },
      seq,
      active,
    ],
  },
  {
    key: "boards",
    title: "Boards",
    icon: Landmark,
    basePath: "admissions/boards",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "degreeId",
        label: "Degree",
        type: "select",
        optionsBasePath: "degree",
        optionLabelKey: "name",
      },
      { key: "code", label: "Code", type: "text" },
      { key: "passingMarks", label: "Passing Marks", type: "number" },
      seq,
      active,
    ],
  },
  {
    key: "pickup-points",
    title: "Pickup Points",
    icon: Bus,
    basePath: "pickup-points",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }, seq],
  },
  {
    key: "police-stations",
    title: "Police Stations",
    icon: ShieldAlert,
    basePath: "police-stations",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "stateId",
        label: "State",
        type: "select",
        optionsBasePath: "states",
        optionLabelKey: "name",
      },
    ],
  },
  {
    key: "post-offices",
    title: "Post Offices",
    icon: Mailbox,
    basePath: "post-offices",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      {
        key: "stateId",
        label: "State",
        type: "select",
        optionsBasePath: "states",
        optionLabelKey: "name",
      },
    ],
  },
  {
    key: "disability-codes",
    title: "Disability Codes",
    icon: Accessibility,
    basePath: "disability-codes",
    labelField: "code",
    fields: [{ key: "code", label: "Code", type: "text", required: true }],
  },
];

export const RESOURCE_CONFIG_BY_KEY: Record<string, ResourceConfig> = Object.fromEntries(
  RESOURCE_CONFIGS.map((c) => [c.key, c]),
);
