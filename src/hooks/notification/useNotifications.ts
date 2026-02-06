import { useQuery } from "@tanstack/react-query";
import {
  NotificationPublicApi,
  ListNotificationsRequestDto,
} from "../../api/public/notification";

/**
 * 알림 목록을 조회하는 hook
 * @param request 페이지네이션 옵션 (offset, limit)
 */
export const useNotifications = (request: ListNotificationsRequestDto = {}) => {
  const { offset = 0, limit = 20 } = request;

  return useQuery({
    queryKey: ["notifications", { offset, limit }],
    queryFn: () => NotificationPublicApi.listNotifications({ offset, limit }),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
};
