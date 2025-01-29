import { UserState } from "../../constant";
import apiClient from "../client";

type UserProfileResponse = {
  name: string;
  college: string;
  grade: number;
  number: number | null;
  email: string | null;
  phone: string | null;
  homepage: string | null;
  language: string | null;
  prefer: string | null;
};

type UserResponse = {
  id: number;
  name: string;
  password: string | null;
  profile: UserProfileResponse;
  admission: string;
  state: UserState;
  point: number;
  active: boolean;
  manager: boolean;
  slack: string | null;
  rememberToken: string | null;
  khuisAuthAt: Date;
  returnAt: Date | null;
  returnReason: string | null;
  lastLoginAt: Date;
  lastEnterAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListUserRequestDto = {
  email: string | null;
  name: string | null;
  college: string | null;
  grade: number | null;
  state: UserState | null;
  limit: number;
  offset: number;
};

type ListUserResponseDto = {
  count: number;
  users: UserResponse[];
};

export type ManageUserApiDto = {
  UserProfileResponse: UserProfileResponse;
  UserResponse: UserResponse;
  ListUserRequestDto: ListUserRequestDto;
  ListUserResponseDto: ListUserResponseDto;
};

const listUserForManager = async (request: ListUserRequestDto) => {
  const response = await apiClient.get<ListUserResponseDto>("/manager/users", {
    params: request,
  });
  return response.data;
};

export const UserManageApi = {
  listUserForManager,
};
