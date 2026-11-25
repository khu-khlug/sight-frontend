// 파일 창이 다루는 콘텐츠. 소스별로 창 헤더 왼쪽 표시가 다르다(index.tsx).
export type FileWindowContent =
  | { source: "repository"; fileName: string; fileUrl: string; path: string; repositoryUrl: string }
  | { source: "activityReport"; fileName: string; fileUrl: string };

// 텍스트 파일 뷰어의 글자 크기 — 정확한 pt/px 대신 sm/md/lg 단계로만 고른다. 페이지
// (GroupDetailContainer)가 상태를 들고 있어서 다른 파일을 열어도 유지된다.
export const TEXT_FONT_SIZES = ["sm", "md", "lg"] as const;
export type TextFontSize = typeof TEXT_FONT_SIZES[number];

// roleData(WindowLayer가 들고 있는 "역할 → 콘텐츠 식별자" 문자열 맵)에 저장하는 값의 모양은
// 카드면 카드 id 그대로, 파일이면 "file:" 접두사 + base64(JSON) 문자열이다 — windowHash.ts가
// "_"/"&"/"$" 같은 구분자와 안 겹치는 base64만 보고도 안전하게 묶을 수 있고, 새로고침·직접
// 진입 때도 이 식별자 하나만으로 창 내용을 다시 만들 수 있다(별도 보관 상태 없음).
const FILE_KEY_PREFIX = "file:";

// base64는 Latin1 바이트만 다루므로, 한글 파일명 등을 안전하게 싣기 위한 UTF-8 변환이다.
function toBase64(text: string): string {
  const percentEncoded = encodeURIComponent(text);
  const latin1 = percentEncoded.replace(/%([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return btoa(latin1);
}

function fromBase64(base64: string): string {
  const latin1 = atob(base64);
  const percentEncoded = latin1.split("").map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("");
  return decodeURIComponent(percentEncoded);
}

export function encodeFileContentKey(content: FileWindowContent): string {
  return `${FILE_KEY_PREFIX}${toBase64(JSON.stringify(content))}`;
}

export function decodeFileContentKey(key: string): FileWindowContent | null {
  if (!key.startsWith(FILE_KEY_PREFIX)) return null;
  try {
    return JSON.parse(fromBase64(key.slice(FILE_KEY_PREFIX.length))) as FileWindowContent;
  } catch {
    return null;
  }
}

export function isFileContentKey(key: string): boolean {
  return key.startsWith(FILE_KEY_PREFIX);
}
