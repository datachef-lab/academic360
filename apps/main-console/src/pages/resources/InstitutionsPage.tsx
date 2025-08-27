import { Button } from "@/components/ui/button";
import { QueryObserverResult, RefetchOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SchoolIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomPaginationState, fetchData, getOptionalToolsConfig, SettingsRow, toFormData } from ".";
import { ColumnDef } from "@tanstack/react-table";
import { getSearchedUsers } from "@/services/user";
// import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { DynamicModal } from "@/components/settings/DynamicModal";

export default function InstitutionsPage() {
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
  }, []);

  const { isLoading: isFetchingDefault } = useQuery({
    queryKey: ["board-universities", { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
    queryFn: async () => {
      const { data, columns: tableCol } = await fetchData(
        {
          activeResource: { label: "Institutions", endpoint: "/institutions" },
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
        },
        handleEditRow,
      );
      console.log(data);
      setColumns(tableCol as ColumnDef<unknown, unknown>[]);

      // Handle different response structures
      let content: SettingsRow[] = [],
        page: number,
        pageSize: number,
        totalElements: number,
        totalPages: number;

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
    console.log(`Action triggered: ${action} for ${"Institutions"}`);

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
      settingType: "Institutions",
      editId: typeof modalState.editId === "number" ? modalState.editId : undefined,
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
    const toolsConfig = getOptionalToolsConfig("Institutions");

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

  //   const optionalTools = (
  //     <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50/50 rounded-lg border mt-3 border-gray-200">
  //       <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 w-full">
  //         <span>Quick Actions</span>
  //       </div>
  //       <div className="flex flex-wrap gap-2">
  //         {toolsConfig.buttons.map((button, index) => {
  //           const IconComponent = button.icon;
  //           // Color logic
  //           let bg = "";
  //           let text = "text-white";
  //           let hover = "";
  //           switch (button.action) {
  //             case "add-user":
  //             case "add-board-university":
  //             case "add-institution":
  //             case "add-category":
  //             case "add-degree":
  //             case "add-religion":
  //             case "add-language":
  //             case "add-document":
  //             case "add-blood-group":
  //             case "add-occupation":
  //             case "add-qualification":
  //             case "add-nationality":
  //             case "add-country":
  //             case "add-state":
  //             case "add-city":
  //             case "add-income-range":
  //             case "add":
  //               bg = "bg-blue-600";
  //               hover = "hover:bg-blue-700";
  //               break;
  //             case "import-users":
  //             case "import":
  //               bg = "bg-green-600";
  //               hover = "hover:bg-green-700";
  //               break;
  //             case "export-users":
  //             case "export":
  //               bg = "bg-orange-500";
  //               hover = "hover:bg-orange-600";
  //               break;
  //             case "download-template":
  //             case "download-all-board-university":
  //             case "download-all-institutions":
  //             case "download-all-categories":
  //             case "download-all-degrees":
  //             case "download-all-religions":
  //             case "download-all-languages":
  //             case "download-all-documents":
  //             case "download-all-blood-groups":
  //             case "download-all-occupations":
  //             case "download-all-qualifications":
  //             case "download-all-nationalities":
  //             case "download-all-countries":
  //             case "download-all-states":
  //             case "download-all-cities":
  //             case "download-all-income-ranges":
  //             case "download":
  //               bg = "bg-purple-600";
  //               hover = "hover:bg-purple-700";
  //               break;
  //             default:
  //               bg = "bg-gray-200";
  //               text = "text-gray-800";
  //               hover = "hover:bg-gray-300";
  //           }
  //           return (
  //             <button
  //               key={index}
  //               onClick={() => handleButtonAction(button.action)}
  //               className={`flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${bg} ${text} ${hover}`}
  //               type="button"
  //             >
  //               <IconComponent className="h-4 w-4" />
  //               {button.label}
  //             </button>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   );

  // Edit row handler
  const handleEditRow = (rowData: SettingsRow) => {
    setModalState({
      isOpen: true,
      type: "edit",
      action: "edit-entity",
      settingType: "Institution",
      editData: rowData,
      editId: typeof (rowData as { id?: number }).id === "number" ? (rowData as { id?: number }).id : undefined,
    });
  };

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4 bg-purple-500 rounded-t-lg"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl shadow-xl"
          >
            <SchoolIcon className="h-8 w-8 drop-shadow-xl text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Institutions</h2>
            <p className="text-sm text-white/80 font-medium">
              Customize your preferences and manage configurations effortlessly.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Bulk Uploda</Button>
          <Button variant="outline">Download Template</Button>
          <Button variant="outline">Add</Button>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-white/40 via-white/60 to-white/40 rounded-full origin-left col-span-full"
        />
      </motion.div>

      {/* Tools */}
      {/* <div className="flex justify-between py-4">
        <Input type="text" placeholder="Search" className="w-1/3" />
        <Button type="button" className="bg-green-800 hover:bg-green-900">
          Download
        </Button>
      </div> */}

      <DataTable
        isLoading={isFetchingDefault || isFetchingSearch}
        data={data}
        optionalTools={optionalTools}
        searchText={searchText}
        setSearchText={setSearchText}
        columns={columns}
        // viewDataToolbar={false}
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
            queryKey: ["Institutions", { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
          });
          refetch(optionalTools);
        }}
      />
    </div>
  );
}
