import type { ClassT } from "@repo/db/schemas/models/academics";

/** Resolved against `classes.type` + `classes.name` */
export type ClassRef = { type: ClassT["type"]; name: string };

export const primaryPromotionClause = {
  Form_Fill_Up_Status: "Form Fill-Up Status",
  Failed_Papers: "Failed Papers",
} as const;

export type PromotionClauseSeed = {
  name: string;
  description: string;
  color: string;
  bgColor: string;
  isActive: boolean;
  classRefs: ClassRef[];
};

export const defaultPromotionClauseSeeds: PromotionClauseSeed[] = [
  {
    name: primaryPromotionClause.Form_Fill_Up_Status,
    description:
      "Checks if the student has filled up the form for the next class.",
    color: "#15803d",
    bgColor: "#dcfce7",
    isActive: true,
    classRefs: [
      { type: "SEMESTER", name: "Semester I" },
      { type: "SEMESTER", name: "Semester II" },
      { type: "SEMESTER", name: "Semester III" },
      { type: "SEMESTER", name: "Semester IV" },
      { type: "SEMESTER", name: "Semester V" },
      { type: "SEMESTER", name: "Semester VI" },
      { type: "SEMESTER", name: "Semester VIII" },
    ],
  },
  {
    name: primaryPromotionClause.Failed_Papers,
    description:
      "Checks if the student has failed in any subjects and needs to clear them before promotion.",
    color: "#be123c",
    bgColor: "#ffe4e6",
    isActive: true,
    classRefs: [{ type: "SEMESTER", name: "Semester VII" }],
  },
];

export type PromotionBuilderRuleSeed = {
  clauseName: string;
  operator: "EQUALS" | "NONE_IN";
  classRefs: ClassRef[];
};

export type PromotionBuilderSeed = {
  affiliationName: string;
  logic: "AUTO_PROMOTE" | "CONDITIONAL";
  targetClassRef: ClassRef;
  rules: PromotionBuilderRuleSeed[];
};

export const defaultPromotionBuilderSeeds: PromotionBuilderSeed[] = [
  {
    affiliationName: "Calcutta University",
    logic: "AUTO_PROMOTE",
    targetClassRef: { type: "SEMESTER", name: "Semester II" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester III" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [{ type: "SEMESTER", name: "Semester I" }],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester IV" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [{ type: "SEMESTER", name: "Semester II" }],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester V" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [
          { type: "SEMESTER", name: "Semester I" },
          { type: "SEMESTER", name: "Semester III" },
        ],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester VI" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [
          { type: "SEMESTER", name: "Semester II" },
          { type: "SEMESTER", name: "Semester IV" },
        ],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester VII" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [
          { type: "SEMESTER", name: "Semester I" },
          { type: "SEMESTER", name: "Semester III" },
          { type: "SEMESTER", name: "Semester V" },
        ],
      },
      {
        clauseName: primaryPromotionClause.Failed_Papers,
        operator: "NONE_IN",
        classRefs: [
          { type: "SEMESTER", name: "Semester I" },
          { type: "SEMESTER", name: "Semester II" },
          { type: "SEMESTER", name: "Semester III" },
          { type: "SEMESTER", name: "Semester IV" },
          { type: "SEMESTER", name: "Semester V" },
        ],
      },
    ],
  },
  {
    affiliationName: "Calcutta University",
    logic: "CONDITIONAL",
    targetClassRef: { type: "SEMESTER", name: "Semester VIII" },
    rules: [
      {
        clauseName: primaryPromotionClause.Form_Fill_Up_Status,
        operator: "EQUALS",
        classRefs: [
          { type: "SEMESTER", name: "Semester II" },
          { type: "SEMESTER", name: "Semester IV" },
          { type: "SEMESTER", name: "Semester VI" },
        ],
      },
    ],
  },
];
