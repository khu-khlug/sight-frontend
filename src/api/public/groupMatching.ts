import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";
import { GroupType } from "../../constant";

// DTOs
export type GroupMatchingDto = {
  id: string;
  year: number;
  semester: number;
  closedAt: string;
  createdAt: string;
};

export type GroupMatchingFieldDto = {
  id: string;
  name: string;
};

export type MatchedGroupDto = {
  id: string;
  groupId: number;
  createdAt: string;
};

export type GroupMatchingSubjectDto = {
  id: string;
  subject: string;
};

export type MyGroupMatchingAnswerDto = {
  id: string;
  userId: number;
  groupType: GroupType;
  isPreferOnline: boolean;
  groupMatchingId: string;
  fields: GroupMatchingFieldDto[];
  matchedGroups: MatchedGroupDto[];
  groupMatchingSubjects: GroupMatchingSubjectDto[];
  createdAt: string;
  updatedAt: string;
};

export type SubmitAnswerRequestDto = {
  groupType: GroupType;
  isPreferOnline: boolean;
  groupMatchingFieldIds: string[];
  groupMatchingSubjects: string[];
};

export type UpdateAnswerRequestDto = {
  groupType: GroupType;
  isPreferOnline: boolean;
  fieldIds: string[];
  subjects: string[];
};

export type CreateFieldRequestDto = {
  fieldName: string;
  requestReason: string;
};

export type CreateFieldRequestResponseDto = {
  id: string;
  fieldName: string;
  requestReason: string;
  createdAt: string;
};

export type GroupMatchingPublicApiDto = {
  GroupMatchingDto: GroupMatchingDto;
  GroupMatchingFieldDto: GroupMatchingFieldDto;
  MyGroupMatchingAnswerDto: MyGroupMatchingAnswerDto;
  SubmitAnswerRequestDto: SubmitAnswerRequestDto;
  UpdateAnswerRequestDto: UpdateAnswerRequestDto;
  CreateFieldRequestDto: CreateFieldRequestDto;
  CreateFieldRequestResponseDto: CreateFieldRequestResponseDto;
};

// API functions
const getCurrentGroupMatching = async (): Promise<GroupMatchingDto | null> => {
  try {
    const response = await apiV2Client.get<GroupMatchingDto>("/group-matchings/ongoing");
    return response.data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

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

const listAvailableFields = async (): Promise<GroupMatchingFieldDto[]> => {
  const response = await apiV2Client.get<GroupMatchingFieldDto[]>("/fields");
  return response.data;
};

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

const createFieldRequest = async (
  dto: CreateFieldRequestDto
): Promise<CreateFieldRequestResponseDto> => {
  const response = await apiV2Client.post<CreateFieldRequestResponseDto>(
    "/field-requests",
    dto
  );
  return response.data;
};

export const GroupMatchingPublicApi = {
  getCurrentGroupMatching,
  getMyAnswer,
  listAvailableFields,
  submitAnswer,
  updateAnswer,
  createFieldRequest,
};
