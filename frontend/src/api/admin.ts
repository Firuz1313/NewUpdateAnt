import { apiClient } from "./client";

export const adminApi = {
  async getStats() {
    return apiClient.get("/admin/stats");
  },
};

export default adminApi;
