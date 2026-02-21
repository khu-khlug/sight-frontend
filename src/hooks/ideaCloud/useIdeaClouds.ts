import { useQuery } from "@tanstack/react-query";
import { IdeaCloudApi } from "../../api/ideaCloud";

/**
 * 아이디어 클라우드 목록을 조회하는 hook
 */
export const useIdeaClouds = () => {
  return useQuery({
    queryKey: ["ideaClouds"],
    queryFn: () => IdeaCloudApi.listIdeaClouds(),
  });
};
