import { StudentStatus, UserStatus } from "../../constant";
import apiV2Client from "../client/v2";

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

export type MemberTagFilter =
  | "UNAUTHORIZED"
  | "BLOCKED"
  | "MINUS_EXP"
  | "FEE_TARGET"
  | "HALF_FEE_TARGET";

type ListUserRequestDto = {
  name: string | null;
  number: string | null;
  college: string | null;
  email: string | null;
  phone: string | null;
  grade: number | null;
  studentStatus: StudentStatus | null;
  tag: MemberTagFilter | null;
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
  const response = await apiV2Client.get<ListUserResponseDto>(
    "/manager/users",
    {
      params: request,
    },
  );
  return response.data;
};

/** 운영진 임명 */
const appointManager = async (userId: number) => {
  await apiV2Client.put(`/manager/users/${userId}/manager`);
};

/** 운영진 해제 */
const stepdownManager = async (userId: number) => {
  await apiV2Client.delete(`/manager/users/${userId}/manager`);
};

/** 졸업 처리 */
const graduateMember = async (userId: number) => {
  await apiV2Client.post(`/manager/users/${userId}/graduation`);
};

/** 졸업 취소 처리 */
const ungraduateMember = async (userId: number) => {
  await apiV2Client.delete(`/manager/users/${userId}/graduation`);
};

/** 회원 활동 정지 */
const pauseMember = async (
  userId: number,
  body: { returnAt: string; reason: string },
) => {
  await apiV2Client.post(`/manager/users/${userId}/pause`, body);
};

/** 회원 활동 정지 해제 */
const resumeMember = async (userId: number) => {
  await apiV2Client.delete(`/manager/users/${userId}/pause`);
};

/** 회원 접속 차단 */
const blockMember = async (userId: number) => {
  await apiV2Client.post(`/manager/users/${userId}/block`);
};

/** 회원 접속 차단 해제 */
const unblockMember = async (userId: number) => {
  await apiV2Client.delete(`/manager/users/${userId}/block`);
};

/** 회원 제명 */
const expelMember = async (userId: number) => {
  await apiV2Client.delete(`/manager/users/${userId}`);
};

export const UserManageApi = {
  listUserForManager,
  appointManager,
  stepdownManager,
  graduateMember,
  ungraduateMember,
  pauseMember,
  resumeMember,
  blockMember,
  unblockMember,
  expelMember,
};
