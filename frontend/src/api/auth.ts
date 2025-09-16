import { apiClient } from ".";

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; username: string; role: string };
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data as LoginResponse;
  },
  async me() {
    const res = await apiClient.get("/auth/me");
    return res.data as {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  },
};

export default authApi;
