import { useNotifications } from "./useNotifications";

/**
 * 읽지 않은 알림 개수를 반환하는 hook
 */
export const useUnreadNotificationCount = () => {
  const { data, isLoading } = useNotifications(true);

  return {
    count: data?.count ?? 0,
    isLoading,
  };
};
