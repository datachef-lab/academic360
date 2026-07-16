import { Ticket, XCircle, Star, Trophy, Rows3 } from "lucide-react";
import type { ResourceConfig } from "./resource-configs";

const BADGE_BLUE = "bg-blue-100 text-blue-700 border border-blue-200";
const BADGE_GREEN = "bg-emerald-100 text-emerald-700 border border-emerald-200";
const BADGE_AMBER = "bg-amber-100 text-amber-700 border border-amber-200";

/**
 * Admission-master resource configs, driven by the same generic
 * ResourceMasterPage engine as the General masters.
 */
export const ADMISSION_MASTER_CONFIGS: Record<string, ResourceConfig> = {
  "admission-quota-types": {
    key: "admission-quota-types",
    title: "Admission Quota Types",
    icon: Ticket,
    basePath: "admission-quota-types",
    table: "admission_quota_types",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "shortName", label: "Short Name", type: "text" },
      { key: "printOnIdCard", label: "Print on ID Card (use short name)", type: "boolean" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  "cancel-sources": {
    key: "cancel-sources",
    title: "Cancel Sources",
    icon: XCircle,
    basePath: "cancel-sources",
    table: "cancel_sources",
    labelField: "name",
    fields: [{ key: "name", label: "Name", type: "text", required: true }],
  },
  grades: {
    key: "grades",
    title: "Grades",
    icon: Star,
    basePath: "grades",
    table: "grade",
    labelField: "description",
    badges: [
      {
        label: "Course",
        color: BADGE_BLUE,
        hops: [{ fromKey: "courseId", basePath: "v1/courses" }],
      },
      { label: "Class", color: BADGE_GREEN, hops: [{ fromKey: "classId", basePath: "classes" }] },
      {
        label: "Category",
        color: BADGE_AMBER,
        hops: [{ fromKey: "categoryId", basePath: "categories" }],
      },
    ],
    fields: [
      {
        key: "courseId",
        label: "Course",
        type: "select",
        required: true,
        optionsBasePath: "v1/courses",
        optionLabelKey: "name",
      },
      {
        key: "classId",
        label: "Class",
        type: "select",
        required: true,
        optionsBasePath: "classes",
        optionLabelKey: "name",
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        required: true,
        optionsBasePath: "categories",
        optionLabelKey: "name",
      },
      { key: "description", label: "Description", type: "text" },
      { key: "generalInstruction", label: "General Instruction", type: "text" },
    ],
  },
  "sports-categories": {
    key: "sports-categories",
    title: "Sports Categories",
    icon: Trophy,
    basePath: "sports-categories",
    table: "sports_categories",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  sections: {
    key: "sections",
    title: "Sections",
    icon: Rows3,
    basePath: "v1/sections",
    table: "sections",
    labelField: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "sequence", label: "Sequence", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
};
