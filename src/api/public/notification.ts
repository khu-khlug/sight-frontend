import apiV2Client from "../client/v2";

// DTOs
export type NotificationCategory = "SYSTEM" | "GROUP";

export type NotificationDto = {
  id: string;
  category: NotificationCategory;
  title: string;
  content: string;
  url: string | null;
  readAt: string | null; // ISO datetime, null이면 미읽음
  createdAt: string;
};

export type ListNotificationsRequestDto = {
  offset?: number;
  limit?: number;
};

export type ListNotificationsResponseDto = {
  count: number;
  notifications: NotificationDto[];
};

export type ReadNotificationsRequestDto = {
  notificationIds: string[];
};

export type NotificationPublicApiDto = {
  NotificationDto: NotificationDto;
  ListNotificationsRequestDto: ListNotificationsRequestDto;
  ListNotificationsResponseDto: ListNotificationsResponseDto;
  ReadNotificationsRequestDto: ReadNotificationsRequestDto;
};

// API functions
/**
 * 알림 목록 조회
 * @param request 페이지네이션 옵션 (offset, limit)
 */
const listNotifications = async (
  request: ListNotificationsRequestDto = {}
): Promise<ListNotificationsResponseDto> => {
  const { offset = 0, limit = 20 } = request;
  const response = await apiV2Client.get<ListNotificationsResponseDto>(
    "/notifications",
    {
      params: { offset, limit },
    }
  );
  return response.data;
};

/**
 * 알림 읽음 처리
 * @param notificationIds 읽음 처리할 알림 ID 목록
 */
const readNotifications = async (
  notificationIds: string[]
): Promise<void> => {
  await apiV2Client.post("/notifications/read", { notificationIds });
};

export const NotificationPublicApi = {
  listNotifications,
  readNotifications,
};
