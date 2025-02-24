import { SubjectMetadata } from "@/types/academics/subject-metadata";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

interface FiltersProps {
    streamId: number;
    course: "HONOURS" | "GENERAL";
    semester: number;
    framework: "CCF" | "CBCS";
}


export async function getSubjectMetadataByFilters(filters: FiltersProps): Promise<ApiResonse<SubjectMetadata[]>> {
    const response = await axiosInstance.post(`/api/subject-metadatas/filters`, filters);
    console.log(response.data);
    return response.data;
}