import axiosInstance from "@/utils/api";

export type ResourceRow = Record<string, unknown> & { id: number };

/**
 * Generic REST CRUD client for the uniform resource endpoints
 * (`/api/<basePath>`: GET /, POST /, GET /:id, PUT /:id, DELETE /:id).
 * Backend responses are wrapped in ApiResponse → unwrap `.payload`.
 */
export function makeResourceApi(basePath: string) {
  const url = `/api/${basePath}`;
  const unwrap = (data: unknown) => {
    if (data && typeof data === "object" && "payload" in data) {
      return (data as { payload: unknown }).payload;
    }
    return data;
  };

  return {
    getAll: async (): Promise<ResourceRow[]> => {
      const res = await axiosInstance.get(url);
      const payload = unwrap(res.data);
      return Array.isArray(payload) ? (payload as ResourceRow[]) : [];
    },
    create: async (data: Record<string, unknown>): Promise<ResourceRow> => {
      const res = await axiosInstance.post(url, data);
      return unwrap(res.data) as ResourceRow;
    },
    update: async (id: number, data: Record<string, unknown>): Promise<ResourceRow> => {
      const res = await axiosInstance.put(`${url}/${id}`, data);
      return unwrap(res.data) as ResourceRow;
    },
    remove: async (id: number): Promise<void> => {
      await axiosInstance.delete(`${url}/${id}`);
    },
  };
}

export type ResourceApi = ReturnType<typeof makeResourceApi>;
