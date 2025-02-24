import { Stream } from "@/types/academics/stream";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function getAllStreams(): Promise<ApiResonse<Stream[]>> {
    const response = await axiosInstance.get(`/api/streams`);
    return response.data;
}