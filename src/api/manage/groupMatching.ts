import apiV2Client from "../client/v2";
import { GroupType } from "../../constant";

// ============================================================================
// API Request DTOs (요청 타입 - API 명세 그대로)
// ============================================================================

// POST /group-matchings
export type CreateGroupMatchingRequest = {
  year: number;
  semester: number;
  closedAt: string; // ISO 8601 datetime
};

// PATCH /group-matchings/{groupMatchingId}/closed-at
export type UpdateClosedAtRequest = {
  closedAt: string; // ISO 8601 datetime
};

// POST /fields
export type CreateFieldRequest = {
  fieldName: string;
};

// POST /field-requests/{fieldRequestId}/reject
export type RejectFieldRequestRequest = {
  rejectReason: string;
};

// ============================================================================
// API Response DTOs (응답 타입 - API 명세 그대로)
// ============================================================================

// POST /group-matchings 응답
// GET /group-matchings 응답의 각 항목
export type GroupMatchingResponse = {
  id: string;
  year: number;
  semester: number;
  createdAt: string; // ISO 8601 datetime
  closedAt: string; // ISO 8601 datetime
};

// GET /group-matchings 응답
export type ListGroupMatchingsResponse = {
  count: number;
  groupMatchings: GroupMatchingResponse[];
};

// PATCH /group-matchings/{groupMatchingId}/closed-at 응답
export type UpdateClosedAtResponse = {
  groupMatchingId: string;
  year: number;
  semester: number;
  closedAt: string; // ISO 8601 datetime
  createdAt: string; // ISO 8601 datetime
};

// GET /group-matchings/{groupMatchingId}/groups 응답의 각 항목
export type GroupResponse = {
  id: number;
  title: string;
  members: Array<{
    id: number;
    userId: number;
    name: string;
    number: number;
  }>;
  createdAt: string; // ISO 8601 datetime
};

// GET /group-matchings/{groupMatchingId}/answers 응답의 각 답변 항목
export type AnswerResponse = {
  answerId: string;
  answerUserId: number;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  groupType: "STUDY" | "PROJECT";
  isPreferOnline: boolean;
  selectedFields: string[];
  subjectIdeas: string[];
  matchedGroupIds: number[];
};

// GET /group-matchings/{groupMatchingId}/answers 응답
export type ListAnswersResponse = {
  answers: AnswerResponse[];
  total: number;
};

// POST /fields 응답
export type CreateFieldResponse = {
  fieldId: string;
  fieldName: string;
  createdAt: string; // ISO 8601 datetime
};

// GET /field-requests 응답의 각 항목
export type FieldRequestResponse = {
  id: string;
  fieldName: string;
  requestedBy: number;
  requestedAt: string; // ISO 8601 datetime
  requestReason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  processDetails: {
    processedAt: string; // ISO 8601 datetime
    rejectReason: string | null;
  } | null;
};

// POST /field-requests/{fieldRequestId}/approve 응답
export type ApproveFieldRequestResponse = {
  field: {
    id: string;
    name: string;
    createdAt: string; // ISO 8601 datetime
  };
  approvedAt: string; // ISO 8601 datetime
};

// POST /field-requests/{fieldRequestId}/reject 응답
export type RejectFieldRequestResponse = {
  id: string;
  requesterUserId: number;
  fieldName: string;
  requestReason: string;
  approvedAt: string | null; // ISO 8601 datetime
  rejectedAt: string | null; // ISO 8601 datetime
  rejectReason: string | null;
  createdAt: string; // ISO 8601 datetime
};

// ============================================================================
// 프론트엔드 전용 타입 (UI에서 사용)
// ============================================================================

export type GroupMatchingFieldDto = {
  id: string;
  name: string;
  createdAt?: string;
  obsoletedAt?: string | null;
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
  GroupMatchingResponse: GroupMatchingResponse;
  GroupMatchingFieldDto: GroupMatchingFieldDto;
  GroupMatchingFieldRequestDto: GroupMatchingFieldRequestDto;
  GroupMatchingAnswerWithUserDto: GroupMatchingAnswerWithUserDto;
  CreateGroupMatchingRequest: CreateGroupMatchingRequest;
  UpdateClosedAtRequest: UpdateClosedAtRequest;
  CreateFieldRequest: CreateFieldRequest;
  RejectFieldRequestRequest: RejectFieldRequestRequest;
  ListAnswersRequestDto: ListAnswersRequestDto;
  ListAnswersResponseDto: ListAnswersResponseDto;
  ListFieldRequestsRequestDto: ListFieldRequestsRequestDto;
  ListFieldRequestsResponseDto: ListFieldRequestsResponseDto;
  GroupResponse: GroupResponse;
};

// ============================================================================
// API 함수들
// ============================================================================

// POST /group-matchings
const createGroupMatching = async (
  request: CreateGroupMatchingRequest
): Promise<GroupMatchingResponse> => {
  const response = await apiV2Client.post<GroupMatchingResponse>(
    "/group-matchings",
    request
  );
  return response.data;
};

