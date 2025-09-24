import axiosInstance from "@/utils/api";

type Occupation = { id: number; name: string };

export async function getAllOccupations(): Promise<Occupation[]> {
  const res = await axiosInstance.get("/api/occupations");
  return (res.data?.payload ?? res.data?.data ?? []) as Occupation[];
}
