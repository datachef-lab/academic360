// // // // // src/hooks/useResourceManager.ts
// // // // import { useQuery, useMutation } from "@tanstack/react-query";
// // // // import axios, { AxiosError } from "axios";
// // // // import { useEffect, useState } from "react";

// // // // type ResourceManagerOptions<T, CreateDto = T, UpdateDto = Partial<T>> = {
// // // //   queryKey: string[];
// // // //   fetchFn: (id: number) => Promise<T>;
// // // //   createFn: (data: CreateDto) => Promise<T>;
// // // //   updateFn: (id: number, data: UpdateDto) => Promise<T>;
// // // //   initialData: CreateDto;
// // // //   onSuccess?: (data: T, action: "create" | "update") => void;
// // // //   onError?: (error: unknown, action: "fetch" | "create" | "update") => void;
// // // // };

// // // // export const useResourceManager = <T, CreateDto = T, UpdateDto = <T>>(
// // // //   id: number,
// // // //   {
// // // //     queryKey,
// // // //     fetchFn,
// // // //     createFn,
// // // //     updateFn,
// // // //     initialData,
// // // //     onSuccess,
// // // //     onError,
// // // //   }: ResourceManagerOptions<T, CreateDto, UpdateDto>
// // // // ) => {
// // // //   // const queryClient = useQueryClient();
// // // //   const [resourceData, setResourceData] = useState<CreateDto>(initialData);
// // // //   const [isNew, setIsNew] = useState(false);
// // // //    console.log(id, "id in useResourceManager");
// // // //   const { data, error, isError, isLoading } = useQuery<T, AxiosError>({
// // // //     queryKey: [...queryKey, id],
// // // //     queryFn: () => fetchFn(id),
// // // //     enabled: !!id,
// // // //     retry: (count, error) => {
// // // //       if (axios.isAxiosError(error) && error.response?.status === 404) {
// // // //         return false;
// // // //       }
// // // //       return count < 3;
// // // //     },
    
// // // //     });



// // // //   useEffect(() => {
// // // //    if (data) {
// // // //       console.log("Data fetched:", data);
// // // //       setIsNew(false);
// // // //       setResourceData(data as unknown as CreateDto);
      
// // // //     }
// // // //     else if(isError && axios.isAxiosError(error) && error.response?.status === 404) {
// // // //       setIsNew(true);
// // // //       setResourceData(initialData);
// // // //     } else  {
// // // //       console.log("Error fetching data:", error);
// // // //       onError?.(error, "fetch");
// // // //     }
// // // //   }, [isError, error, initialData, onError,data]);

// // // //   const create = useMutation({
// // // //     mutationFn: createFn,
// // // //     onSuccess: (data) => {
// // // //       setIsNew(false);
// // // //       setResourceData(data as unknown as CreateDto);
// // // //       onSuccess?.(data, "create");
// // // //       // queryClient.invalidateQueries({ queryKey: [...queryKey, id] });
// // // //     },
// // // //     onError: (error) => onError?.(error, "create"),
// // // //   });

// // // //   const update = useMutation({
// // // //     mutationFn: (data: UpdateDto) => updateFn(id, data),
// // // //     onSuccess: (data) => {
// // // //       setResourceData(data as unknown as CreateDto);
// // // //       onSuccess?.(data, "update");
// // // //       // queryClient.invalidateQueries({ queryKey: [...queryKey, id] });
// // // //     },
// // // //     onError: (error) => onError?.(error, "update"),
// // // //   });

// // // //   const submitResource = (data: CreateDto | UpdateDto) => {
// // // //     if (isNew) {
// // // //       create.mutate(data as unknown as CreateDto);
// // // //     } else {
// // // //       update.mutate(data as UpdateDto);
// // // //     }
// // // //   };

// // // //   return {
// // // //     resourceData,
// // // //     setResourceData,
// // // //     isNewResource: isNew,
   
// // // //     fetchError: error,
// // // //     isFetchError: isError,
// // // //     isFetching: isLoading,
// // // //     isSubmitting: create.isPending || update.isPending,
// // // //     submitError: create.error || update.error,
// // // //     submitResource,
// // // //   };
// // // // };

// // // import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
// // // import axios, { AxiosError } from "axios";
// // // import { useEffect, useState } from "react";
// // // import { useLocation } from "react-router-dom";

// // // interface FormManagerOptions<TData, TError = AxiosError> {
// // //   queryKey: string[];
// // //   queryFn: (id: number) => Promise<TData>;
// // //   mutationFn: (data: TData, id?: number) => Promise<TData>;
// // //   createFn?: (data: TData) => Promise<TData>;
// // //   defaultFormData: TData;
// // //   id?: number;
// // //   enabled?: boolean;
// // //   queryOptions?: Partial<UseQueryOptions<TData, TError>>;
// // //   mutationOptions?: Partial<UseMutationOptions<TData, TError, TData>>;
// // // }

