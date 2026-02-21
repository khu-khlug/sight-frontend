import apiV2Client from "../client/v2";
import type {
  ListIdeaCloudsResponse,
  CreateIdeaCloudRequest,
  CreateIdeaCloudResponse,
  DeleteIdeaCloudRequest,
} from "./types";

/**
 * 아이디어 클라우드 목록 조회
 */
const listIdeaClouds = async (): Promise<ListIdeaCloudsResponse> => {
  const response = await apiV2Client.get<ListIdeaCloudsResponse>("/idea-clouds");
  return response.data;
};

/**
 * 아이디어 클라우드 생성
 * @param request 아이디어 내용
 */
const createIdeaCloud = async (
  request: CreateIdeaCloudRequest
): Promise<CreateIdeaCloudResponse> => {
  const response = await apiV2Client.post<CreateIdeaCloudResponse>(
    "/idea-clouds",
    request
  );
  return response.data;
};

/**
 * 아이디어 클라우드 삭제
 * @param request 삭제할 아이디어 ID
 */
const deleteIdeaCloud = async (
  request: DeleteIdeaCloudRequest
): Promise<void> => {
  await apiV2Client.delete(`/idea-clouds/${request.ideaId}`);
};

export const IdeaCloudApi = {
  listIdeaClouds,
  createIdeaCloud,
  deleteIdeaCloud,
};
