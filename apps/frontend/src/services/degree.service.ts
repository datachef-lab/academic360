import { Degree } from "@/types/resources/degree";
import axiosInstance from "@/utils/api";

export async function findAllDegrees() {
    const res = await axiosInstance.get<Degree[]>("/api/degree");

    return res.data;
}