// // // export const useFormManager = <TData extends { studentId: number }, TError = AxiosError>({
// // //   queryKey,
// // //   queryFn,
// // //   mutationFn,
// // //   createFn,
// // //   defaultFormData,
// // //   id: propId,
// // //   enabled = true,
// // //   queryOptions,
// // //   mutationOptions,
// // // }: FormManagerOptions<TData, TError>) => {
// // //   const location = useLocation();
// // //   const pathId = Number(location.pathname.split("/").pop());
// // //   const id = propId ?? pathId;

// // //   const [formData, setFormData] = useState<TData>(defaultFormData);
// // //   const [isNew, setIsNew] = useState(false);

// // //   // Fetch data
// // //   const { data, error, isError, isLoading } = useQuery<TData, TError>({
// // //     queryKey: [...queryKey, id],
// // //     queryFn: () => queryFn(id),
// // //     enabled: enabled && !!id,
// // //     retry: false,
// // //     ...queryOptions,
// // //   });

// // //   // Handle 404 → New form
// // //   useEffect(() => {
// // //     if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
// // //       setIsNew(true);
// // //       setFormData({ ...defaultFormData, studentId: id });
// // //     } else if (data) {
// // //       setFormData(data);
// // //       setIsNew(false);
// // //     }
// // //   }, [data, error, isError, id, defaultFormData]);

// // //   // Mutation (update or create)
// // //   const mutation = useMutation<TData, TError, TData>({
// // //     mutationFn: (data) => isNew && createFn ? createFn(data) : mutationFn(data, id),
// // //     onSuccess: (savedData) => {
// // //       setFormData(savedData);
// // //       setIsNew(false);
// // //     },
// // //     ...mutationOptions,
// // //   });

// // //   // Handle form changes
// // //   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const { name, value, type, checked } = e.target;
// // //     setFormData(prev => ({
// // //       ...prev,
// // //       [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
// // //     }));
// // //   };

// // //   // Handle dropdown/select changes
// // //   const handleSelect = (name: keyof TData, value: TData[keyof TData]) => {
// // //     setFormData(prev => ({
// // //       ...prev,
// // //       [name]: value,
// // //     }));
// // //   };

// // //   // Submit handler
// // //   const handleSubmit = (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     mutation.mutate(formData);
// // //   };

// // //   return {
// // //     formData,
// // //     setFormData,
// // //     handleChange,
// // //     handleSelect,
// // //     handleSubmit,
// // //     isLoading,
// // //     isError,
// // //     error,
// // //     isNew,
// // //     isMutating: mutation.isPending,
// // //     id,
// // //   };
// // // };

// import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
// import axios, { AxiosError } from "axios";
// import { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { useRef } from "react";





// interface FormManagerOptions<TData, TError = AxiosError> {
//   queryKey: string[];
//   queryFn: (id: number) => Promise<TData>;
//   mutationFn: (data: TData, id?: number) => Promise<TData>;
//   createFn?: (data: TData) => Promise<TData>;
//   defaultFormData: TData;
//   id?: number;
//   enabled?: boolean;
//   queryOptions?: Partial<UseQueryOptions<TData, TError>>;
//   mutationOptions?: Partial<UseMutationOptions<TData, TError, TData>>;
// }

// export const useFormManager = <TData extends { studentId: number}, TError = AxiosError>({
//   queryKey,
//   queryFn,
//   mutationFn,
//   createFn,
//   defaultFormData,
//   id: propId,
//   enabled = true,

//   mutationOptions,
// }: FormManagerOptions<TData, TError>) => {
//   const location = useLocation();
//   const pathId = Number(location.pathname.split("/").pop());
//   const id = propId ?? pathId;

//   // console.log("[FormManager] Initializing with:", {
//   //   queryKey,
//   //   defaultFormData,
//   //   propId,
//   //   pathId,
//   //   resolvedId: id
//   // });

//   const [formData, setFormData] = useState<TData>();
//   const [isNew, setIsNew] = useState(false);
//   const effectRunCount = useRef(0);
//   // Fetch data
//   const { data, error, isError, isLoading } = useQuery<TData, TError>({
//     queryKey: [...queryKey, id],
//     queryFn: () => queryFn(id),
//     enabled: enabled && !!id,
//     retry: false,
   
//   });

//   // Handle 404 → New form
//   useEffect(() => {
//     effectRunCount.current += 1;
//   console.log(`[FormManager] useEffect run count: ${effectRunCount.current}`);
  
