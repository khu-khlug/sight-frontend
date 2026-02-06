import { useNotifications } from "./useNotifications";

/**
 * 읽지 않은 알림 개수를 반환하는 hook
 */
export const useUnreadNotificationCount = () => {
  const { data, isLoading } = useNotifications();

  const unreadCount = data?.notifications.filter((n) => n.readAt === null).length ?? 0;

  return {
    count: unreadCount,
    isLoading,
  };
};
