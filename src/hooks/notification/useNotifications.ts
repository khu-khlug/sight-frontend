import { useQuery } from "@tanstack/react-query";
import { MainApi } from "../../api/main";

/**
 * 알림 목록을 조회하는 hook
 * @param unreadOnly 읽지 않은 알림만 조회할지 여부
 */
export const useNotifications = (unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () => MainApi.getNotifications(unreadOnly),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
};
