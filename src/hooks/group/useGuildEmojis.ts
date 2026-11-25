import { useQuery } from "@tanstack/react-query";
import { GroupPublicApi } from "../../api/public/group";

export const useGuildEmojis = (enabled = true) => {
  return useQuery({
    queryKey: ["guild-emojis"],
    queryFn: GroupPublicApi.getGuildEmojis,
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
    retry: 0,
  });
};
