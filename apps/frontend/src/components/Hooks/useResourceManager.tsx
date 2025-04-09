// // src/hooks/useResourceManager.ts
// import { useQuery, useMutation } from "@tanstack/react-query";
// import axios, { AxiosError } from "axios";
// import { useEffect, useState } from "react";

// type ResourceManagerOptions<T, CreateDto = T, UpdateDto = Partial<T>> = {
//   queryKey: string[];
//   fetchFn: (id: number) => Promise<T>;
//   createFn: (data: CreateDto) => Promise<T>;
//   updateFn: (id: number, data: UpdateDto) => Promise<T>;
//   initialData: CreateDto;
//   onSuccess?: (data: T, action: "create" | "update") => void;
//   onError?: (error: unknown, action: "fetch" | "create" | "update") => void;
// };

// export const useResourceManager = <T, CreateDto = T, UpdateDto = <T>>(
//   id: number,
//   {
//     queryKey,
//     fetchFn,
//     createFn,
//     updateFn,
//     initialData,
//     onSuccess,
//     onError,
//   }: ResourceManagerOptions<T, CreateDto, UpdateDto>
// ) => {
//   // const queryClient = useQueryClient();
//   const [resourceData, setResourceData] = useState<CreateDto>(initialData);
//   const [isNew, setIsNew] = useState(false);
//    console.log(id, "id in useResourceManager");
//   const { data, error, isError, isLoading } = useQuery<T, AxiosError>({
//     queryKey: [...queryKey, id],
//     queryFn: () => fetchFn(id),
//     enabled: !!id,
//     retry: (count, error) => {
//       if (axios.isAxiosError(error) && error.response?.status === 404) {
//         return false;
//       }
//       return count < 3;
//     },
    
//     });



//   useEffect(() => {
//    if (data) {
//       console.log("Data fetched:", data);
//       setIsNew(false);
//       setResourceData(data as unknown as CreateDto);
      
//     }
//     else if(isError && axios.isAxiosError(error) && error.response?.status === 404) {
//       setIsNew(true);
//       setResourceData(initialData);
//     } else  {
//       console.log("Error fetching data:", error);
//       onError?.(error, "fetch");
//     }
//   }, [isError, error, initialData, onError,data]);

//   const create = useMutation({
//     mutationFn: createFn,
//     onSuccess: (data) => {
//       setIsNew(false);
//       setResourceData(data as unknown as CreateDto);
//       onSuccess?.(data, "create");
//       // queryClient.invalidateQueries({ queryKey: [...queryKey, id] });
//     },
//     onError: (error) => onError?.(error, "create"),
//   });

//   const update = useMutation({
//     mutationFn: (data: UpdateDto) => updateFn(id, data),
//     onSuccess: (data) => {
//       setResourceData(data as unknown as CreateDto);
//       onSuccess?.(data, "update");
//       // queryClient.invalidateQueries({ queryKey: [...queryKey, id] });
//     },
//     onError: (error) => onError?.(error, "update"),
//   });

//   const submitResource = (data: CreateDto | UpdateDto) => {
//     if (isNew) {
//       create.mutate(data as unknown as CreateDto);
//     } else {
//       update.mutate(data as UpdateDto);
//     }
//   };

//   return {
//     resourceData,
//     setResourceData,
//     isNewResource: isNew,
   
//     fetchError: error,
//     isFetchError: isError,
//     isFetching: isLoading,
//     isSubmitting: create.isPending || update.isPending,
//     submitError: create.error || update.error,
//     submitResource,
//   };
// };