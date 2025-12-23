// import apiV2Client from "../client/v2";
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
  createdAt: string;
  obsoletedAt: string | null;
};

export type GroupMatchingFieldRequestDto = {
  id: string;
  requesterUserId: number;
  requesterName: string;
  fieldName: string;
  requestReason: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
};

export type GroupMatchingSubjectDto = {
  id: string;
  subject: string;
};

export type GroupMatchingAnswerWithUserDto = {
  id: string;
  userId: number;
  userName: string;
  userNumber: number;
  groupType: GroupType;
  isPreferOnline: boolean;
  fields: GroupMatchingFieldDto[];
  subjects: GroupMatchingSubjectDto[];
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupMatchingRequestDto = {
  year: number;
  semester: number;
  closedAt: string;
};

export type UpdateGroupMatchingRequestDto = {
  closedAt: string;
};

export type CreateFieldRequestDto = {
  name: string;
};

export type ApproveFieldRequestDto = {
  fieldName?: string;
};

export type RejectFieldRequestDto = {
  rejectReason: string;
};

export type ListAnswersRequestDto = {
  groupMatchingId: string;
  groupType?: GroupType | null;
  fieldId?: string | null;
  limit: number;
  offset: number;
};

export type ListAnswersResponseDto = {
  count: number;
  answers: GroupMatchingAnswerWithUserDto[];
};

export type ListFieldRequestsRequestDto = {
  status?: "pending" | "approved" | "rejected" | null;
  limit: number;
  offset: number;
};

export type ListFieldRequestsResponseDto = {
  count: number;
  requests: GroupMatchingFieldRequestDto[];
};

export type GroupMatchingManageApiDto = {
  GroupMatchingDto: GroupMatchingDto;
  GroupMatchingFieldDto: GroupMatchingFieldDto;
  GroupMatchingFieldRequestDto: GroupMatchingFieldRequestDto;
  GroupMatchingAnswerWithUserDto: GroupMatchingAnswerWithUserDto;
  CreateGroupMatchingRequestDto: CreateGroupMatchingRequestDto;
  UpdateGroupMatchingRequestDto: UpdateGroupMatchingRequestDto;
  CreateFieldRequestDto: CreateFieldRequestDto;
  ApproveFieldRequestDto: ApproveFieldRequestDto;
  RejectFieldRequestDto: RejectFieldRequestDto;
  ListAnswersRequestDto: ListAnswersRequestDto;
  ListAnswersResponseDto: ListAnswersResponseDto;
  ListFieldRequestsRequestDto: ListFieldRequestsRequestDto;
  ListFieldRequestsResponseDto: ListFieldRequestsResponseDto;
};

// Mock data generators
const mockFields: GroupMatchingFieldDto[] = [
  { id: "1", name: "웹 프론트엔드", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "2", name: "백엔드", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "3", name: "모바일 앱 개발", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "4", name: "인공지능/머신러닝", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "5", name: "데이터 분석", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "6", name: "게임 개발", createdAt: "2024-01-01T00:00:00Z", obsoletedAt: null },
  { id: "7", name: "블록체인", createdAt: "2024-01-15T00:00:00Z", obsoletedAt: "2024-10-01T00:00:00Z" },
  { id: "8", name: "DevOps/인프라", createdAt: "2024-02-01T00:00:00Z", obsoletedAt: null },
];

const mockAnswers: GroupMatchingAnswerWithUserDto[] = [
  {
    id: "1",
    userId: 101,
    userName: "김철수",
    userNumber: 2021123456,
    groupType: "STUDY",
    isPreferOnline: true,
    fields: [mockFields[0], mockFields[1]],
    subjects: [
      { id: "1", subject: "React 학습" },
      { id: "2", subject: "TypeScript 심화" },
    ],
    createdAt: "2024-11-10T10:00:00Z",
    updatedAt: "2024-11-10T10:00:00Z",
  },
  {
    id: "2",
    userId: 102,
    userName: "이영희",
    userNumber: 2022234567,
    groupType: "PROJECT",
    isPreferOnline: false,
    fields: [mockFields[1], mockFields[3]],
    subjects: [
      { id: "3", subject: "AI 챗봇 개발" },
      { id: "4", subject: "FastAPI 백엔드" },
    ],
    createdAt: "2024-11-11T14:30:00Z",
    updatedAt: "2024-11-11T14:30:00Z",
  },
  {
    id: "3",
    userId: 103,
    userName: "박민수",
    userNumber: 2020345678,
    groupType: "STUDY",
    isPreferOnline: false,
    fields: [mockFields[4]],
    subjects: [{ id: "5", subject: "데이터 분석 기초" }],
    createdAt: "2024-11-12T09:15:00Z",
    updatedAt: "2024-11-15T16:20:00Z",
  },
];

const mockFieldRequests: GroupMatchingFieldRequestDto[] = [
  {
    id: "1",
    requesterUserId: 101,
    requesterName: "김철수",
    fieldName: "클라우드 컴퓨팅",
    requestReason: "AWS, GCP 등 클라우드 기술 학습을 위해 필요합니다.",
    approvedAt: null,
    rejectedAt: null,
    rejectReason: null,
    createdAt: "2024-11-08T13:00:00Z",
  },
  {
    id: "2",
    requesterUserId: 104,
    requesterName: "최지훈",
    fieldName: "사이버 보안",
    requestReason: "정보보안 분야에 관심이 많아서 추가 요청드립니다.",
    approvedAt: "2024-11-10T09:00:00Z",
    rejectedAt: null,
    rejectReason: null,
    createdAt: "2024-11-09T11:30:00Z",
  },
  {
    id: "3",
    requesterUserId: 105,
    requesterName: "정수진",
    fieldName: "양자컴퓨팅",
    requestReason: "미래 기술에 대한 스터디를 하고 싶습니다.",
    approvedAt: null,
    rejectedAt: "2024-11-12T10:00:00Z",
    rejectReason: "현재 관련 분야 전문가가 부족하여 보류합니다.",
    createdAt: "2024-11-09T15:45:00Z",
  },
];

// API functions with mock data
const getCurrentGroupMatching = async (): Promise<GroupMatchingDto | null> => {
  // const response = await apiV2Client.get<GroupMatchingDto>("/manager/group-matchings/current");
  // return response.data;

  // Mock data
  return {
    id: "1",
    year: 2024,
    semester: 2,
    closedAt: "2024-12-31T23:59:59Z",
    createdAt: "2024-11-01T00:00:00Z",
  };
};

const createGroupMatching = async (
  dto: CreateGroupMatchingRequestDto
): Promise<GroupMatchingDto> => {
  // const response = await apiV2Client.post<GroupMatchingDto>("/manager/group-matchings", dto);
  // return response.data;

  // Mock data
  return {
    id: Math.floor(Math.random() * 10000).toString(),
    year: dto.year,
    semester: dto.semester,
    closedAt: dto.closedAt,
    createdAt: new Date().toISOString(),
  };
};

const updateGroupMatching = async (
  id: string,
  dto: UpdateGroupMatchingRequestDto
): Promise<GroupMatchingDto> => {
  // const response = await apiV2Client.patch<GroupMatchingDto>(
  //   `/manager/group-matchings/${id}`,
  //   dto
  // );
  // return response.data;

  // Mock data
  return {
    id,
    year: 2024,
    semester: 2,
    closedAt: dto.closedAt,
    createdAt: "2024-11-01T00:00:00Z",
  };
};

const listAnswers = async (
  dto: ListAnswersRequestDto
): Promise<ListAnswersResponseDto> => {
  // const response = await apiV2Client.get<ListAnswersResponseDto>(
  //   "/manager/group-matching-answers",
  //   { params: dto }
  // );
  // return response.data;

  // Mock data with filtering
  let filtered = [...mockAnswers];

  if (dto.groupType) {
    filtered = filtered.filter((a) => a.groupType === dto.groupType);
  }

  if (dto.fieldId) {
    filtered = filtered.filter((a) =>
      a.fields.some((f) => f.id === dto.fieldId)
    );
  }

  const count = filtered.length;
  const paginated = filtered.slice(dto.offset, dto.offset + dto.limit);

  return {
    count,
    answers: paginated,
  };
};

const listFields = async (): Promise<GroupMatchingFieldDto[]> => {
  // const response = await apiV2Client.get<GroupMatchingFieldDto[]>(
  //   "/manager/group-matching-fields"
  // );
  // return response.data;

  // Mock data
  return mockFields;
};

const createField = async (
  dto: CreateFieldRequestDto
): Promise<GroupMatchingFieldDto> => {
  // const response = await apiV2Client.post<GroupMatchingFieldDto>(
  //   "/manager/group-matching-fields",
  //   dto
  // );
  // return response.data;

  // Mock data
  return {
    id: Math.floor(Math.random() * 10000).toString(),
    name: dto.name,
    createdAt: new Date().toISOString(),
    obsoletedAt: null,
  };
};

const obsoleteField = async (id: string): Promise<void> => {
  // await apiV2Client.delete(`/manager/group-matching-fields/${id}`);

  // Mock - no-op
  console.log("Mock: Field obsoleted", id);
};

const listFieldRequests = async (
  dto: ListFieldRequestsRequestDto
): Promise<ListFieldRequestsResponseDto> => {
  // const response = await apiV2Client.get<ListFieldRequestsResponseDto>(
  //   "/manager/group-matching-field-requests",
  //   { params: dto }
  // );
  // return response.data;

  // Mock data with filtering
  let filtered = [...mockFieldRequests];

  if (dto.status === "pending") {
    filtered = filtered.filter((r) => !r.approvedAt && !r.rejectedAt);
  } else if (dto.status === "approved") {
    filtered = filtered.filter((r) => r.approvedAt !== null);
  } else if (dto.status === "rejected") {
    filtered = filtered.filter((r) => r.rejectedAt !== null);
  }

  const count = filtered.length;
  const paginated = filtered.slice(dto.offset, dto.offset + dto.limit);

  return {
    count,
    requests: paginated,
  };
};

const approveFieldRequest = async (
  id: string,
  dto: ApproveFieldRequestDto
): Promise<void> => {
  // await apiV2Client.post(`/manager/group-matching-field-requests/${id}/approve`, dto);

  // Mock - no-op
  console.log("Mock: Field request approved", id, dto);
};

const rejectFieldRequest = async (
  id: string,
  dto: RejectFieldRequestDto
): Promise<void> => {
  // await apiV2Client.post(`/manager/group-matching-field-requests/${id}/reject`, dto);

  // Mock - no-op
  console.log("Mock: Field request rejected", id, dto);
};

export const GroupMatchingManageApi = {
  getCurrentGroupMatching,
  createGroupMatching,
  updateGroupMatching,
  listAnswers,
  listFields,
  createField,
  obsoleteField,
  listFieldRequests,
  approveFieldRequest,
  rejectFieldRequest,
};
