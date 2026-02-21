import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IdeaCloudApi } from "../../api/ideaCloud";
import type { CreateIdeaCloudRequest } from "../../api/ideaCloud/types";

/**
 * 아이디어 클라우드 생성을 위한 mutation hook
 */
export const useCreateIdeaCloud = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateIdeaCloudRequest) =>
      IdeaCloudApi.createIdeaCloud(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideaClouds"] });
    },
  });
};
