import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationPublicApi } from "../../api/public/notification";

/**
 * 알림 읽음 처리를 위한 mutation hook
 */
export const useReadNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      NotificationPublicApi.readNotifications(notificationIds),
    onSuccess: () => {
      // 모든 notifications 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
