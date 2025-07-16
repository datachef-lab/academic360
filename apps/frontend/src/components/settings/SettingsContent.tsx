import { useEffect, useState } from "react";
import axiosInstance from "@/utils/api";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, RefetchOptions, QueryObserverResult, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user/user";
import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { userColumns } from "../tables/users/user-column";
import { boardUniversityColumns } from "../tables/resources/board-university-column";
import { institutionColumns } from "../tables/resources/institution-column";
import { categoryColumns } from "../tables/resources/category-column";
import { degreeColumns } from "../tables/resources/degree-column";
import { religionColumns } from "../tables/resources/religion-column";
import { languageMediumColumns } from "../tables/resources/language-medium-column";
import type { Document as ResourceDocument } from "@/types/resources/document";
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
import { BoardUniversity } from "@/types/resources/board-university.types";
import { Institution } from "@/types/resources/institution.types";
import { Category } from "@/types/resources/category.types";
import { Degree } from "@/types/resources/degree.types";
import { Religion } from "@/types/resources/religion.types";
import { LanguageMedium } from "@/types/resources/language-medium.types";
import { BloodGroup } from "@/types/resources/blood-group.types";
import { Occupation } from "@/types/resources/occupation.types";
import { Qualification } from "@/types/resources/qualification.types";
import { Nationality } from "@/types/resources/nationality.types";
import { Country } from "@/types/resources/country.types";
import { State } from "@/types/resources/state.types";
import { City } from "@/types/resources/city.types";
import { AnnualIncome } from "@/types/resources/annual-income.types";
import { 
  Plus, 
  FileUp,
  FileDown,
  UserPlus,
  Download,
} from "lucide-react";
import { DynamicModal } from "./DynamicModal";

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

type SettingsRow = BloodGroup | Nationality | State | City | AnnualIncome | User | BoardUniversity | Institution | Category | Degree | LanguageMedium | ResourceDocument | Occupation | Qualification | Record<string, unknown>;

async function fetchData({ activeSetting, page = 1, pageSize = 10 }: SettingsContentProps, onEditRow?: (rowData: SettingsRow) => void) {
  let url = `/api${activeSetting.endpoint}?page=${page}&pageSize=${pageSize}`;
  url += activeSetting.label === "All Users" ? `&isAdmin=${true}` : "";
  console.log("URL", url);
  const response = await axiosInstance.get(url);

  switch (activeSetting.label) {
    case "All Users":
      return { data: response.data as ApiResonse<PaginatedResponse<User>>, columns: userColumns };
    case "Board Universities":
      return { data: response.data as ApiResonse<PaginatedResponse<BoardUniversity>>, columns: boardUniversityColumns(onEditRow as (rowData: BoardUniversity) => void) };
    case "Institutions":
      return { data: response.data as ApiResonse<PaginatedResponse<Institution>>, columns: institutionColumns(onEditRow as (rowData: Institution) => void) };
    case "Categories":
      return { data: response.data as ApiResonse<PaginatedResponse<Category>>, columns: categoryColumns(onEditRow as (rowData: Category) => void) };
    case "Degree":
      return { data: response.data as ApiResonse<PaginatedResponse<Degree>>, columns: degreeColumns(onEditRow as (rowData: Degree) => void) };
    case "Religion":
      return { data: response.data as ApiResonse<PaginatedResponse<Religion>>, columns: religionColumns(onEditRow as (rowData: Religion) => void) };
    case "Language Medium":
      return { data: response.data as ApiResonse<PaginatedResponse<LanguageMedium>>, columns: languageMediumColumns(onEditRow as (rowData: LanguageMedium) => void) };
    case "Documents":
      return { data: response.data as ApiResonse<PaginatedResponse<ResourceDocument>>, columns: documentColumns(onEditRow as (rowData: ResourceDocument) => void) };
    case "Blood Groups":
      return { data: response.data as ApiResonse<PaginatedResponse<BloodGroup>>, columns: bloodGroupColumns(onEditRow as (rowData: BloodGroup) => void) };
    case "Occupation":
      return { data: response.data as ApiResonse<PaginatedResponse<Occupation>>, columns: occupationColumns(onEditRow as (rowData: Occupation) => void) };
    case "Qualifications":
      return { data: response.data as ApiResonse<PaginatedResponse<Qualification>>, columns: qualificationColumns(onEditRow as (rowData: Qualification) => void) };
    case "Nationality":
      return { data: response.data as ApiResonse<PaginatedResponse<Nationality>>, columns: nationalityColumns(onEditRow as (rowData: Nationality) => void) };
    case "Country":
      return { data: response.data as ApiResonse<PaginatedResponse<Country>>, columns: countryColumns(onEditRow as (rowData: Country) => void) };
    case "State":
      return { data: response.data as ApiResonse<PaginatedResponse<State>>, columns: stateColumns(onEditRow as (rowData: State) => void) };
    case "City":
      return { data: response.data as ApiResonse<PaginatedResponse<City>>, columns: cityColumns(onEditRow as (rowData: City) => void) };
    case "Annual Income":
      return { data: response.data as ApiResonse<PaginatedResponse<AnnualIncome>>, columns: annualIncomeColumns(onEditRow as (rowData: AnnualIncome) => void) };
    default:
      return { data: response.data as ApiResonse<PaginatedResponse<User>>, columns: userColumns };
  }
}

