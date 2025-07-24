import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { Stream } from "@/pages/courses-subjects-design/streams/columns";

// Get all streams
export async function getAllStreams(): Promise<ApiResonse<Stream[]>> {
    const response = await axiosInstance.get(`/api/v1/course-design/streams`);
    return response.data;
}
