import { useEffect, useState } from "react";
import axiosInstance from "@/utils/api";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import { User } from "@/types/user/user";
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
import { getSearchedUsers } from "@/services/user";

type SettingsContentProps = {
  activeSetting: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
  page?: number;
  pageSize?: number;
  isAdmin?: boolean;
};

async function fetchData({ activeSetting, page = 1, pageSize = 10 }: SettingsContentProps) {
  let url=`/api${activeSetting.endpoint}?page=${page}&pageSize=${pageSize}`;
  url += activeSetting.label === "All Users" ? `&isAdmin=${true}` : "";
  console.log("URL", url);
  const response = await axiosInstance.get(url);

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
  const [searchText, setSearchText] = useState("");

  const [data, setData] = useState<
    | BloodGroup[]
    | Nationality[]
    | State[]
    | City[]
    | AnnualIncome[]
    | User[]
    | BoardUniversity[]
    | Institution[]
    | Category[]
    | Degree[]
    | LanguageMedium[]
    | Document[]
  >([]);
  const [dataLength, setDataLength] = useState<number>(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [columns, setColumns] = useState<ColumnDef<unknown, any>[]>([]);
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0, // TanStack Table is 0-based
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });

  useEffect(() => {
    setPagination({
      pageIndex: 0, // TanStack Table is 0-based
      pageSize: 10,
      totalElements: 0,
      totalPages: 1,
    });
  }, [activeSetting.label]);

  const { isLoading: isFetchingDefault } = useQuery({
    queryKey: [activeSetting.label, { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
    queryFn: async () => {
      const { data, columns: tableCol } = await fetchData({
        activeSetting,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        isAdmin: activeSetting.label === "All Users" ? true : false,
      });
      console.log(data);
      setColumns(tableCol as ColumnDef<unknown, unknown>[]);

      const { content, page, pageSize, totalElements, totalPages } = data.payload;

      setData(content || []);

      setDataLength(content.length);

      console.log({ pageIndex: page, pageSize, totalElements, totalPages });

      setPagination((prev) => ({ ...prev, totalElements, totalPages }));

      return content;
    },
    enabled: searchText.trim() == "",
  });

  // Fetch the filtered data using React Query
  const { isFetching: isFetchingSearch, refetch } = useQuery({
    queryKey: ["users", pagination.pageIndex, pagination.pageSize, searchText, dataLength], // Query key with pagination and filter
    queryFn: async () => {
      if (searchText.trim() !== "") {
        const data = await getSearchedUsers(
          pagination.pageIndex + 1,
          pagination.pageSize,
          searchText.trim().toLowerCase(),
        );

        console.log("while searching:", data);
        const { content, page, totalElements, totalPages } = data.payload;

        setPagination((prev) => ({ ...prev, pageIndex: page - 1, totalElements, totalPages }));

        setData(content);

        setDataLength(content.length);

        return content;
      }
    }, // Query function with page, pageSize, and search text
    enabled: false,
  });

  return (
    <div className="px-7 py-3">
      <DataTable
        isLoading={isFetchingDefault || isFetchingSearch}
        data={data}
        searchText={searchText}
        setSearchText={setSearchText}
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        setDataLength={setDataLength}
        refetch={refetch as (options?: RefetchOptions) => Promise<QueryObserverResult<unknown[] | undefined, Error>>}
      />
    </div>
  );
}