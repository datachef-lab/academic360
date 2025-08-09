import { ApiResonse } from "@/types/api-response";
import { Settings } from "@/features/settings/types/settings.type";
import axiosInstance from "@/utils/api";

export async function findAllSettings() {
    const res = await axiosInstance.get<ApiResonse<Settings[]>>("/api/v1/settings");
    return res.data;
}

export async function updateSetting(settingId: number, value: string | File) {
    const formData = new FormData();
    formData.append(typeof value === "string" ? "value" : "file", value);

    const res = await axiosInstance.put<ApiResonse<Settings>>(
        `/api/v1/settings/${settingId}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
}