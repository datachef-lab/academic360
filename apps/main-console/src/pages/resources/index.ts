import { BloodGroup } from "@/types/resources/blood-group.types";
import AnnualIncomePage from "./AnnualIncomePage";
import BloodGroupPage from "./BloodGroupPage";
import BoardUniversitiesPage from "./BoardUniversitiesPage";
import CategoriesPage from "./CategoriesPage";
import DegreePage from "./DegreePage";
import DocumentPage from "./DocumentPage";
import InstitutionsPage from "./InstitutionsPage";
import LanguageMediumPage from "./LanguageMediumPage";
import NationalitiesPage from "./NationalitiesPage";
import OccupationsPage from "./OccupationsPage";
import QualificationsPage from "./QualificationsPage";
import ReligionPage from "./ReligionPage";
import ResourcesMaster from "./ResourcesMaster";
import { Nationality } from "@/types/resources/nationality.types";
import { State } from "@/types/resources/state.types";
import { City } from "@/types/user/city";
import { AnnualIncome } from "@/types/resources/annual-income.types";
import { User } from "@/types/user/user";
import { BoardUniversity } from "@/types/admissions";
import { Institution } from "@/types/resources/institution.types";
import { Category } from "@/types/resources/category.types";
import { Degree } from "@/types/resources/degree.types";
import { LanguageMedium } from "@/types/resources/language-medium.types";
import { Occupation } from "@/types/resources/occupation.types";
import { Qualification } from "@/types/resources/qualification.types";
import { PaginationState } from "@tanstack/react-table";
import { ApiResponse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { userColumns } from "@/components/tables/users/user-column";
import axiosInstance from "@/utils/api";
// import { boardUniversityColumns } from "@/components/tables/resources/board-university-column";
import { institutionColumns } from "@/components/tables/resources/institution-column";
import { categoryColumns } from "@/components/tables/resources/category-column";
import { degreeColumns } from "@/components/tables/resources/degree-column";
import { religionColumns } from "@/components/tables/resources/religion-column";
import { languageMediumColumns } from "@/components/tables/resources/language-medium-column";
import { Religion } from "@/types/resources/religion.types";
// import { documentColumns } from "@/components/tables/resources/document-column";
import { bloodGroupColumns } from "@/components/tables/resources/blood-group-column";
import { occupationColumns } from "@/components/tables/resources/occupation-column";
import { qualificationColumns } from "@/components/tables/resources/qualification-column";
import { nationalityColumns } from "@/components/tables/resources/nationality-column";
import { annualIncomeColumns } from "@/components/tables/resources/annual-income-columns";
import { Download, FileDown, FileUp, Plus, UserPlus } from "lucide-react";

export interface CustomPaginationState extends PaginationState {
  totalPages: number;
  totalElements: number;
}

export type SettingsRow =
  | BloodGroup
  | Nationality
  | State
  | City
  | AnnualIncome
  | User
  | BoardUniversity
  | Institution
  | Category
  | Degree
  | LanguageMedium
  | Occupation
  | Qualification
  | Record<string, unknown>;

// Configuration for dynamic optional tools based on setting type
export const getOptionalToolsConfig = (settingLabel: string) => {
  const configs = {
    "All Users": {
      buttons: [
        { icon: UserPlus, label: "Add User", action: "add-user", variant: "default" },
        { icon: FileUp, label: "Import Users", action: "import-users", variant: "outline" },
        { icon: FileDown, label: "Export Users", action: "export-users", variant: "outline" },
        { icon: Download, label: "Download Template", action: "download-template", variant: "secondary" },
      ],
    },
    "Board Universities": {
      buttons: [
        { icon: Plus, label: "Add Board/University", action: "add-board-university", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-board-university", variant: "outline" },
      ],
    },
    Institutions: {
      buttons: [
        { icon: Plus, label: "Add Institution", action: "add-institution", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-institutions", variant: "outline" },
      ],
    },
    Categories: {
      buttons: [
        { icon: Plus, label: "Add Category", action: "add-category", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-categories", variant: "outline" },
      ],
    },
    Degree: {
      buttons: [
        { icon: Plus, label: "Add Degree", action: "add-degree", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-degrees", variant: "outline" },
      ],
    },
    Religion: {
      buttons: [
        { icon: Plus, label: "Add Religion", action: "add-religion", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-religions", variant: "outline" },
      ],
    },
    "Language Medium": {
      buttons: [
        { icon: Plus, label: "Add Language", action: "add-language", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-languages", variant: "outline" },
      ],
    },
    Documents: {
      buttons: [
        { icon: Plus, label: "Add Document", action: "add-document", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-documents", variant: "outline" },
      ],
    },
    "Blood Groups": {
      buttons: [
        { icon: Plus, label: "Add Blood Group", action: "add-blood-group", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-blood-groups", variant: "outline" },
      ],
    },
    Occupation: {
      buttons: [
        { icon: Plus, label: "Add Occupation", action: "add-occupation", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-occupations", variant: "outline" },
      ],
    },
    Qualifications: {
      buttons: [
        { icon: Plus, label: "Add Qualification", action: "add-qualification", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-qualifications", variant: "outline" },
      ],
    },
    Nationality: {
      buttons: [
        { icon: Plus, label: "Add Nationality", action: "add-nationality", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-nationalities", variant: "outline" },
      ],
    },
    Country: {
      buttons: [
        { icon: Plus, label: "Add Country", action: "add-country", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-countries", variant: "outline" },
      ],
    },
    State: {
      buttons: [
        { icon: Plus, label: "Add State", action: "add-state", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-states", variant: "outline" },
      ],
    },
    City: {
      buttons: [
        { icon: Plus, label: "Add City", action: "add-city", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-cities", variant: "outline" },
      ],
    },
    "Annual Income": {
      buttons: [
        { icon: Plus, label: "Add Income Range", action: "add-income-range", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-income-ranges", variant: "outline" },
      ],
    },
  };

  return (
    configs[settingLabel as keyof typeof configs] || {
      buttons: [
        { icon: Plus, label: "Add", action: "add", variant: "default" },
        { icon: FileUp, label: "Import", action: "import", variant: "outline" },
        { icon: FileDown, label: "Export", action: "export", variant: "outline" },
      ],
    }
  );
};

// Utility to flatten any object to Record<string, string | number | boolean | null>
export function toFormData(obj: SettingsRow | undefined): Record<string, string | number | boolean | null> | undefined {
  if (!obj) return undefined;
  const result: Record<string, string | number | boolean | null> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      result[key] = value;
    }
  });
  return result;
}

export async function fetchData(
  {
    activeResource,
    page = 1,
    pageSize = 10,
  }: { activeResource: { label: string; endpoint: string }; page: number; pageSize: number },
  onEditRow?: (rowData: SettingsRow) => void,
) {
  let url = `/api${activeResource.endpoint}?page=${page}&pageSize=${pageSize}`;
  url += activeResource.label === "All Users" ? `&isAdmin=${true}` : "";
  console.log("URL", url);
  const response = await axiosInstance.get(url);

  switch (activeResource.label) {
    case "All Users":
      return { data: response.data as ApiResponse<PaginatedResponse<User>>, columns: userColumns };
    // case "Board Universities":
    // return { data: response.data as ApiResponse<PaginatedResponse<BoardUniversity>>, columns: boardUniversityColumns(onEditRow as (rowData: BoardUniversity) => void) };
    case "Institutions":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Institution>>,
        columns: institutionColumns(onEditRow as (rowData: Institution) => void),
      };
    case "Categories":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Category>>,
        columns: categoryColumns(onEditRow as (rowData: Category) => void),
      };
    case "Degree":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Degree>>,
        columns: degreeColumns(onEditRow as (rowData: Degree) => void),
      };
    case "Religion":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Religion>>,
        columns: religionColumns(onEditRow as (rowData: Religion) => void),
      };
    case "Language Medium":
      return {
        data: response.data as ApiResponse<PaginatedResponse<LanguageMedium>>,
        columns: languageMediumColumns(onEditRow as (rowData: LanguageMedium) => void),
      };
    // case "Documents":
    // return { data: response.data as ApiResponse<PaginatedResponse<Document>>, columns: documentColumns(onEditRow as (rowData: Document) => void) };
    case "Blood Groups":
      return {
        data: response.data as ApiResponse<PaginatedResponse<BloodGroup>>,
        columns: bloodGroupColumns(onEditRow as (rowData: BloodGroup) => void),
      };
    case "Occupation":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Occupation>>,
        columns: occupationColumns(onEditRow as (rowData: Occupation) => void),
      };
    case "Qualifications":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Qualification>>,
        columns: qualificationColumns(onEditRow as (rowData: Qualification) => void),
      };
    case "Nationality":
      return {
        data: response.data as ApiResponse<PaginatedResponse<Nationality>>,
        columns: nationalityColumns(onEditRow as (rowData: Nationality) => void),
      };
    // case "Country":
    //     return { data: response.data as ApiResponse<PaginatedResponse<Country>>, columns: countryColumns(onEditRow as (rowData: Country) => void) };
    // case "State":
    //     return { data: response.data as ApiResponse<PaginatedResponse<State>>, columns: stateColumns(onEditRow as (rowData: State) => void) };
    // case "City":
    //     return { data: response.data as ApiResponse<PaginatedResponse<City>>, columns: cityColumns(onEditRow as (rowData: City) => void) };
    case "Annual Income":
      return {
        data: response.data as ApiResponse<PaginatedResponse<AnnualIncome>>,
        columns: annualIncomeColumns(onEditRow as (rowData: AnnualIncome) => void),
      };
    default:
      return { data: response.data as ApiResponse<PaginatedResponse<User>>, columns: userColumns };
  }
}

export {
  ResourcesMaster,
  AnnualIncomePage,
  BloodGroupPage,
  BoardUniversitiesPage,
  CategoriesPage,
  DegreePage,
  DocumentPage,
  InstitutionsPage,
  LanguageMediumPage,
  NationalitiesPage,
  OccupationsPage,
  QualificationsPage,
  ReligionPage,
};
