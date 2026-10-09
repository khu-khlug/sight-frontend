// roleData(역할 → 콘텐츠 식별자 문자열)에 들어가는 값의 "종류"를 판별한다. 컨벤션은
// windowHash.ts와 같다 — "타입:내용"이면 그 타입("file", "edit", 앞으로 생길 "git" 등)이고,
// 콜론 접두사가 없는 bare 문자열이면 카드 id다.
//
// 이게 필요한 이유: WindowLayer는 이 식별자를 그냥 불투명한 키로만 다루므로, "지금 메인이
// 카드인지 아닌지"는 식별자 생김새로만 구분할 수 있다. 예전엔 모든 메인 식별자가 카드
// id라고 가정한 코드가 있었는데(GroupDetailContainer의 "카드 존재 확인" effect), 파일
// 창이 메인이 되는 순간 그 가정이 깨져서 "존재하지 않는 카드"로 오판했다.
const CONTENT_KEY_TYPE_PATTERN = /^([a-zA-Z0-9-]+):/;

// 접두사 타입을 돌려준다. 카드 id처럼 접두사가 없으면 null.
export function contentKeyType(key: string): string | null {
  const match = key.match(CONTENT_KEY_TYPE_PATTERN);
  return match ? match[1] : null;
}

export function isCardKey(key: string): boolean {
  return contentKeyType(key) === null;
}
