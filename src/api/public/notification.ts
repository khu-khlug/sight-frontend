// DTOs
export type NotificationType = "COMMENT" | "LIKE" | "SCHEDULE" | "GROUP";

export type NotificationDto = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: NotificationType;
};

export type ListNotificationsResponseDto = {
  count: number;
  notifications: NotificationDto[];
};

export type NotificationPublicApiDto = {
  NotificationDto: NotificationDto;
  ListNotificationsResponseDto: ListNotificationsResponseDto;
};

// Mock 데이터 (실제 API 연동 전까지 사용)
const mockNotifications: ListNotificationsResponseDto = {
  count: 3,
  notifications: [
    {
      id: "notif-001",
      title: "새 댓글이 달렸습니다",
      content: "홍길동님이 회원님의 게시글에 댓글을 남겼습니다.",
      isRead: false,
      createdAt: "2026-01-21T10:30:00",
      type: "COMMENT",
    },
    {
      id: "notif-002",
      title: "일정 알림",
      content: "내일 오후 2시에 알고리즘 스터디 모임이 있습니다.",
      isRead: false,
      createdAt: "2026-01-20T15:00:00",
      type: "SCHEDULE",
    },
    {
      id: "notif-003",
      title: "그룹 초대",
      content: "김철수님이 회원님을 웹 개발 스터디에 초대했습니다.",
      isRead: true,
      createdAt: "2026-01-19T09:20:00",
      type: "GROUP",
    },
  ],
};

// Mock 딜레이
const MOCK_DELAY_MS = import.meta.env.VITE_MOCK_DELAY_MS
  ? Number(import.meta.env.VITE_MOCK_DELAY_MS)
  : 300;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

// API functions
/**
 * 알림 목록 조회
 * @param unreadOnly 읽지 않은 알림만 조회할지 여부
 */
const listNotifications = async (
  unreadOnly = false
): Promise<ListNotificationsResponseDto> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiV2Client.get<ListNotificationsResponseDto>('/notifications', {
  //   params: { unreadOnly },
  // });
  // return response.data;

  await mockDelay();

  if (unreadOnly) {
    return {
      ...mockNotifications,
      notifications: mockNotifications.notifications.filter((n) => !n.isRead),
      count: mockNotifications.notifications.filter((n) => !n.isRead).length,
    };
  }

  return mockNotifications;
};

export const NotificationPublicApi = {
  listNotifications,
};
