import type {
  ListNotificationsResponse,
  ListBookmarkedGroupsResponse,
  ListUpcomingSchedulesResponse,
  Tip,
  ListDamsoPostsResponse,
} from "./types";

export const mockNotifications: ListNotificationsResponse = {
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

export const mockBookmarkedGroups: ListBookmarkedGroupsResponse = {
  count: 3,
  groups: [
    {
      id: "group-001",
      category: "스터디",
      name: "알고리즘 스터디",
      leader: {
        id: "user-001",
        name: "홍길동",
      },
    },
    {
      id: "group-002",
      category: "프로젝트",
      name: "웹 개발 프로젝트",
      leader: {
        id: "user-002",
        name: "김철수",
      },
    },
    {
      id: "group-003",
      category: "스터디",
      name: "머신러닝 스터디",
      leader: {
        id: "user-003",
        name: "이영희",
      },
    },
  ],
};

export const mockUpcomingSchedules: ListUpcomingSchedulesResponse = {
  count: 5,
  schedules: [
    {
      id: "schedule-001",
      title: "정기 모임",
      startTime: "2026-01-22T14:00:00",
      endTime: "2026-01-22T16:00:00",
      type: "GROUP",
      relatedEntity: {
        id: "group-001",
        name: "알고리즘 스터디",
      },
    },
    {
      id: "schedule-002",
      title: "동아리 MT",
      startTime: "2026-01-25T10:00:00",
      endTime: "2026-01-26T18:00:00",
      type: "CLUB",
      relatedEntity: null,
    },
    {
      id: "schedule-003",
      title: "개인 학습",
      startTime: "2026-01-23T19:00:00",
      endTime: "2026-01-23T21:00:00",
      type: "PERSONAL",
      relatedEntity: null,
    },
    {
      id: "schedule-004",
      title: "프로젝트 회의",
      startTime: "2026-01-24T15:00:00",
      endTime: "2026-01-24T17:00:00",
      type: "GROUP",
      relatedEntity: {
        id: "group-002",
        name: "웹 개발 프로젝트",
      },
    },
    {
      id: "schedule-005",
      title: "세미나 참석",
      startTime: "2026-01-27T13:00:00",
      endTime: "2026-01-27T15:00:00",
      type: "CLUB",
      relatedEntity: null,
    },
  ],
};

export const mockCurrentTip: Tip = {
  id: "tip-001",
  content: "그룹 활동에 적극적으로 참여하면 포인트를 획득할 수 있습니다!",
  type: "INFO",
};

export const mockDamsoPosts: ListDamsoPostsResponse = {
  count: 5,
  posts: [
    {
      id: "post-001",
      title: "오늘 점심 뭐 먹을까요?",
      author: {
        id: "user-002",
        name: "김철수",
      },
      createdAt: "2026-01-21T09:15:00",
    },
    {
      id: "post-002",
      title: "이번 주말 동아리 행사 누가 참석하나요?",
      author: {
        id: "user-005",
        name: "박민수",
      },
      createdAt: "2026-01-20T18:30:00",
    },
    {
      id: "post-003",
      title: "코딩테스트 준비 어떻게 하시나요?",
      author: {
        id: "user-003",
        name: "이영희",
      },
      createdAt: "2026-01-20T14:20:00",
    },
    {
      id: "post-004",
      title: "동아리방 청소 날짜 정해야 할 것 같아요",
      author: {
        id: "user-007",
        name: "정수진",
      },
      createdAt: "2026-01-19T16:45:00",
    },
    {
      id: "post-005",
      title: "새로운 프로젝트 아이디어 있으신 분?",
      author: {
        id: "user-001",
        name: "홍길동",
      },
      createdAt: "2026-01-19T11:00:00",
    },
  ],
};
