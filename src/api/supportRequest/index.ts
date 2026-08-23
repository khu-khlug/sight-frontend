import apiV2Client from "../client/v2";

export const supportRequestCategories = [
  "SERVER_SPACE",
  "SUBDOMAIN",
  "HARDWARE",
  "BOOK",
  "OTHER",
] as const;

export type SupportRequestCategory = (typeof supportRequestCategories)[number];

export type SupportRequestUser = {
  userId: number;
  name: string;
};

export type SupportRequest = {
  id: string;
  category: SupportRequestCategory;
  title: string;
  content: string;
  requester: SupportRequestUser;
  hasComments: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupportRequestComment = {
  id: string;
  content: string;
  author: SupportRequestUser;
  createdAt: string;
};

export type SupportRequestDetail = SupportRequest & {
  comments: SupportRequestComment[];
};

export type ListSupportRequestsRequest = {
  offset?: number;
  limit?: number;
  category?: SupportRequestCategory;
};

export type ListSupportRequestsResponse = {
  count: number;
  supportRequests: SupportRequest[];
};

export type SupportRequestInput = {
  category: SupportRequestCategory;
  title: string;
  content: string;
};

const listSupportRequests = async (
  request: ListSupportRequestsRequest = {},
): Promise<ListSupportRequestsResponse> => {
  const response = await apiV2Client.get<ListSupportRequestsResponse>("/support-requests", {
    params: request,
  });
  return response.data;
};

const getSupportRequest = async (supportRequestId: string): Promise<SupportRequestDetail> => {
  const response = await apiV2Client.get<SupportRequestDetail>(`/support-requests/${supportRequestId}`);
  return response.data;
};

const createSupportRequest = async (input: SupportRequestInput): Promise<SupportRequest> => {
  const response = await apiV2Client.post<SupportRequest>("/support-requests", input);
  return response.data;
};

const updateSupportRequest = async (
  supportRequestId: string,
  input: SupportRequestInput,
): Promise<SupportRequest> => {
  const response = await apiV2Client.put<SupportRequest>(`/support-requests/${supportRequestId}`, input);
  return response.data;
};

const deleteSupportRequest = async (supportRequestId: string): Promise<void> => {
  await apiV2Client.delete(`/support-requests/${supportRequestId}`);
};

const createSupportRequestComment = async (
  supportRequestId: string,
  content: string,
): Promise<SupportRequestComment> => {
  const response = await apiV2Client.post<SupportRequestComment>(
    `/support-requests/${supportRequestId}/comments`,
    { content },
  );
  return response.data;
};

export const SupportRequestApi = {
  listSupportRequests,
  getSupportRequest,
  createSupportRequest,
  updateSupportRequest,
  deleteSupportRequest,
  createSupportRequestComment,
};
