import { Class } from "@/types/academics/class";
import axiosInstance from "@/utils/api";

export async function getAllClasses() {
    const res = await axiosInstance.get<Class[]>("/api/classes");
    return res.data;
}