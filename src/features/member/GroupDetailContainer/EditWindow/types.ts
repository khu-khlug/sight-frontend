// 기록 편집 창이 다루는 대상. roleData(WindowLayer가 들고 있는 "역할 → 콘텐츠 식별자" 문자열
// 맵)에 저장하는 값의 모양은 FileWindow/types.ts의 "file:" 접두사 컨벤션과 같다 —
// "edit:new_<카드id>"(새 기록) 또는 "edit:<기록id>"(기존 기록 수정). windowHash.ts의
// "type=value" 해시 토큰 규칙이 그대로 "edit:"로 바꿔주므로, URL에서는 "edit=new_<카드id>" /
// "edit=<기록id>"로 보인다.
//
// autoloadDraft(해시로는 "editdraft=..."): 그룹아카이브의 "임시저장: 카드명" 버튼이 쓰는
// 전용 진입 경로다. 이미 어떤 임시저장을 열 건지 사용자가 버튼 문구로 명확히 알고 누른
// 것이므로, EditWindow가 열릴 때 "불러올까요?"를 또 묻지 않고 바로 불러온다. 저장소에
// 쓰는 진짜 식별자(autosave의 location)에는 이 플래그가 섞이면 안 되므로,
// encodeEditContentKey는 이 플래그를 무시하고 항상 "edit:" 접두사로만 인코딩한다 — 해시
// 전용 인코딩은 encodeDraftOpenHash가 따로 맡는다.
export type EditWindowTarget =
  | { kind: "new"; cardId: string; autoloadDraft?: boolean }
  | { kind: "record"; recordId: string; autoloadDraft?: boolean };

const EDIT_KEY_PREFIX = "edit:";
const EDIT_DRAFT_KEY_PREFIX = "editdraft:";
const NEW_KEY_PREFIX = "new_";

export function encodeEditContentKey(target: EditWindowTarget): string {
  if (target.kind === "new") return `${EDIT_KEY_PREFIX}${NEW_KEY_PREFIX}${target.cardId}`;
  return `${EDIT_KEY_PREFIX}${target.recordId}`;
}

// 그룹아카이브의 "임시저장: 카드명" 버튼이 쓰는 URL 해시 전용 인코딩 — windowHash.ts의
// "type=value" 규칙 그대로("editdraft=new_<카드id>" 또는 "editdraft=<기록id>").
export function encodeDraftOpenHash(target: { kind: "new"; cardId: string } | { kind: "record"; recordId: string }): string {
  if (target.kind === "new") return `editdraft=${NEW_KEY_PREFIX}${target.cardId}`;
  return `editdraft=${target.recordId}`;
}

export function decodeEditContentKey(key: string): EditWindowTarget | null {
  const autoloadDraft = key.startsWith(EDIT_DRAFT_KEY_PREFIX);
  const prefix = autoloadDraft ? EDIT_DRAFT_KEY_PREFIX : EDIT_KEY_PREFIX;
  if (!key.startsWith(prefix)) return null;
  const rest = key.slice(prefix.length);
  if (rest.startsWith(NEW_KEY_PREFIX)) return { kind: "new", cardId: rest.slice(NEW_KEY_PREFIX.length), autoloadDraft };
  return { kind: "record", recordId: rest, autoloadDraft };
}
