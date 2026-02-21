import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IdeaCloudApi } from "../../api/ideaCloud";

/**
 * 아이디어 클라우드 삭제를 위한 mutation hook
 */
export const useDeleteIdeaCloud = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: number) => IdeaCloudApi.deleteIdeaCloud({ ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideaClouds"] });
    },
  });
};
