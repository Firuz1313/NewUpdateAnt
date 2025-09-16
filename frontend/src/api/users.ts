import { apiClient } from ".";

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: "admin" | "moderator" | "user";
  emailVerified: boolean;
  lastLogin: string | null;
  loginCount: number;
  isActive: boolean;
  createdAt: string;
}

export const usersApi = {
  async getAll(): Promise<UserDto[]> {
    const res = await apiClient.get("/users");
    return (res.data as any[]).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified ?? u.email_verified ?? false,
      lastLogin: u.lastLogin ?? u.last_login ?? null,
      loginCount: u.loginCount ?? u.login_count ?? 0,
      isActive: u.isActive ?? u.is_active ?? true,
      createdAt: u.createdAt ?? u.created_at,
    }));
  },
};

export default usersApi;
