import apiV2Client from "../client/v2";
import { ActivityFrequency, GroupType } from "../../constant";

// ============================================================================
// API Request DTOs
// ============================================================================

export type CreateGroupMatchingOptionInput = {
  name: string;
  type: "BASIC_LANGUAGE_STUDY" | "PROJECT_STYLE_STUDY";
};

// POST /group-matchings
export type CreateGroupMatchingRequest = {
  year: number;
  semester: number;
  closedAt: string; // ISO 8601 datetime
  options: CreateGroupMatchingOptionInput[];
};

// PATCH /group-matchings/{groupMatchingId}/closed-at
export type UpdateClosedAtRequest = {
  closedAt: string; // ISO 8601 datetime
};

// ============================================================================
// API Response DTOs
// ============================================================================

// POST /group-matchings, GET /group-matchings 각 항목
export type GroupMatchingResponse = {
  id: string;
  year: number;
  semester: number;
  createdAt: string; // ISO 8601 datetime
  closedAt: string; // ISO 8601 datetime
};

// GET /group-matchings
export type ListGroupMatchingsResponse = {
  count: number;
  groupMatchings: GroupMatchingResponse[];
};

// PATCH /group-matchings/{groupMatchingId}/closed-at
export type UpdateClosedAtResponse = {
  groupMatchingId: string;
  year: number;
  semester: number;
  closedAt: string;
  createdAt: string;
};

// GET /group-matchings/{id}/options
export type GroupMatchingOptionDto = {
  id: string;
  name: string;
};

// GET /group-matchings/{groupMatchingId}/groups 각 항목
export type GroupResponse = {
  id: number;
  title: string;
  members: Array<{
    id: number;
    userId: number;
    name: string;
    number: number;
  }>;
  createdAt: string;
};

// ============================================================================
// 관리자 응답 목록 관련 타입
// ============================================================================

export type GroupMatchingAnswerDto = {
  id: string;
  userId: number;
  answerUserName: string;
  answerUserNumber: number | null;
  groupMatchingId: string;
  groupType: GroupType;
  isPreferOnline: boolean;
  activityFrequency: ActivityFrequency;
  activityFormat: string;
  otherSuggestions: string | null;
  selectedOptions: GroupMatchingOptionDto[];
  customOption: string | null;
  role: string | null;
  hasIdea: boolean | null;
  idea: string | null;
  matchedGroups: { id: string; groupId: number; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ListAnswersRequestDto = {
  groupMatchingId: string;
  groupType?: GroupType | null;
  optionId?: string | null;
  limit: number;
  offset: number;
};

export type ListAnswersResponseDto = {
  count: number;
  answers: GroupMatchingAnswerDto[];
};

// ============================================================================
// Combined export type
// ============================================================================

export type GroupMatchingManageApiDto = {
  GroupMatchingResponse: GroupMatchingResponse;
  GroupMatchingOptionDto: GroupMatchingOptionDto;
  GroupMatchingAnswerDto: GroupMatchingAnswerDto;
  CreateGroupMatchingRequest: CreateGroupMatchingRequest;
  UpdateClosedAtRequest: UpdateClosedAtRequest;
  ListAnswersRequestDto: ListAnswersRequestDto;
  ListAnswersResponseDto: ListAnswersResponseDto;
  GroupResponse: GroupResponse;
};

// ============================================================================
// API 함수들
// ============================================================================

/** POST /group-matchings */
const createGroupMatching = async (
  request: CreateGroupMatchingRequest
): Promise<GroupMatchingResponse> => {
  const response = await apiV2Client.post<GroupMatchingResponse>(
    "/group-matchings",
    request
  );
  return response.data;
};

/** GET /group-matchings */
const listGroupMatchings = async (): Promise<ListGroupMatchingsResponse> => {
  const response = await apiV2Client.get<ListGroupMatchingsResponse>(
    "/group-matchings"
  );
  return response.data;
};

/** GET /group-matchings/{id}/options?type= */
const listOptions = async (
  groupMatchingId: string,
  type: "BASIC_LANGUAGE_STUDY" | "PROJECT_STYLE_STUDY"
): Promise<GroupMatchingOptionDto[]> => {
  const response = await apiV2Client.get<GroupMatchingOptionDto[]>(
    `/group-matchings/${groupMatchingId}/options`,
    { params: { type } }
  );
  return response.data;
};

/** GET /group-matchings/{groupMatchingId}/groups */
const listGroupsByGroupMatching = async (
  groupMatchingId: string,
  groupType?: GroupType | null
): Promise<GroupResponse[]> => {
  const response = await apiV2Client.get<GroupResponse[]>(
    `/group-matchings/${groupMatchingId}/groups`,
    {
      params: groupType ? { groupType } : {},
    }
  );
  return response.data;
};

/** PATCH /group-matchings/{groupMatchingId}/closed-at */
const updateGroupMatchingClosedAt = async (
  groupMatchingId: string,
  request: UpdateClosedAtRequest
): Promise<UpdateClosedAtResponse> => {
  const response = await apiV2Client.patch<UpdateClosedAtResponse>(
    `/group-matchings/${groupMatchingId}/closed-at`,
    request
  );
  return response.data;
};

/** GET /group-matchings/{groupMatchingId}/answers (관리자) */
const listAnswers = async (
  dto: ListAnswersRequestDto
): Promise<ListAnswersResponseDto> => {
  const response = await apiV2Client.get<ListAnswersResponseDto>(
    `/group-matchings/${dto.groupMatchingId}/answers`,
    {
      params: {
        groupType: dto.groupType,
        optionId: dto.optionId,
        offset: dto.offset,
        limit: dto.limit,
      },
    }
  );
  return response.data;
};

export const GroupMatchingManageApi = {
  createGroupMatching,
  listGroupMatchings,
  listOptions,
  listGroupsByGroupMatching,
  updateGroupMatchingClosedAt,
  listAnswers,
};
