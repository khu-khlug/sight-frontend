import apiV2Client from "../client/v2";

export const UserDevelopmentApi = {
  async updateScenario(input: { manager?: boolean }): Promise<void> {
    if (!import.meta.env.DEV) throw new Error("개발 환경에서만 사용할 수 있습니다.");
    await apiV2Client.patch("/users/@me/mock-scenario", input);
  },
};
