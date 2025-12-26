import apiV2Client from "../client/v2";

// DTOs
export type GroupMemberDto = {
  id: number;
  userId: number;
  name: string;
  number: number;
};

export type GroupDto = {
  id: number;
  title: string;
  members: GroupMemberDto[];
  createdAt: string;
};

export type CreateGroupRequestDto = {
  method: "GROUP_MATCHING";
  title: string;
  groupMatchingParams: {
    answerIds: string[];
    leaderUserId: number;
  };
};

export type CreateGroupResponseDto = {
  id: number;
};

export type AddGroupMemberRequestDto = {
  method: "GROUP_MATCHING";
  groupMatchingParams: {
    answerId: string;
  };
};

export type GroupManageApiDto = {
  GroupDto: GroupDto;
  GroupMemberDto: GroupMemberDto;
  CreateGroupRequestDto: CreateGroupRequestDto;
  CreateGroupResponseDto: CreateGroupResponseDto;
  AddGroupMemberRequestDto: AddGroupMemberRequestDto;
};

// API functions
const createGroup = async (
  dto: CreateGroupRequestDto
): Promise<CreateGroupResponseDto> => {
  const response = await apiV2Client.post<CreateGroupResponseDto>("/groups", dto);
  return response.data;
};

const addGroupMember = async (
  groupId: number,
  dto: AddGroupMemberRequestDto
): Promise<void> => {
  await apiV2Client.post(`/groups/${groupId}/members`, dto);
};

export const GroupManageApi = {
  createGroup,
  addGroupMember,
};
