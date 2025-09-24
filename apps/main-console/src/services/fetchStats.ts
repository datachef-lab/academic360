import axiosInstance from "@/utils/api";

export const fetchStats = async (academicYearId: number) => {
  const response = await axiosInstance.get(`/api/stats/${academicYearId}`);
  console.log("fetch stats", JSON.stringify(response.data.data, null, 2));
  return response.data.data;
};
