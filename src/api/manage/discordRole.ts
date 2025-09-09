import apiClient from "../client/v2";

export type DiscordRoleType = "MEMBER" | "GRADUATED_MEMBER" | "MANAGER";

export type GetDiscordRoleResponse = {
  id: number;
  roleType: DiscordRoleType;
  roleId: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDiscordRoleRequest = {
  roleId: string;
};

export const getDiscordRoles = async (): Promise<GetDiscordRoleResponse[]> => {
  const response = await apiClient.get<GetDiscordRoleResponse[]>(
    "/discord-roles"
  );
  return response.data;
};

export const updateDiscordRole = async (
  id: number,
  request: UpdateDiscordRoleRequest
): Promise<GetDiscordRoleResponse> => {
  const response = await apiClient.put<GetDiscordRoleResponse>(
    `/discord-roles/${id}`,
    request
  );
  return response.data;
};

export const DiscordRoleApi = {
  getDiscordRoles,
  updateDiscordRole,
};
