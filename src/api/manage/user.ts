import { StudentStatus, UserStatus } from "../../constant";
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
  profile: UserProfileResponse;
  admission: string;
  studentStatus: StudentStatus;
  point: number;
  status: UserStatus;
  manager: boolean;
  slack: string | null;
  rememberToken: string | null;
  khuisAuthAt: Date;
  returnAt: Date | null;
  returnReason: string | null;
  lastLoginAt: Date;
  lastEnterAt: Date;
  normalTags: string[];
  redTags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type ListUserRequestDto = {
  name: string | null;
  number: string | null;
  college: string | null;
  email: string | null;
  phone: string | null;
  grade: number | null;
  studentStatus: StudentStatus | null;
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
