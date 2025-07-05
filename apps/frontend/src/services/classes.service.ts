import { Class } from "@/types/academics/class";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function getAllClasses(): Promise<ApiResonse<Class[]>> {
    const res = await axiosInstance.get<ApiResonse<Class[]>>("/api/classes");
    return res.data;
}