// GET /group-matchings
const listGroupMatchings = async (): Promise<ListGroupMatchingsResponse> => {
  const response = await apiV2Client.get<ListGroupMatchingsResponse>(
    "/group-matchings"
  );
  return response.data;
};

// GET /group-matchings/{groupMatchingId}/groups
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

// PATCH /group-matchings/{groupMatchingId}/closed-at
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

// GET /group-matchings/{groupMatchingId}/answers
const listAnswers = async (
  dto: ListAnswersRequestDto
): Promise<ListAnswersResponseDto> => {
  const response = await apiV2Client.get<ListAnswersResponse>(
    `/group-matchings/${dto.groupMatchingId}/answers`,
    {
      params: {
        groupType: dto.groupType,
        fieldId: dto.fieldId,
        offset: dto.offset,
        limit: dto.limit,
      },
    }
  );

  // 백엔드 응답을 프론트엔드 타입으로 변환
  const answers: GroupMatchingAnswerWithUserDto[] = response.data.answers.map(
    (apiAnswer) => ({
      id: apiAnswer.answerId,
      userId: apiAnswer.answerUserId,
      userName: `사용자 ${apiAnswer.answerUserId}`,
      userNumber: 0,
      groupType: apiAnswer.groupType as GroupType,
      isPreferOnline: apiAnswer.isPreferOnline,
      fields: apiAnswer.selectedFields.map((fieldId) => ({
        id: fieldId,
        name: fieldId,
        createdAt: "",
        obsoletedAt: null,
      })),
      subjects: apiAnswer.subjectIdeas.map((subject, idx) => ({
        id: `${apiAnswer.answerId}-subject-${idx}`,
        subject,
      })),
      createdAt: apiAnswer.createdAt,
      updatedAt: apiAnswer.updatedAt,
    })
  );

  return {
    count: response.data.total,
    answers,
  };
};

// POST /fields
const createField = async (
  request: CreateFieldRequest
): Promise<CreateFieldResponse> => {
  const response = await apiV2Client.post<CreateFieldResponse>(
    "/fields",
    request
  );
  return response.data;
};

// DELETE /fields/{fieldId}
const obsoleteField = async (fieldId: string): Promise<void> => {
  await apiV2Client.delete(`/fields/${fieldId}`);
};

// GET /fields (Public API이지만 manage에서도 사용)
const listFields = async (): Promise<GroupMatchingFieldDto[]> => {
  const response = await apiV2Client.get<GroupMatchingFieldDto[]>("/fields");
  return response.data;
};

// GET /field-requests
const listFieldRequests = async (
  dto: ListFieldRequestsRequestDto
): Promise<ListFieldRequestsResponseDto> => {
  const response = await apiV2Client.get<FieldRequestResponse[]>(
    "/field-requests"
  );

  // API 응답을 프론트엔드 타입으로 변환
  let requests: GroupMatchingFieldRequestDto[] = response.data.map((item) => ({
    id: item.id,
    requesterUserId: item.requestedBy,
    requesterName: `사용자 ${item.requestedBy}`,
    fieldName: item.fieldName,
    requestReason: item.requestReason,
    approvedAt:
      item.status === "APPROVED" && item.processDetails
        ? item.processDetails.processedAt
        : null,
    rejectedAt:
      item.status === "REJECTED" && item.processDetails
        ? item.processDetails.processedAt
        : null,
    rejectReason: item.processDetails?.rejectReason || null,
    createdAt: item.requestedAt,
  }));

  // 클라이언트 측 필터링
  if (dto.status === "pending") {
    requests = requests.filter((r) => !r.approvedAt && !r.rejectedAt);
  } else if (dto.status === "approved") {
    requests = requests.filter((r) => r.approvedAt !== null);
  } else if (dto.status === "rejected") {
    requests = requests.filter((r) => r.rejectedAt !== null);
  }

  // 페이지네이션
  const paginated = requests.slice(dto.offset, dto.offset + dto.limit);

  return {
    count: requests.length,
    requests: paginated,
  };
};

// POST /field-requests/{fieldRequestId}/approve
const approveFieldRequest = async (
  fieldRequestId: string
): Promise<ApproveFieldRequestResponse> => {
  const response = await apiV2Client.post<ApproveFieldRequestResponse>(
    `/field-requests/${fieldRequestId}/approve`,
    {}
  );
  return response.data;
};

// POST /field-requests/{fieldRequestId}/reject
const rejectFieldRequest = async (
  fieldRequestId: string,
  request: RejectFieldRequestRequest
): Promise<RejectFieldRequestResponse> => {
  const response = await apiV2Client.post<RejectFieldRequestResponse>(
    `/field-requests/${fieldRequestId}/reject`,
    request
  );
  return response.data;
};

export const GroupMatchingManageApi = {
  createGroupMatching,
  listGroupMatchings,
  listGroupsByGroupMatching,
  updateGroupMatchingClosedAt,
  listAnswers,
  createField,
  obsoleteField,
  listFields,
  listFieldRequests,
  approveFieldRequest,
  rejectFieldRequest,
};
