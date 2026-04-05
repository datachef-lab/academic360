import { PromotionClauseT } from "@/schemas";

export const defaultPromotionClauseData: PromotionClauseT[] = [
  {
    name: "Form Fill-Up Status",
    description:
      "Checks if the student has filled up the form for the next class.",
    color: "#15803d",
    bgColor: "#dcfce7",
    isActive: true,
  },
  {
    name: "Failed Papers",
    description:
      "Checks if the student has failed in any subjects and needs to clear them before promotion.",
    color: "#be123c",
    bgColor: "#ffe4e6",
    isActive: true,
  },
];
