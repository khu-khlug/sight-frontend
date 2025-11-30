import { useQuery } from "@tanstack/react-query";
import { UserPublicApi } from "../../api/public/user";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: UserPublicApi.getCurrentUser,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    retry: 0,
  });
};
