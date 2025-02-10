import { useEffect, useState } from "react";
import axiosInstance from "@/utils/api";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user";
import { BoardUniversity } from "@/types/resources/board-university";
import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Institution } from "@/types/resources/institution";
import { Category } from "@/types/resources/category";
import { Degree } from "@/types/resources/degree";
import { Religion } from "@/types/resources/religion";
import { LanguageMedium } from "@/types/resources/language-medium";
import { Document } from "@/types/resources/document";
import { BloodGroup } from "@/types/resources/blood-group";
import { Occupation } from "@/types/resources/occupation";
import { Qualification } from "@/types/resources/qualification";
import { Nationality } from "@/types/resources/nationality";
import { Country } from "@/types/resources/country";
import { State } from "@/types/resources/state";
import { City } from "@/types/resources/city";
import { AnnualIncome } from "@/types/resources/annual-income";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { userColumns } from "../tables/users/user-column";
import { boardUniversityColumns } from "../tables/resources/board-university-column";
import { institutionColumns } from "../tables/resources/institution-column";
import { categoryColumns } from "../tables/resources/category-column";
import { degreeColumns } from "../tables/resources/degree-column";
import { religionColumns } from "../tables/resources/religion-column";
import { languageMediumColumns } from "../tables/resources/language-medium-column";
import { documentColumns } from "../tables/resources/document-column";
import { bloodGroupColumns } from "../tables/resources/blood-group-column";
import { occupationColumns } from "../tables/resources/occupation-column";
import { qualificationColumns } from "../tables/resources/qualification-column";
import { nationalityColumns } from "../tables/resources/nationality-column";
import { countryColumns } from "../tables/resources/country-columns";
import { stateColumns } from "../tables/resources/state-column";
import { cityColumns } from "../tables/resources/city-columns";
import { annualIncomeColumns } from "../tables/resources/annual-income-columns";

type SettingsContentProps = {
  activeSetting: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
  page?: number;
  pageSize?: number;
};

async function fetchData({ activeSetting, page = 1, pageSize = 10 }: SettingsContentProps) {
  const response = await axiosInstance.get(`/api${activeSetting.endpoint}?page=${page}&pageSize=${pageSize}`);

  switch (activeSetting.label) {
    case "All Users":
      return { data: response.data as ApiResonse<PaginatedResponse<User>>, columns: userColumns };

    case "Board Universities":
      return { data: response.data as ApiResonse<PaginatedResponse<BoardUniversity>>, columns: boardUniversityColumns };
    case "Institutions":
      return { data: response.data as ApiResonse<PaginatedResponse<Institution>>, columns: institutionColumns };
    case "Categories":
      return { data: response.data as ApiResonse<PaginatedResponse<Category>>, columns: categoryColumns };
    case "Degree":
      return { data: response.data as ApiResonse<PaginatedResponse<Degree>>, columns: degreeColumns };
    case "Religion":
      return { data: response.data as ApiResonse<PaginatedResponse<Religion>>, columns: religionColumns };
    case "Language Medium":
      return { data: response.data as ApiResonse<PaginatedResponse<LanguageMedium>>, columns: languageMediumColumns };
    case "Documents":
      return { data: response.data as ApiResonse<PaginatedResponse<Document>>, columns: documentColumns };
    case "Blood Groups":
      return { data: response.data as ApiResonse<PaginatedResponse<BloodGroup>>, columns: bloodGroupColumns };
    case "Occupation":
      return { data: response.data as ApiResonse<PaginatedResponse<Occupation>>, columns: occupationColumns };
    case "Qualifications":
      return { data: response.data as ApiResonse<PaginatedResponse<Qualification>>, columns: qualificationColumns };
    case "Nationality":
      return { data: response.data as ApiResonse<PaginatedResponse<Nationality>>, columns: nationalityColumns };
    case "Country":
      return { data: response.data as ApiResonse<PaginatedResponse<Country>>, columns: countryColumns };
    case "State":
      return { data: response.data as ApiResonse<PaginatedResponse<State>>, columns: stateColumns };
    case "City":
      return { data: response.data as ApiResonse<PaginatedResponse<City>>, columns: cityColumns };
    case "Annual Income":
      return { data: response.data as ApiResonse<PaginatedResponse<AnnualIncome>>, columns: annualIncomeColumns };
    default:
      return { data: response.data as ApiResonse<PaginatedResponse<User>>, columns: userColumns };
  }
}

export interface CustomPaginationState extends PaginationState {
  totalPages: number;
  totalElements: number;
}

export default function SettingsContent({ activeSetting }: SettingsContentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [columns, setColumns] = useState<ColumnDef<any, any>[]>([]);
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0, // TanStack Table is 0-based
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: [activeSetting.label, { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
    queryFn: async () => {
      const { data, columns: tableCol } = await fetchData({
        activeSetting,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
      console.log(data);
      setColumns(tableCol);

      const { content, page, pageSize, totalElements, totalPages } = data.payload;

      console.log({ pageIndex: page, pageSize, totalElements, totalPages });

      setPagination((prev) => ({ ...prev, totalElements, totalPages }));

      return content;
    },
  });

  useEffect(() => {
    setPagination({
      pageIndex: 0, // TanStack Table is 0-based
      pageSize: 10,
      totalElements: 0,
      totalPages: 1,
    });
  }, [activeSetting.label]);

  return (
    <div className="px-7 py-3">
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || []}
        {...pagination}
        setPagination={setPagination}
      />
    </div>
  );
}
