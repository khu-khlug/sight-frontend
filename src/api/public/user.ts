import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";

type GetCurrentUserResponseDto = {
  id: number;
  name: string;
  manager: boolean;
  status: string;
  studentStatus: string;
  createdAt: string;
  updatedAt: string;
};

type GetDiscordIntegrationResponseDto = {
  id: string;
  discordUserId: string;
  createdAt: string;
};

type IssueDiscordIntegrationUrlResponseDto = {
  url: string;
};

const getCurrentUser = async (): Promise<GetCurrentUserResponseDto> => {
  const response =
    await apiV2Client.get<GetCurrentUserResponseDto>("/users/@me");
  return response.data;
};

const getDiscordIntegration =
  async (): Promise<GetDiscordIntegrationResponseDto | null> => {
    try {
      const response = await apiV2Client.get<GetDiscordIntegrationResponseDto>(
        "/users/@me/discord-integration",
      );
      return response.data;
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        return null;
      } else {
        throw e;
      }
    }
  };

const issueAndRedirectToDiscordOAuth2Url = async (): Promise<void> => {
  const response = await apiV2Client.post<IssueDiscordIntegrationUrlResponseDto>(
    "/users/@me/discord-integration/issue-url",
  );
  window.location.href = response.data.url;
};

const disconnectDiscordIntegration = async (): Promise<void> => {
  await apiV2Client.delete("/users/@me/discord-integration");
};

const checkFirstTodayLogin = async (): Promise<void> => {
  await apiV2Client.post("/users/@me/check-first-today-login");
};

// 그룹 아이디를 받지 않는 회원 전역 설정이다.
export type UpdateUserPreferenceRequestDto = {
  usePersonalGithubUsage: boolean;
};

const updatePreference = async (input: UpdateUserPreferenceRequestDto): Promise<void> => {
  await apiV2Client.patch("/groups/user-preference", input);
};

export type UserPublicApiDto = {
  GetDiscordIntegrationResponseDto: GetDiscordIntegrationResponseDto;
};

export const UserPublicApi = {
  getCurrentUser,
  getDiscordIntegration,
  issueAndRedirectToDiscordOAuth2Url,
  disconnectDiscordIntegration,
  checkFirstTodayLogin,
  updatePreference,
  getPreference: async (): Promise<UpdateUserPreferenceRequestDto> => (await apiV2Client.get<UpdateUserPreferenceRequestDto>("/groups/user-preference")).data,
};
