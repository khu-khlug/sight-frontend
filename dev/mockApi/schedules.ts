const pad = (value: number) => String(value).padStart(2, "0");
const formatLocal = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

// 언제 띄워도 달력과 주간 일정을 확인할 수 있게, 이번 주 일요일을 기준으로 날짜를 만든다.
// dayOffset 0은 이번 주 일요일이며, 이번 주 일·화·금은 일정이 없는 날로 둔다.
// 그룹활동의 기본 그룹은 목업 그룹(1)이고, groupId를 지정한 일정은 다른 그룹 일정이다.
const SCHEDULE_TEMPLATES: { dayOffset: number; hour: number; minute: number; hours: number; title: string; category: string; location: string | null; groupId?: string }[] = [
  { dayOffset: -6, hour: 19, minute: 0, hours: 2, title: "동아리 정기 모임", category: "CLUB", location: "405" },
  { dayOffset: -3, hour: 14, minute: 0, hours: 1, title: "운영진 회의", category: "MANAGEMENT", location: "410" },
  { dayOffset: 1, hour: 10, minute: 0, hours: 1, title: "그룹 스터디", category: "GROUP_ACTIVITY", location: "405" },
  { dayOffset: 1, hour: 18, minute: 30, hours: 2, title: "신입 회원 세션", category: "CLUB", location: "406" },
  { dayOffset: 3, hour: 9, minute: 0, hours: 3, title: "중간고사 기간 안내", category: "ACADEMIC", location: null },
  { dayOffset: 4, hour: 13, minute: 0, hours: 2, title: "외부 연사 특강", category: "EXTERNAL", location: "410" },
  { dayOffset: 6, hour: 11, minute: 0, hours: 4, title: "빅세미나", category: "BIG_SEMINAR", location: "405" },
  { dayOffset: 6, hour: 15, minute: 30, hours: 1, title: "다른 그룹 프로젝트 회고", category: "GROUP_ACTIVITY", location: "406", groupId: "2" },
  { dayOffset: 6, hour: 18, minute: 0, hours: 2, title: "세미나 뒤풀이", category: "AFTERPARTY", location: null },
  { dayOffset: 9, hour: 16, minute: 0, hours: 1, title: "동아리 물품 정리", category: "OTHER", location: "405" },
  { dayOffset: 12, hour: 19, minute: 0, hours: 2, title: "그룹 발표 연습", category: "GROUP_ACTIVITY", location: "410" },
];

function createSchedules() {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return SCHEDULE_TEMPLATES.map((template, index) => {
    const start = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + template.dayOffset, template.hour, template.minute);
    const end = new Date(start.getTime() + template.hours * 60 * 60 * 1000);
    return {
      id: String(index + 1),
      title: template.title,
      category: template.category,
      location: template.location,
      state: "PROGRESS",
      scheduledAt: formatLocal(start),
      endAt: formatLocal(end),
      expoint: 0,
      author: 1,
      groupId: template.groupId ?? (template.category === "GROUP_ACTIVITY" ? "1" : null),
    };
  });
}

const schedules = createSchedules();

// 일정 페이지의 등록 폼이 부르는 경로와, 경로에 따라 정해지는 카테고리.
const CREATE_ROUTES: Record<string, string | null> = {
  "/schedules": null,
  "/schedules/group-activity": "GROUP_ACTIVITY",
  "/schedules/big-seminar": "BIG_SEMINAR",
};

export function handleScheduleRequest(method: string | undefined, url: URL, body: unknown) {
  if (method === "GET" && url.pathname === "/schedules") {
    const from = url.searchParams.get("from") ?? formatLocal(new Date());
    const limit = Number(url.searchParams.get("limit") ?? 5);
    const matched = schedules
      .filter((schedule) => schedule.scheduledAt >= from)
      .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))
      .slice(0, limit);
    return { status: 200, body: { count: matched.length, schedules: matched } };
  }
  // 일정 수정 폼이 부르는 상세 조회와 수정. 그룹활동·총회 수정 경로도 같은 방식으로 처리한다.
  const detailMatch = url.pathname.match(/^\/schedules\/(?:(?:group-activity|big-seminar)\/)?(\d+)$/);
  if (detailMatch) {
    const schedule = schedules.find((item) => item.id === detailMatch[1]);
    if (!schedule) return { status: 404, body: { message: "일정을 찾을 수 없습니다." } };
    if (method === "GET") {
      const now = formatLocal(new Date());
      return { status: 200, body: { ...schedule, checkCode: null, authorName: "테스트 회원", groupTitle: null, createdAt: now, updatedAt: now } };
    }
    if (method === "PATCH") {
      const input = (body && typeof body === "object" ? body : {}) as { title?: unknown; location?: unknown; scheduledAt?: unknown; endAt?: unknown };
      if (typeof input.title !== "string" || !input.title.trim() || typeof input.scheduledAt !== "string" || typeof input.endAt !== "string") {
        return { status: 400, body: { message: "일정 입력값을 확인해주세요." } };
      }
      schedule.title = input.title;
      schedule.location = typeof input.location === "string" ? input.location : null;
      schedule.scheduledAt = input.scheduledAt;
      schedule.endAt = input.endAt;
      return { status: 204, body: undefined };
    }
  }
  if (method === "POST" && url.pathname in CREATE_ROUTES) {
    const input = (body && typeof body === "object" ? body : {}) as {
      title?: unknown; category?: unknown; location?: unknown; scheduledAt?: unknown; endAt?: unknown; expoint?: unknown; groupId?: unknown;
    };
    const category = CREATE_ROUTES[url.pathname] ?? input.category;
    if (typeof input.title !== "string" || !input.title.trim() || typeof category !== "string" || typeof input.scheduledAt !== "string" || typeof input.endAt !== "string") {
      return { status: 400, body: { message: "일정 입력값을 확인해주세요." } };
    }
    schedules.push({
      id: String(schedules.length + 1),
      title: input.title,
      category,
      location: typeof input.location === "string" ? input.location : null,
      state: "PROGRESS",
      scheduledAt: input.scheduledAt,
      endAt: input.endAt,
      expoint: typeof input.expoint === "number" ? input.expoint : 0,
      author: 1,
      groupId: typeof input.groupId === "string" ? input.groupId : null,
    });
    return { status: 204, body: undefined };
  }
  return null;
}