//     if (isError && axios.isAxiosError(error)) {
//       console.log("Axios error detected, status:", error.response?.status);
      
//       if (error.response?.status === 404) {
//         console.log("404 detected - treating as new record");
//         setIsNew(true);
//         const newFormData = { ...defaultFormData, studentId: id };
//         console.log("Setting new form data:", newFormData);
//         setFormData(newFormData);
//       }
//     } else if (data) {
//       console.log("Data received - updating form state");
//       console.log("Payload data:", data);
//       setFormData(data); 
//       setIsNew(false);
//     }

//     console.groupEnd();
//   }, [data, error, isError, id, defaultFormData]);

//   const mutation = useMutation<TData, TError, TData>({
//     mutationFn: async (data) => {
//       console.group("[FormManager] Mutation execution");
//       console.log("Is new record:", isNew);
     
//       if(isNew){
       
//         console.log("Data being submitted:", data);

//       }else{
       
//         console.log("Data being submitted:", data,"with updated ID",id);
//       }
      
//       try {
//         const result = isNew && createFn 
//           ? await createFn(data)
//           : await mutationFn(data, id);
        
//         console.log("Mutation successful, result:", result);
//         return result;
//       } catch (err) {
//         console.error("Mutation failed:", err);
//         throw err;
//       } finally {
//         console.groupEnd();
//       }
//     },
//     onSuccess: (savedData) => {
//       console.log("[FormManager] Mutation success, updating form with:", savedData);
//       setFormData(savedData);
//       setIsNew(false);
//     },
//     onError: (error) => {
//       console.error("[FormManager] Mutation error:", {
//         error: error instanceof Error ? error.message : error,
//         isAxiosError: axios.isAxiosError(error),
//         status: axios.isAxiosError(error) ? error.response?.status : undefined,
//         responseData: axios.isAxiosError(error) ? error.response?.data : undefined
//       });
//     },
//     ...mutationOptions,
//   });

//   // Log form data changes
//   useEffect(() => {
//     console.log("[FormManager] Form data updated:", formData);
//   }, [formData]);

//   // Handle form changes
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === "checkbox" ? checked : type === "number" ? Number(value) : value;
    
//     console.log("[FormManager] Field change:", {
//       field: name,
//       value,
//       type,
//       parsedValue: newValue
//     });

//     setFormData(prev => ({
//       ...(prev as TData),
//       [name]: newValue,
//     }));
//   };

//   // Handle dropdown/select changes
//   const handleSelect = (name: keyof TData, value: TData[keyof TData]) => {
//     console.log("[FormManager] Select change:", {
//       field: name,
//       value
//     });

//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//     } as TData));
//   };

//   // Submit handler
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log("[FormManager] Form submission triggered with data:", formData);
//     if (formData) {
//       mutation.mutate(formData);
//     } else {
//       console.error("[FormManager] Form data is undefined, cannot submit.");
//     }
//   };

//   return {
//     formData,
//     setFormData,
//     handleChange,
//     handleSelect,
//     handleSubmit,
//     isLoading,
//     isError,
//     error,
//     isNew,
//     isMutating: mutation.isPending,
//     id,
//   };
// };

// // import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
// // import axios, { AxiosError } from "axios";
// // import { useCallback, useEffect, useState } from "react";
// // import { useLocation } from "react-router-dom";

// // interface ApiResponse<T> {
// //   httpStatus: string;
// //   httpStatusCode: number;
// //   message: string;
// //   payload: T;
// // }

// // interface FormManagerOptions<TData, TError = AxiosError> {
// //   queryKey: string[];
// //   queryFn: (id: number) => Promise<TData | ApiResponse<TData>>;
// //   mutationFn: (data: TData, id?: number) => Promise<TData | ApiResponse<TData>>;
// //   createFn?: (data: TData) => Promise<TData | ApiResponse<TData>>;
// //   defaultFormData: TData;
// //   id?: number;
// //   enabled?: boolean;
// //   queryOptions?: Partial<UseQueryOptions<TData | ApiResponse<TData>, TError>>;
// //   mutationOptions?: Partial<UseMutationOptions<TData | ApiResponse<TData>, TError, TData>>;
// // }

// // export const useFormManager = <TData extends { id?: number; studentId: number }, TError = AxiosError>({
// //   queryKey,
// //   queryFn,
// //   mutationFn,
// //   createFn,
// //   defaultFormData,
// //   id: propId,
// //   enabled = true,
// //   queryOptions,
// //   mutationOptions,
// // }: FormManagerOptions<TData, TError>) => {
// //   const location = useLocation();
// //   const pathId = Number(location.pathname.split("/").pop());
// //   const id = propId ?? pathId;
// // const isApiResponse = useCallback((data: unknown): data is ApiResponse<TData> => {
// //     return data !== null && typeof data === 'object' && 'payload' in data;
// //   }, []);

