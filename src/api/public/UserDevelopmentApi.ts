import apiV2Client from "../client/v2";
import { isDevelopmentToolsEnabled } from "../../util/developmentTools";

export const UserDevelopmentApi = {
  async updateScenario(input: { manager?: boolean }): Promise<void> {
    if (!isDevelopmentToolsEnabled) throw new Error("개발 환경에서만 사용할 수 있습니다.");
    await apiV2Client.patch("/users/@me/mock-scenario", input);
  },
};
