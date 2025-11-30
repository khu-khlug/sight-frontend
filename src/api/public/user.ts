import { isAxiosError } from "axios";
import apiClient from "../client";
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
  const response = await apiV2Client.get<GetCurrentUserResponseDto>(
    "/users/@me"
  );
  return response.data;
};

const getDiscordIntegration =
  async (): Promise<GetDiscordIntegrationResponseDto | null> => {
    try {
      const response = await apiClient.get<GetDiscordIntegrationResponseDto>(
        "/users/@me/discord-integration"
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
  const response = await apiClient.post<IssueDiscordIntegrationUrlResponseDto>(
    "/users/@me/discord-integration/issue-url"
  );
  window.location.href = response.data.url;
};

const disconnectDiscordIntegration = async (): Promise<void> => {
  await apiClient.delete("/users/@me/discord-integration");
};

export type UserPublicApiDto = {
  GetDiscordIntegrationResponseDto: GetDiscordIntegrationResponseDto;
};

export const UserPublicApi = {
  getCurrentUser,
  getDiscordIntegration,
  issueAndRedirectToDiscordOAuth2Url,
  disconnectDiscordIntegration,
};