export interface CustomPaginationState extends PaginationState {
  totalPages: number;
  totalElements: number;
}

// Configuration for dynamic optional tools based on setting type
const getOptionalToolsConfig = (settingLabel: string) => {
  const configs = {
    "All Users": {
      buttons: [
        { icon: UserPlus, label: "Add User", action: "add-user", variant: "default" },
        { icon: FileUp, label: "Import Users", action: "import-users", variant: "outline" },
        { icon: FileDown, label: "Export Users", action: "export-users", variant: "outline" },
        { icon: Download, label: "Download Template", action: "download-template", variant: "secondary" }
      ]
    },
    "Board Universities": {
      buttons: [
        { icon: Plus, label: "Add Board/University", action: "add-board-university", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-board-university", variant: "outline" },
      ]
    },
    "Institutions": {
      buttons: [
        { icon: Plus, label: "Add Institution", action: "add-institution", variant: "default" },  
        { icon: Download, label: "Download All", action: "download-all-institutions", variant: "outline" },
      ]
    },
    "Categories": {
      buttons: [
        { icon: Plus, label: "Add Category", action: "add-category", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-categories", variant: "outline" },
      ]
    },
    "Degree": {
      buttons: [
        { icon: Plus, label: "Add Degree", action: "add-degree", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-degrees", variant: "outline" },
      ]
    },
    "Religion": {
      buttons: [
        { icon: Plus, label: "Add Religion", action: "add-religion", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-religions", variant: "outline" },
      ]
    },
    "Language Medium": {
      buttons: [
        { icon: Plus, label: "Add Language", action: "add-language", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-languages", variant: "outline" },
      ]
    },
    "Documents": {
      buttons: [
        { icon: Plus, label: "Add Document", action: "add-document", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-documents", variant: "outline" },
      ]
    },
    "Blood Groups": {
      buttons: [
        { icon: Plus, label: "Add Blood Group", action: "add-blood-group", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-blood-groups", variant: "outline" },
      ]
    },
    "Occupation": {
      buttons: [
        { icon: Plus, label: "Add Occupation", action: "add-occupation", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-occupations", variant: "outline" },
      ]
    },
    "Qualifications": {
      buttons: [
        { icon: Plus, label: "Add Qualification", action: "add-qualification", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-qualifications", variant: "outline" },
      ]
    },
    "Nationality": {
      buttons: [
        { icon: Plus, label: "Add Nationality", action: "add-nationality", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-nationalities", variant: "outline" }      ]
    },
    "Country": {
      buttons: [
        { icon: Plus, label: "Add Country", action: "add-country", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-countries", variant: "outline" },
      ]
    },
    "State": {
      buttons: [
        { icon: Plus, label: "Add State", action: "add-state", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-states", variant: "outline" },
      ]
    },
    "City": {
      buttons: [
        { icon: Plus, label: "Add City", action: "add-city", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-cities", variant: "outline" },
      ]
    },
    "Annual Income": {
      buttons: [
        { icon: Plus, label: "Add Income Range", action: "add-income-range", variant: "default" },
        { icon: Download, label: "Download All", action: "download-all-income-ranges", variant: "outline" },
      ]
    }
  };

  return configs[settingLabel as keyof typeof configs] || {
    buttons: [
      { icon: Plus, label: "Add", action: "add", variant: "default" },
      { icon: FileUp, label: "Import", action: "import", variant: "outline" },
      { icon: FileDown, label: "Export", action: "export", variant: "outline" }
    ]
  };
};

// Utility to flatten any object to Record<string, string | number | boolean | null>
function toFormData(obj: SettingsRow | undefined): Record<string, string | number | boolean | null> | undefined {
  if (!obj) return undefined;
  const result: Record<string, string | number | boolean | null> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      result[key] = value;
    }
  });
  return result;
}

export default function SettingsContent({ activeSetting }: SettingsContentProps) {
  const [searchText, setSearchText] = useState("");
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: string;
    action: string;
    settingType: string;
    editData?: SettingsRow;
    editId?: number;
  }>({
    isOpen: false,
    type: "",
    action: "",
    settingType: "",
    editData: undefined,
    editId: undefined,
  });

  const [data, setData] = useState<SettingsRow[]>([]);
  const [dataLength, setDataLength] = useState<number>(0);

  const [columns, setColumns] = useState<ColumnDef<unknown, unknown>[]>([]);
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
      }, handleEditRow);
      console.log(data);
      setColumns(tableCol as ColumnDef<unknown, unknown>[]);

      // Handle different response structures
      let content: SettingsRow[] = [], page: number, pageSize: number, totalElements: number, totalPages: number;
      
      if (data.payload && Array.isArray(data.payload)) {
        // Direct array response (like categories)
        content = data.payload;
        page = 1;
        pageSize = content.length;
        totalElements = content.length;
        totalPages = 1;
      } else if (data.payload && data.payload.content) {
        // Paginated response with content property
        ({ content, page, pageSize, totalElements, totalPages } = data.payload);
      } else {
        // Fallback
        content = [];
        page = 1;
        pageSize = 10;
        totalElements = 0;
        totalPages = 1;
      }

      setData(content as SettingsRow[]);
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

        setData(content as SettingsRow[]);

        setDataLength(content.length);

        return content;
      }
    }, // Query function with page, pageSize, and search text
    enabled: false,
  });

  // Handle button actions
  const handleButtonAction = (action: string) => {
    console.log(`Action triggered: ${action} for ${activeSetting.label}`);
    
    // Determine modal type based on action
    let modalType = "";
    if (action.includes("select-file")) {
      modalType = "file-select";
    } else if (action.includes("upload-file")) {
      modalType = "file-upload";
    } else if (action.includes("download-all") || action.includes("download-template")) {
      modalType = "download";
    } else if (action.includes("add-")) {
      modalType = "add";
    }

    setModalState({
      isOpen: true,
      type: modalType,
      action: action,
      settingType: activeSetting.label,
      editId: typeof modalState.editId === 'number' ? modalState.editId : undefined,
    });
  };

  // Close modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: "",
      action: "",
      settingType: "",
      editData: undefined,
      editId: undefined,
    });
  };

  // Get dynamic optional tools configuration
  const toolsConfig = getOptionalToolsConfig(activeSetting.label);

  const optionalTools = (
    <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50/50 rounded-lg border mt-3 border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 w-full">
        <span>Quick Actions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {toolsConfig.buttons.map((button, index) => {
          const IconComponent = button.icon;
          // Color logic
          let bg = "";
          let text = "text-white";
          let hover = "";
          switch (button.action) {
            case "add-user":
            case "add-board-university":
            case "add-institution":
            case "add-category":
            case "add-degree":
            case "add-religion":
            case "add-language":
            case "add-document":
            case "add-blood-group":
            case "add-occupation":
            case "add-qualification":
            case "add-nationality":
            case "add-country":
            case "add-state":
            case "add-city":
            case "add-income-range":
            case "add":
              bg = "bg-blue-600";
              hover = "hover:bg-blue-700";
              break;
            case "import-users":
            case "import":
              bg = "bg-green-600";
              hover = "hover:bg-green-700";
              break;
            case "export-users":
            case "export":
              bg = "bg-orange-500";
              hover = "hover:bg-orange-600";
              break;
            case "download-template":
            case "download-all-board-university":
            case "download-all-institutions":
            case "download-all-categories":
            case "download-all-degrees":
            case "download-all-religions":
            case "download-all-languages":
            case "download-all-documents":
            case "download-all-blood-groups":
            case "download-all-occupations":
            case "download-all-qualifications":
            case "download-all-nationalities":
            case "download-all-countries":
            case "download-all-states":
            case "download-all-cities":
            case "download-all-income-ranges":
            case "download":
              bg = "bg-purple-600";
              hover = "hover:bg-purple-700";
              break;
            default:
              bg = "bg-gray-200";
              text = "text-gray-800";
              hover = "hover:bg-gray-300";
          }
          return (
            <button
              key={index}
              onClick={() => handleButtonAction(button.action)}
              className={`flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${bg} ${text} ${hover}`}
              type="button"
            >
              <IconComponent className="h-4 w-4" />
              {button.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Edit row handler
  const handleEditRow = (rowData: SettingsRow) => {
    setModalState({
      isOpen: true,
      type: "edit",
      action: "edit-entity",
      settingType: activeSetting.label,
      editData: rowData,
      editId: typeof (rowData as { id?: number }).id === 'number' ? (rowData as { id?: number }).id : undefined,
    });
  };

  return (
    <div className="px-7 py-3">
      <DataTable
        isLoading={isFetchingDefault || isFetchingSearch}
        data={data}
        optionalTools={optionalTools}
        searchText={searchText}
        setSearchText={setSearchText}
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        setDataLength={setDataLength}
        refetch={refetch as (options?: RefetchOptions) => Promise<QueryObserverResult<unknown[] | undefined, Error>>}
      />
      
      {/* Dynamic Modal */}
      <DynamicModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        action={modalState.action}
        settingType={modalState.settingType}
        editData={toFormData(modalState.editData)}
        editId={modalState.editId}
        onSuccess={() => {
          closeModal();
          // Invalidate the main data query to refetch data
          queryClient.invalidateQueries({
            queryKey: [activeSetting.label, { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }]
          });
        }}
      />
    </div>
  );
}