// //   const [formData, setFormData] = useState<TData>();

// //   const [isNew, setIsNew] = useState(false);
// //   const [updateId, setUpdateId] = useState<number>();

// //   const { data, error, isError, isLoading } = useQuery<TData | ApiResponse<TData>, TError>({
// //     queryKey: [...queryKey, id],
// //     queryFn: async () => {
// //       const result = await queryFn(id);
// //       return result;
// //     },
// //     enabled: enabled && !!id,
// //     retry: false,
// //     ...queryOptions,
// //   });

// //   useEffect(() => {
// //     if (isError && axios.isAxiosError(error)) {
// //       if (error.response?.status === 404) {
// //         setIsNew(true);
// //         const newFormData = { ...defaultFormData, studentId: id };
// //         setFormData(newFormData);
// //       }
// //     } else if (data) {
// //       const responseData = isApiResponse(data) ? (data as ApiResponse<TData>).payload : (data as TData);
// //       setUpdateId(responseData.id);
// //       setFormData(responseData);
// //       setIsNew(false);
// //     }
// //   }, [data, error, isError, id, defaultFormData, isApiResponse]);

// //   const mutation = useMutation<TData | ApiResponse<TData>, TError, TData>({
// //     mutationFn: async (data) => {
// //       return isNew && createFn 
// //         ? await createFn(data)
// //         : await mutationFn(data, updateId);
// //     },
// //     onSuccess: (savedData) => {
// //       const responseData = isApiResponse(savedData) ? (savedData as ApiResponse<TData>).payload : (savedData as TData);
// //       setFormData(responseData);
// //       setIsNew(false);
// //     },
// //     onError: (error) => {
// //       console.error("Mutation error:", error);
// //     },
// //     ...mutationOptions,
// //   });

  
// //   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
// //     const { name, value, type } = e.target;
// //     const target = e.target as HTMLInputElement; // For checkbox/radio specific properties
  
// //     let newValue: string | number | boolean | null;
  
// //     switch (type) {
// //       case 'checkbox':
// //         newValue = target.checked;
// //         break;
// //       case 'number':
// //         newValue = value === '' ? null : Number(value);
// //         break;
// //       case 'date':
// //         newValue = value || null;
// //         break;
// //       default:
// //         newValue = value;
// //     }
  
// //     setFormData(prev => {
// //       if (!prev) return prev; // Guard against undefined
// //       return {
// //         ...prev,
// //         [name]: newValue,
// //       };
// //     });
// //   };

// //   const handleSelect = <K extends keyof TData>(name: K, value: TData[K]) => {
  
    
// //         setFormData(prev => ({
// //           ...(prev as TData),
// //           [name]: value,
// //         }));
     
 
// //   };

// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (formData) {
// //       mutation.mutate(formData);
// //     }
// //   };

// //   return {
// //     formData,
// //     setFormData,
// //     handleChange,
// //     handleSelect,
// //     handleSubmit,
// //     isLoading,
// //     isError,
// //     error,
// //     isNew,
// //     isMutating: mutation.isPending,
// //     id,
// //   };
// // };

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useState } from "react";

interface CreateOrUpdateOptions<TData, TError> {
  updateFn: (data: TData) => Promise<TData>;
  createFn: (data: TData) => Promise<TData>;
  defaultData: TData;
  updateOptions?: Partial<UseMutationOptions<TData, TError, TData>>;
  createOptions?: Partial<UseMutationOptions<TData, TError, TData>>;
}

export const useFormManager = <TData, TError = Error>({
  updateFn,
  createFn,
  defaultData,
  updateOptions,
  createOptions,
}: CreateOrUpdateOptions<TData, TError>) => {
  const [formData, setFormData] = useState<TData>(defaultData);
  const [isNew, setIsNew] = useState(true);

  const initializeData = (data: TData, isNewRecord: boolean) => {
    setFormData(data);
    setIsNew(isNewRecord);
  };

  const updateMutation = useMutation<TData, TError, TData>({
    mutationFn: updateFn,
    onSuccess: (savedData) => {
      setFormData(savedData);
      setIsNew(false);
    },
    ...updateOptions,
  });

  const createMutation = useMutation<TData, TError, TData>({
    mutationFn: createFn,
    onSuccess: (savedData) => {
      setFormData(savedData);
      setIsNew(false);
    },
    ...createOptions,
  });

  const handleChange = <K extends keyof TData>(name: K, value: TData[K]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (isNew) {
      console.log("formData",formData);
      createMutation.mutate(formData);
    } else {
    console.log("formData**",formData);
      updateMutation.mutate(formData);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    initializeData,
    isNew,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
  };
};