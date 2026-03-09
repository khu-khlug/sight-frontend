import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";
import { ActivityFrequency, GroupType } from "../../constant";

// DTOs
export type GroupMatchingDto = {
  id: string;
  year: number;
  semester: number;
  closedAt: string;
  createdAt: string;
};

export type GroupMatchingOptionDto = {
  id: string;
  name: string;
};

export type MatchedGroupDto = {
  id: string;
  groupId: number;
  createdAt: string;
};

export type MyGroupMatchingAnswerDto = {
  id: string;
  userId: number;
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
  matchedGroups: MatchedGroupDto[];
  createdAt: string;
  updatedAt: string;
};

export type SubmitAnswerRequestDto = {
  groupType: GroupType;
  isPreferOnline: boolean;
  activityFrequency: ActivityFrequency;
  activityFormat: string;
  otherSuggestions?: string;
  selectedOptionIds?: string[];
  customOption?: string;
  role?: string;
  hasIdea?: boolean;
  idea?: string;
};

export type UpdateAnswerRequestDto = SubmitAnswerRequestDto;

export type GroupMatchingPublicApiDto = {
  GroupMatchingDto: GroupMatchingDto;
  GroupMatchingOptionDto: GroupMatchingOptionDto;
  MyGroupMatchingAnswerDto: MyGroupMatchingAnswerDto;
  SubmitAnswerRequestDto: SubmitAnswerRequestDto;
  UpdateAnswerRequestDto: UpdateAnswerRequestDto;
};

// API functions

/** 현재 진행 중인 그룹 매칭 조회 */
const getCurrentGroupMatching = async (): Promise<GroupMatchingDto | null> => {
  try {
    const response = await apiV2Client.get<GroupMatchingDto>(
      "/group-matchings/ongoing"
    );
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

/** 특정 그룹 매칭의 옵션 목록 조회 (기초 언어 스터디 / 프로젝트형 스터디) */
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

/** 내 설문 응답 조회 */
const getMyAnswer = async (
  groupMatchingId: string
): Promise<MyGroupMatchingAnswerDto | null> => {
  try {
    const response = await apiV2Client.get<MyGroupMatchingAnswerDto>(
      `/group-matchings/${groupMatchingId}/answers/@me`
    );
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

/** 설문 응답 제출 */
const submitAnswer = async (
  groupMatchingId: string,
  dto: SubmitAnswerRequestDto
): Promise<MyGroupMatchingAnswerDto> => {
  const response = await apiV2Client.post<MyGroupMatchingAnswerDto>(
    `/group-matchings/${groupMatchingId}/answers`,
    dto
  );
  return response.data;
};

/** 설문 응답 수정 */
const updateAnswer = async (
  groupMatchingId: string,
  dto: UpdateAnswerRequestDto
): Promise<MyGroupMatchingAnswerDto> => {
  const response = await apiV2Client.put<MyGroupMatchingAnswerDto>(
    `/group-matchings/${groupMatchingId}/answers/@me`,
    dto
  );
  return response.data;
};

export const GroupMatchingPublicApi = {
  getCurrentGroupMatching,
  listOptions,
  getMyAnswer,
  submitAnswer,
  updateAnswer,
};
