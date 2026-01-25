import type {
  ListNotificationsResponse,
  ListBookmarkedGroupsResponse,
  ListUpcomingSchedulesResponse,
  Tip,
  ListDamsoPostsResponse,
} from "./types";
import {
  mockNotifications,
  mockBookmarkedGroups,
  mockUpcomingSchedules,
  mockCurrentTip,
  mockDamsoPosts,
} from "./mock";

// Mock 딜레이 (개발 환경에서만 사용)
const MOCK_DELAY_MS = import.meta.env.VITE_MOCK_DELAY_MS
  ? Number(import.meta.env.VITE_MOCK_DELAY_MS)
  : 300;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

// API 함수들은 현재 mock 데이터를 반환하도록 구현
// 실제 API 연동 시 apiClient를 사용하여 실제 호출로 전환

/**
 * 알림 목록 조회
 * @param unreadOnly 읽지 않은 알림만 조회할지 여부
 */
const getNotifications = async (
  unreadOnly = false
): Promise<ListNotificationsResponse> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiClient.get<ListNotificationsResponse>('/notifications', {
  //   params: { unreadOnly },
  // });
  // return response.data;

  // Mock 데이터 반환
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

/**
 * 즐겨찾기한 그룹 목록 조회
 */
const getBookmarkedGroups = async (): Promise<ListBookmarkedGroupsResponse> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiClient.get<ListBookmarkedGroupsResponse>('/groups', {
  //   params: { bookmarked: true },
  // });
  // return response.data;

  // Mock 데이터 반환
  await mockDelay();
  return mockBookmarkedGroups;
};

/**
 * 예정된 일정 조회
 * @param limit 조회할 일정 개수 (기본값: 5)
 */
const getUpcomingSchedules = async (
  limit = 5
): Promise<ListUpcomingSchedulesResponse> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiClient.get<ListUpcomingSchedulesResponse>('/schedules/upcoming', {
  //   params: { limit },
  // });
  // return response.data;

  // Mock 데이터 반환
  await mockDelay();
  return {
    ...mockUpcomingSchedules,
    schedules: mockUpcomingSchedules.schedules.slice(0, limit),
    count: Math.min(mockUpcomingSchedules.count, limit),
  };
};

/**
 * 현재 표시할 팁 조회
 */
const getCurrentTip = async (): Promise<Tip> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiClient.get<Tip>('/tips/current');
  // return response.data;

  // Mock 데이터 반환
  await mockDelay();
  return mockCurrentTip;
};

/**
 * 담소 게시판 최근 게시글 조회
 * @param limit 조회할 게시글 개수 (기본값: 5)
 */
const getDamsoPosts = async (limit = 5): Promise<ListDamsoPostsResponse> => {
  // 추후 실제 API 호출로 전환
  // const response = await apiClient.get<ListDamsoPostsResponse>('/boards/damso/posts', {
  //   params: { limit },
  // });
  // return response.data;

  // Mock 데이터 반환
  await mockDelay();
  return {
    ...mockDamsoPosts,
    posts: mockDamsoPosts.posts.slice(0, limit),
    count: Math.min(mockDamsoPosts.count, limit),
  };
};

export const MainApi = {
  getNotifications,
  getBookmarkedGroups,
  getUpcomingSchedules,
  getCurrentTip,
  getDamsoPosts,
};
