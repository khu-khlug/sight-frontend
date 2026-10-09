import apiV2Client from "../../client/v2";
import type { GroupInfoDto } from "./types";
import type { OpenSeminarCohortDto } from "./GroupExposureApi";

export const GroupDevelopmentApi = {
  async updateScenario(groupId: number, input: { info?: Partial<GroupInfoDto>; openCohort?: OpenSeminarCohortDto | null }): Promise<void> {
    if (!import.meta.env.DEV) throw new Error("개발 환경에서만 사용할 수 있습니다.");
    await apiV2Client.patch(`/groups/${groupId}/mock-scenario`, input);
  },
};
