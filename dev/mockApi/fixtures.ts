// 실제 백엔드가 준비되기 전까지 필요한 API 응답 데이터.
// 개발 서버 안에서 제공하여 yarn dev만으로 실행할 수 있게 한다.
export function currentUser(manager: boolean) {
  const now = new Date().toISOString();
  return {
    id: 1,
    name: "테스트 회원",
    manager,
    status: "ACTIVE",
    studentStatus: "UNDERGRADUATE",
    createdAt: now,
    updatedAt: now,
  };
}

export const emptyNotifications = { count: 0, notifications: [] };
export const emptyGuildEmojis = { emojis: [] };
