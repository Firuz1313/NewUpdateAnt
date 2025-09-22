import { apiClient } from "./client";

export const adminApi = {
  async getStats() {
    return apiClient.get("/admin/stats");
  },
  async optimizeTVInterfaces() {
    return apiClient.post("/optimization/tv-interfaces/optimize");
  },
};

export default adminApi;
