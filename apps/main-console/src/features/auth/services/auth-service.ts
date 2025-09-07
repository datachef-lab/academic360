import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { UserDto } from "@repo/db/dtos/user";

export async function login(credential: { email: string, password: string }) {
    const response = await axiosInstance.post<ApiResonse<{ accessToken: string; user: UserDto }>>("/auth/login", credential, { withCredentials: true });
    console.log(response.data);
    return response.data;
}

export async function logout() {
    const response = await axiosInstance.get("/auth/logout", { withCredentials: true });
    return response.data;
}