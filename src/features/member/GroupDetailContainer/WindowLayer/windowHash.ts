// URL 해시 ↔ 레이어 상태 변환. 문법은 knowledge/frontend/card-window-manager.md §9.1 참고.
//
//   hash := "" | slot ("&" slot)?
//   slot := "_"? (card-id | "empty" | type "=" value)
//
// 첫 slot이 메인, "&" 뒤 slot이 서브다. slot이 하나면 싱글, 둘이면 듀얼. "_"는 그 슬롯이
// 내려간(minimized) 상태라는 뜻이다.
//
// card-id와 "type=value"를 구분하는 데 별도 접두 기호(예전엔 "$")가 필요 없다 — card-id(지금
// 정수 카운터든, 나중에 마이그레이션할 ulid든)는 "=" 문자를 포함할 일이 없으므로 "=" 유무
// 자체가 이미 충분한 구분자다. "card=<id>"처럼 명시적으로 타입을 적어도 bare id와 똑같이
// 카드로 취급한다(decodeToken의 cardId 분기). 새 주소는 항상 "card=<id>"로 내보낸다.
//
// 카드가 아닌 창(파일 창 등)은 WindowLayer 입장에선 "roleData에 뭐가 들어있는지" 몰라도
// 되게, roleData 문자열 값 자체에 "타입:내용" 컨벤션을 쓴다(예: FileWindow/types.ts의
// "file:<base64>") — 이 파일은 그 컨벤션이 있는지만 보고 "타입=내용" 토큰으로 바꿔주기만
// 하며, 내용이 실제로 뭘 가리키는지는 모른다(그건 렌더링하는 쪽의 책임 — 모르는 타입이면
// 호출부가 지원 여부를 판별하고 WindowLayer가 복원 대상에서 제외한다). value는
// 항상 base64라서 "&"/"="/":" 같은 구분자 문자를 포함하지 않는다 — 그래서 따옴표로 감쌀 필요가
// 없고(base64 알파벳은 URI fragment에서 그대로 안전해 브라우저가 따로 percent-encode하지도
// 않는다), 우리가 거는 base64 인코딩 한 번이 전부다.
import { LayoutState, SignedRole, SlotValue } from "./windowManager";

type DecodedToken =
  | { kind: "card"; cardId: string; minimized: boolean }
  | { kind: "empty" };

function splitHashTokens(hash: string): string[] {
  return hash.split("&");
}

const WINDOW_TOKEN_PATTERN = /^([a-zA-Z0-9-]+)=([\s\S]*)$/;

function decodeToken(raw: string): DecodedToken {
  const minimized = raw.startsWith("_");
  const rest = minimized ? raw.slice(1) : raw;
  if (rest === "empty") return { kind: "empty" };
  const windowToken = rest.match(WINDOW_TOKEN_PATTERN);
  if (windowToken) {
    const [, type, value] = windowToken;
    // "card=<id>"는 bare card-id와 완전히 같은 경로로 들어간다 — 접두 타입이 있고 없고의
    // 차이만 있을 뿐, 이후 처리(존재하지 않는 카드 표시 등)는 전부 downstream이 똑같이 한다.
    return { kind: "card", cardId: type === "card" ? value : `${type}:${value}`, minimized };
  }
  return { kind: "card", cardId: rest, minimized };
}

export function decodeWindowHash(hash: string): { state: LayoutState | null; roleData: Record<number, string> } {
  if (!hash) return { state: null, roleData: {} };
  const [mainRaw, subRaw] = splitHashTokens(hash);

  if (subRaw === undefined) {
    const main = decodeToken(mainRaw);
    if (main.kind !== "card") return { state: null, roleData: {} };
    return {
      state: { kind: "Single", occupant: (main.minimized ? -1 : 1) as SignedRole },
      roleData: { 1: main.cardId },
    };
  }

  const main = decodeToken(mainRaw);
  const sub = decodeToken(subRaw);
  const roleData: Record<number, string> = {};
  let mainValue: SlotValue = "Empty";
  let subValue: SlotValue = "Empty";
  if (main.kind === "card") {
    mainValue = (main.minimized ? -1 : 1) as SignedRole;
    roleData[1] = main.cardId;
  }
  if (sub.kind === "card") {
    subValue = (sub.minimized ? -2 : 2) as SignedRole;
    roleData[2] = sub.cardId;
  }
  return { state: { kind: "Dual", main: mainValue, sub: subValue }, roleData };
}

const CONTENT_KEY_PATTERN = /^([a-zA-Z0-9-]+):([\s\S]*)$/;

function encodeSlotValue(value: SlotValue, roleData: Record<number, string>): string {
  if (value === "Empty") return "empty";
  const contentKey = roleData[Math.abs(value)] ?? "";
  const prefix = value < 0 ? "_" : "";
  const windowContent = contentKey.match(CONTENT_KEY_PATTERN);
  if (windowContent) return `${prefix}${windowContent[1]}=${windowContent[2]}`;
  return `${prefix}card=${contentKey}`;
}

// 카드 주소는 "card=<id>"로 통일한다. 레거시 bare id는 디코딩에서 계속 받아준다.
export function encodeWindowHash(state: LayoutState | null, roleData: Record<number, string>): string {
  if (state === null) return "";
  if (state.kind === "Single") return encodeSlotValue(state.occupant, roleData);
  return `${encodeSlotValue(state.main, roleData)}&${encodeSlotValue(state.sub, roleData)}`;
}

function slotValueEquals(a: SlotValue, b: SlotValue): boolean {
  return a === b;
}

// commit()이 자기가 낸 해시 변경을 되돌려받아 또 반영하려는 것(무한 루프)인지 구분하는 데 쓴다.
export function layoutSnapshotEquals(
  a: { state: LayoutState | null; roleData: Record<number, string> },
  b: { state: LayoutState | null; roleData: Record<number, string> },
): boolean {
  if (a.state === null || b.state === null) return a.state === b.state;
  if (a.state.kind !== b.state.kind) return false;
  if (a.state.kind === "Single" && b.state.kind === "Single") {
    return a.state.occupant === b.state.occupant && a.roleData[Math.abs(a.state.occupant)] === b.roleData[Math.abs(b.state.occupant)];
  }
  if (a.state.kind === "Dual" && b.state.kind === "Dual") {
    const sameSlot = (av: SlotValue, bv: SlotValue) => {
      if (!slotValueEquals(av, bv)) return false;
      if (av === "Empty") return true;
      return a.roleData[Math.abs(av)] === b.roleData[Math.abs(bv as number)];
    };
    return sameSlot(a.state.main, b.state.main) && sameSlot(a.state.sub, b.state.sub);
  }
  return false;
}
