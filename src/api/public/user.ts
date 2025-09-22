import { isAxiosError } from "axios";
import apiV2Client from "../client/v2";

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
      const response = await apiV2Client.get<GetDiscordIntegrationResponseDto>(
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
  const response =
    await apiV2Client.post<IssueDiscordIntegrationUrlResponseDto>(
      "/users/@me/discord-integration/issue-url"
    );
  window.location.href = response.data.url;
};

const disconnectDiscordIntegration = async (): Promise<void> => {
  await apiV2Client.delete("/users/@me/discord-integration");
};

export type UserPublicApiDto = {
  GetDiscordIntegrationResponseDto: GetDiscordIntegrationResponseDto;
};

export const UserPublicApi = {
  getDiscordIntegration,
  issueAndRedirectToDiscordOAuth2Url,
  disconnectDiscordIntegration,
};
