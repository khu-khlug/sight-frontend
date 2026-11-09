export const MAX_GROUP_REPOSITORIES = 5;
export const GROUP_REPOSITORY_SEPARATOR = "\n";

export function getGroupRepositoryUrlError(url: string): string | null {
  if (/[\r\n]/.test(url)) return "저장소 URL 하나에는 줄바꿈을 포함할 수 없습니다.";
  return null;
}
