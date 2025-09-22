import { isAxiosError } from "axios";
import apiClient from "../client";

type GetDiscordIntegrationResponseDto = {
  id: string;
  discordUserId: string;
  createdAt: string;
};

type IssueDiscordIntegrationUrlResponseDto = {
  url: string;
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
  getDiscordIntegration,
  issueAndRedirectToDiscordOAuth2Url,
  disconnectDiscordIntegration,
};
