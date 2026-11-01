import apiV2Client from "../../client/v2";
import type { GroupInfoDto } from "./types";
import { GroupStatus } from "../../../constant";
import { getGroupRepositoryUrlError, GROUP_REPOSITORY_SEPARATOR, MAX_GROUP_REPOSITORIES } from "../../../util/groupRepositoryUrls";
import { getGroupDelimitedValuesError } from "../../../util/groupDelimitedValues";

type UpdateGroupInput = Pick<GroupInfoDto, "title" | "category" | "description" | "interests" | "techStack" | "repositoryUrls" | "allowJoin" | "visibility">;
export type UpdateGroupRequestDto = Omit<UpdateGroupInput, "techStack" | "repositoryUrls"> & { techStack: string; repositoryUrls: string };
export const GroupSettingsApi = {
  async updateGroup(groupId: number, input: UpdateGroupInput): Promise<void> {
    if (input.techStack.some((technology) => technology.includes(","))) {
      throw new Error("사용 기술 이름에는 쉼표(,)를 사용할 수 없습니다.");
    }
    const technologyLengthError = getGroupDelimitedValuesError(input.techStack, "사용 기술");
    if (technologyLengthError) throw new Error(technologyLengthError);
    const repositoryLengthError = getGroupDelimitedValuesError(input.repositoryUrls, "저장소 URL", GROUP_REPOSITORY_SEPARATOR);
    if (repositoryLengthError) throw new Error(repositoryLengthError);
    if (input.repositoryUrls.length > MAX_GROUP_REPOSITORIES) throw new Error("저장소는 최대 5개까지 추가할 수 있습니다.");
    for (const url of input.repositoryUrls) {
      const error = getGroupRepositoryUrlError(url);
      if (error) throw new Error(error);
      if (!url.trim()) throw new Error("저장소 URL을 입력해주세요.");
    }
    if (new Set(input.repositoryUrls).size !== input.repositoryUrls.length) throw new Error("중복된 저장소 URL은 사용할 수 없습니다.");
    const request: UpdateGroupRequestDto = {
      ...input,
      techStack: input.techStack.join(","),
      repositoryUrls: input.repositoryUrls.join(GROUP_REPOSITORY_SEPARATOR),
    };
    await apiV2Client.put(`/groups/${groupId}`, request);
  },
  async endGroup(groupId: number, input: { status: typeof GroupStatus.SUCCESS | typeof GroupStatus.FAIL }): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/status/end`, input);
  },
  async stopGroup(groupId: number): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/status/stop`);
  },
  async progressGroup(groupId: number): Promise<void> {
    await apiV2Client.put(`/groups/${groupId}/status/progress`);
  },
  async leaveGroup(groupId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/members/@me`);
  },
};
