// Notification
export type NotificationType = "COMMENT" | "LIKE" | "SCHEDULE" | "GROUP";

export type Notification = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: NotificationType;
};

export type ListNotificationsResponse = {
  count: number;
  notifications: Notification[];
};

// Bookmarked Groups
export type GroupLeader = {
  id: string;
  name: string;
};

export type BookmarkedGroup = {
  id: string;
  category: string;
  name: string;
  leader: GroupLeader;
};

export type ListBookmarkedGroupsResponse = {
  count: number;
  groups: BookmarkedGroup[];
};

// Schedules
export type ScheduleType = "PERSONAL" | "CLUB" | "GROUP";

export type ScheduleRelatedEntity = {
  id: string;
  name: string;
};

export type Schedule = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  relatedEntity?: ScheduleRelatedEntity | null;
};

export type ListUpcomingSchedulesResponse = {
  count: number;
  schedules: Schedule[];
};

// Tips
export type TipType = "INFO" | "WARNING";

export type Tip = {
  id: string | null;
  content: string | null;
  type: TipType | null;
};

// Damso Posts
export type PostAuthor = {
  id: string;
  name: string;
};

export type DamsoPost = {
  id: string;
  title: string;
  author: PostAuthor;
  createdAt: string;
};

export type ListDamsoPostsResponse = {
  count: number;
  posts: DamsoPost[];
};

// Combined API DTO type
export type MainApiDto = {
  Notification: Notification;
  ListNotificationsResponse: ListNotificationsResponse;
  BookmarkedGroup: BookmarkedGroup;
  ListBookmarkedGroupsResponse: ListBookmarkedGroupsResponse;
  Schedule: Schedule;
  ListUpcomingSchedulesResponse: ListUpcomingSchedulesResponse;
  Tip: Tip;
  DamsoPost: DamsoPost;
  ListDamsoPostsResponse: ListDamsoPostsResponse;
};
