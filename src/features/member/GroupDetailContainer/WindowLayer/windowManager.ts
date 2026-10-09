// 윈도우 매니저 — 카드/파일/기록 편집창이 레이어 위 어디에 어떤 모양으로 떠 있는지를
// 전담한다. 세 가지를 묶어서 다룬다:
//   1. 추상 상태 전이: LayoutState(싱글/듀얼, 역할 1/2/3)가 액션(새 창/닫기/내림/올림/
//      펼침/전환/역할로 보내기)에 따라 어떻게 바뀌는지. 실제 창 데이터(id, 콘텐츠)는 전혀
//      모른다.
//   2. 물리 배치: 그 추상 역할이 화면의 왼쪽/오른쪽, 펼침/내림 중 어디에 그려져야 하는지.
//   3. role-data 재배정: 호출 하나 안에서만 의미 있는 임시 역할 라벨(1/2/3)을, 실제 창
//      데이터(roleData)와 함께 다음 상태에 맞는 정규 라벨로 다시 매긴다.
//
// 호출 경로 — 바깥에서는 항상 ../actions를 거친다. 이 파일을 외부(GroupDetailContainer
// 밖은 물론, WindowLayer 밖의 Window/EditWindow/CardWindow/FileWindow
// 등)에서 직접 import하는 건 eslint.config.js의 no-restricted-imports로 막아뒀다 —
// WindowLayer 디렉토리 내부(이 파일의 형제 파일들)와 ../actions.ts만 예외다. 바깥에 새로
// 공개해야 할 함수/타입이 생기면, 여기 직접 import하지 말고 actions.ts에 재익스포트를
// 추가한다.
//
// 디자인 패턴 — "patch 체인": 기본 동작(Map 기반 전수 열거, 해당 없으면 throw)에 설정이나
// 호출 맥락에 따른 예외를 끼워 넣어야 할 때는, 그 예외를 독립된 함수로 만들어 *_PATCHES
// 배열에 등록한다(CLOSE_WINDOW_PATCHES, NEW_WINDOW_PATCHES). 배열은 앞에서부터 실행되고,
// null이 아닌 첫 결과를 그 자리에서 채택한다(= null은 "이 패치는 해당 없음, 다음으로
// 넘겨라"는 폴백 신호). 배열의 마지막 함수만 예외로, 그 null은 폴백이 아니라 "진짜 답이
// null"이라는 뜻이다(더 넘길 다음이 없으므로).
//
// 확장할 때 지킬 것:
//   - 새 전이가 상태 조합을 전수 열거할 수 있으면 기존처럼 Map + key()로 만들고, 없는
//     조합은 반드시 throw한다(조용히 넘기지 않는다).
//   - 조건(설정값, 호출 맥락 등)에 따라 기본 전이를 가로채야 하면, 위 patch 체인 패턴을
//     그대로 따른다 — 호출부에 if문을 끼워 넣지 않는다.
//   - 새 액션은 WindowAction 유니온과 applyWindowAction의 switch에 같이 추가해서,
//     "창 액션은 전부 applyWindowAction을 거친다"는 단일 진입점을 유지한다.
//   - 역할을 가리키는 식별자가 필요하면 WindowRole("single"|"main"|"sub")을 그대로 쓴다.
//     구조가 같다고 동의어 타입을 새로 만들지 않는다.
import { encodeEditContentKey, type EditWindowTarget } from "../EditWindow/types";
import { encodeFileContentKey, type FileWindowContent } from "../FileWindow/types";

// 레이아웃 상태 — 창 객체를 담지 않는다. 창 레이어 자체가 없으면 null이다(별도 "Empty"
// variant를 두지 않는다). 있으면 싱글(창 하나) / 듀얼(메인+서브 두 자리, 각 자리는 실제 창
// 이거나 빈 슬롯 "Empty") 중 하나이고, 실제 창 자리의 값은 역할 번호(1/2/3)에 부호를 붙여
// 내림 여부를 나타낸다(예: -1 = 역할1이 내려간 상태). 실제 창 데이터(카드 id 등)는 이 파일
// 밖에서 관리한다.
export type SignedRole = 1 | -1 | 2 | -2 | 3 | -3;
export type SlotValue = SignedRole | "Empty";

export type LayoutState =
  | { kind: "Single"; occupant: SignedRole }
  | { kind: "Dual"; main: SlotValue; sub: SlotValue };

// 콘텐츠(카드/파일/기록 편집창) 쪽에 "지금 어느 역할에 있는지"를 알려줄 때 쓰는 식별자.
// 물리적 좌/우가 아니라 논리적 역할이다 — 물리 위치는 MAIN_SIDE에 따라 또 달라진다.
export type WindowRole = "single" | "main" | "sub";

function key(state: LayoutState): string {
  if (state.kind === "Single") return `Single(${state.occupant})`;
  return `Dual(${state.main},${state.sub})`;
}

// 기본 새 창 도착 — 메인은 그대로 유지되고 서브를 새 창(역할 3)으로 교체한다.
// 출발 카드 창을 대체하는 기록 편집창은 아래 patchReplaceSourceWindow가 먼저 가로챈다.
const NEW_WINDOW_MAP = new Map<string, LayoutState>([
  [key({ kind: "Single", occupant: 1 }), { kind: "Dual", main: 1, sub: 3 }],
  [key({ kind: "Single", occupant: -1 }), { kind: "Dual", main: -1, sub: 3 }],
  [key({ kind: "Dual", main: 1, sub: 2 }), { kind: "Dual", main: 1, sub: 3 }],
  [key({ kind: "Dual", main: 1, sub: -2 }), { kind: "Dual", main: 1, sub: 3 }],
  [key({ kind: "Dual", main: -1, sub: 2 }), { kind: "Dual", main: -1, sub: 3 }],
  [key({ kind: "Dual", main: -1, sub: -2 }), { kind: "Dual", main: -1, sub: 3 }],
  [key({ kind: "Dual", main: 1, sub: "Empty" }), { kind: "Dual", main: 1, sub: 3 }],
  [key({ kind: "Dual", main: -1, sub: "Empty" }), { kind: "Dual", main: -1, sub: 3 }],
  [key({ kind: "Dual", main: "Empty", sub: 2 }), { kind: "Dual", main: "Empty", sub: 3 }],
  [key({ kind: "Dual", main: "Empty", sub: -2 }), { kind: "Dual", main: "Empty", sub: 3 }],
]);

// patch 체인 하나의 시그니처 — null은 "해당 없음, 다음으로 넘겨라"는 폴백 신호다.
type NewWindowPatch = (state: LayoutState | null, source?: WindowRole) => LayoutState | null;

// 카드에서 연 기록 편집창은 출발 카드 창과 같은 자리를 교체한다. 반대쪽 창은 그대로 둔다.
// 출발 창을 찾을 수 없는 상태면 null을 반환해 기본 새 창 배치로 폴백한다.
function patchReplaceSourceWindow(state: LayoutState | null, source?: WindowRole): LayoutState | null {
  if (state?.kind === "Single" && source === "single") {
    return { kind: "Single", occupant: 3 };
  }
  if (state?.kind === "Dual") {
    if (source === "main" && typeof state.main === "number") return { ...state, main: 3 };
    if (source === "sub" && typeof state.sub === "number") return { ...state, sub: 3 };
  }
  return null;
}

// 패치 체인에 걸리지 않은 경우의 기본 동작 — 지금까지의 NEW_WINDOW_MAP 조회 그대로다.
function defaultNewWindowMapping(state: LayoutState | null): LayoutState {
  if (state === null) return { kind: "Single", occupant: 3 };
  const next = NEW_WINDOW_MAP.get(key(state));
  if (!next) throw new Error(`applyNewWindow: invalid state ${key(state)}`);
  return next;
}

// 코드에 나열한 순서가 곧 우선순위다 — CLOSE_WINDOW_PATCHES와 같은 패턴.
const NEW_WINDOW_PATCHES: readonly NewWindowPatch[] = [
  patchReplaceSourceWindow,
  defaultNewWindowMapping,
];

export function applyNewWindow(state: LayoutState | null, source?: WindowRole): LayoutState {
  for (let index = 0; index < NEW_WINDOW_PATCHES.length - 1; index += 1) {
    const result = NEW_WINDOW_PATCHES[index](state, source);
    if (result !== null) return result;
  }
  // 마지막 패치(defaultNewWindowMapping)는 항상 LayoutState를 반환한다(null을 반환하는 건
  // "레이어가 완전히 닫힌다"는 뜻인데, 새 창 생성에는 그런 결과가 없다).
  return NEW_WINDOW_PATCHES[NEW_WINDOW_PATCHES.length - 1](state, source) as LayoutState;
}

// 닫기/내림/펼침처럼 "셋 중 어느 자리에 대한 이벤트인지"만 필요한 함수들이 공유하는 입력 타입.
export type WindowTarget = "single" | "dualMain" | "dualSub";

// 창 닫기 — 싱글 닫기는 레이어 자체가 없어지므로 null. 듀얼에서 한쪽이 닫히면, 반대쪽이 실제
// 창이면 그 창이 자기 내림 상태를 유지한 채 싱글로 승격되고, 반대쪽이 원래 빈 슬롯이었으면
// 레이어 자체가 종료된다(null).
const CLOSE_WINDOW_MAP = new Map<string, LayoutState | null>([
  [`single:${key({ kind: "Single", occupant: 1 })}`, null],
  [`single:${key({ kind: "Single", occupant: -1 })}`, null],

  [`dualMain:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Single", occupant: 2 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Single", occupant: -2 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Single", occupant: 2 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Single", occupant: -2 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: "Empty" })}`, null],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: "Empty" })}`, null],

  [`dualSub:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Single", occupant: 1 }],
  [`dualSub:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Single", occupant: 1 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Single", occupant: -1 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Single", occupant: -1 }],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: 2 })}`, null],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: -2 })}`, null],
]);

// 패치 체인의 각 함수는 같은 시그니처를 쓴다 — null은 "이 패치는 해당 없음, 다음으로 넘겨라"는
// 폴백 신호다. 체인의 마지막 함수(defaultCloseWindowMapping)만은 예외로, 거기서 나오는 null은
// 폴백이 아니라 "레이어가 완전히 닫힌다"는 진짜 답이다(더 넘길 다음이 없으므로).
type CloseWindowPatch = (state: LayoutState, target: WindowTarget, restoreRole?: SignedRole) => LayoutState | null;

// 기록 편집 종료처럼 닫은 자리에 다른 콘텐츠를 복귀시키는 요청이다.
// 콘텐츠 종류는 호출부가 판단하고 여기서는 복귀할 역할의 배치만 처리한다.
function patchRestoreContentWhenWindowClosed(state: LayoutState, target: WindowTarget, restoreRole?: SignedRole): LayoutState | null {
  if (restoreRole === undefined) return null;
  if (state.kind === "Single") return { kind: "Single", occupant: restoreRole };
  if (target === "dualMain") {
    const duplicate = typeof state.sub === "number" && Math.abs(state.sub) === Math.abs(restoreRole);
    if (duplicate) return applyExpand(state, "dualSub");
    return { kind: "Dual", main: restoreRole, sub: state.sub };
  }
  if (target === "dualSub") {
    const duplicate = typeof state.main === "number" && Math.abs(state.main) === Math.abs(restoreRole);
    if (duplicate) return applyExpand(state, "dualMain");
    return { kind: "Dual", main: state.main, sub: restoreRole };
  }
  return null;
}

// 설정과 무관한 기본 동작 — 지금까지의 CLOSE_WINDOW_MAP 조회 그대로다.
function defaultCloseWindowMapping(state: LayoutState, target: WindowTarget): LayoutState | null {
  const mapKey = `${target}:${key(state)}`;
  if (!CLOSE_WINDOW_MAP.has(mapKey)) throw new Error(`applyCloseWindow: invalid (${target}, ${key(state)})`);
  return CLOSE_WINDOW_MAP.get(mapKey) ?? null;
}

// 코드에 나열한 순서가 곧 우선순위다 — 앞에서부터 실행해 null이 아닌 값이 나오면 그 자리에서
// 끝내고(폴백 없음), 마지막 함수의 결과는 null이어도 그대로 최종값으로 쓴다.
const CLOSE_WINDOW_PATCHES: readonly CloseWindowPatch[] = [
  patchRestoreContentWhenWindowClosed,
  defaultCloseWindowMapping,
];

export function applyCloseWindow(state: LayoutState, target: WindowTarget, restoreRole?: SignedRole): LayoutState | null {
  for (let index = 0; index < CLOSE_WINDOW_PATCHES.length - 1; index += 1) {
    const result = CLOSE_WINDOW_PATCHES[index](state, target, restoreRole);
    if (result !== null) return result;
  }
  return CLOSE_WINDOW_PATCHES[CLOSE_WINDOW_PATCHES.length - 1](state, target);
}

// 내림(minimize) — 이미 내려간 자리, 빈 슬롯을 내리는 입력은 없음(무효). 부호만 뒤집는다.
const MINIMIZE_MAP = new Map<string, LayoutState>([
  [`single:${key({ kind: "Single", occupant: 1 })}`, { kind: "Single", occupant: -1 }],

  [`dualMain:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Dual", main: -1, sub: 2 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Dual", main: -1, sub: -2 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: "Empty" })}`, { kind: "Dual", main: -1, sub: "Empty" }],

  [`dualSub:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Dual", main: 1, sub: -2 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Dual", main: -1, sub: -2 }],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: 2 })}`, { kind: "Dual", main: "Empty", sub: -2 }],
]);

export function applyMinimize(state: LayoutState, target: WindowTarget): LayoutState {
  const next = MINIMIZE_MAP.get(`${target}:${key(state)}`);
  if (!next) throw new Error(`applyMinimize: invalid (${target}, ${key(state)})`);
  return next;
}

// 올림/열림(raise) — 내림의 순수 반대. 이미 올라와있는 자리, 빈 슬롯을 올리는 입력은 없음(무효).
const RAISE_MAP = new Map<string, LayoutState>([
  [`single:${key({ kind: "Single", occupant: -1 })}`, { kind: "Single", occupant: 1 }],

  [`dualMain:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Dual", main: 1, sub: 2 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Dual", main: 1, sub: -2 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: "Empty" })}`, { kind: "Dual", main: 1, sub: "Empty" }],

  [`dualSub:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Dual", main: 1, sub: 2 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Dual", main: -1, sub: 2 }],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: -2 })}`, { kind: "Dual", main: "Empty", sub: 2 }],
]);

export function applyRaise(state: LayoutState, target: WindowTarget): LayoutState {
  const next = RAISE_MAP.get(`${target}:${key(state)}`);
  if (!next) throw new Error(`applyRaise: invalid (${target}, ${key(state)})`);
  return next;
}

// 펼침/확장(expand) — 대상 자리를 "올라온 싱글"로 만든다. 반대쪽은 무조건 닫히고(빈 슬롯이면
// 그냥 없어짐), 대상 자신이 내려가 있었으면 올리는 것까지 한 번에 처리된다.
export type DualTarget = "dualMain" | "dualSub";

const EXPAND_MAP = new Map<string, LayoutState>([
  [`dualMain:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Single", occupant: 1 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Single", occupant: 1 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Single", occupant: 1 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Single", occupant: 1 }],
  [`dualMain:${key({ kind: "Dual", main: 1, sub: "Empty" })}`, { kind: "Single", occupant: 1 }],
  [`dualMain:${key({ kind: "Dual", main: -1, sub: "Empty" })}`, { kind: "Single", occupant: 1 }],

  [`dualSub:${key({ kind: "Dual", main: 1, sub: 2 })}`, { kind: "Single", occupant: 2 }],
  [`dualSub:${key({ kind: "Dual", main: 1, sub: -2 })}`, { kind: "Single", occupant: 2 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: 2 })}`, { kind: "Single", occupant: 2 }],
  [`dualSub:${key({ kind: "Dual", main: -1, sub: -2 })}`, { kind: "Single", occupant: 2 }],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: 2 })}`, { kind: "Single", occupant: 2 }],
  [`dualSub:${key({ kind: "Dual", main: "Empty", sub: -2 })}`, { kind: "Single", occupant: 2 }],
]);

export function applyExpand(state: LayoutState, target: DualTarget): LayoutState {
  const next = EXPAND_MAP.get(`${target}:${key(state)}`);
  if (!next) throw new Error(`applyExpand: invalid (${target}, ${key(state)})`);
  return next;
}

// 전환(스위치) — 두 창의 내용은 교환하되 내림 여부는 기존 좌/우 슬롯에 유지한다.
// 반대쪽이 빈 슬롯이면 유지할 내림 상태가 없으므로 기존 창의 상태를 그대로 옮긴다.
// 물리적 좌/우 → main/sub 변환은 호출부 책임이다.
const SWITCH_MAP = new Map<string, LayoutState>([
  [key({ kind: "Dual", main: 1, sub: 2 }), { kind: "Dual", main: 2, sub: 1 }],
  [key({ kind: "Dual", main: 1, sub: -2 }), { kind: "Dual", main: 2, sub: -1 }],
  [key({ kind: "Dual", main: -1, sub: 2 }), { kind: "Dual", main: -2, sub: 1 }],
  [key({ kind: "Dual", main: -1, sub: -2 }), { kind: "Dual", main: -2, sub: -1 }],
  [key({ kind: "Dual", main: 1, sub: "Empty" }), { kind: "Dual", main: "Empty", sub: 1 }],
  [key({ kind: "Dual", main: -1, sub: "Empty" }), { kind: "Dual", main: "Empty", sub: -1 }],
  [key({ kind: "Dual", main: "Empty", sub: 2 }), { kind: "Dual", main: 2, sub: "Empty" }],
  [key({ kind: "Dual", main: "Empty", sub: -2 }), { kind: "Dual", main: -2, sub: "Empty" }],
]);

export function applySwitch(state: LayoutState): LayoutState {
  const next = SWITCH_MAP.get(key(state));
  if (!next) throw new Error(`applySwitch: invalid state ${key(state)}`);
  return next;
}

// 싱글에서 좌/우로 보내기 — 그 창을 main 또는 sub 역할로 보내고, 반대쪽엔 빈 슬롯("Empty")이
// 생긴다. 물리적 좌/우 → main/sub 변환은 호출부 책임.
export type SendTarget = "main" | "sub";

const SEND_TO_ROLE_MAP = new Map<string, LayoutState>([
  [`main:${key({ kind: "Single", occupant: 1 })}`, { kind: "Dual", main: 1, sub: "Empty" }],
  [`main:${key({ kind: "Single", occupant: -1 })}`, { kind: "Dual", main: -1, sub: "Empty" }],
  [`sub:${key({ kind: "Single", occupant: 1 })}`, { kind: "Dual", main: "Empty", sub: 1 }],
  [`sub:${key({ kind: "Single", occupant: -1 })}`, { kind: "Dual", main: "Empty", sub: -1 }],
]);

export function applySendToRole(state: LayoutState, target: SendTarget): LayoutState {
  const next = SEND_TO_ROLE_MAP.get(`${target}:${key(state)}`);
  if (!next) throw new Error(`applySendToRole: invalid (${target}, ${key(state)})`);
  return next;
}

// 창 액션 하나로 통일 — 액션 타입에 따라 알맞은 매핑 함수로 위임한다. 호출부는 결과
// LayoutState|null을 resolveActiveSlots에 넘겨 재배치하기만 하면 된다. "new"는 state가
// null(레이어가 아예 없는 상태)이어도 유효한 유일한 액션이라, null 체크보다 먼저 처리한다.
export type WindowAction =
  | { type: "new"; source?: WindowRole }
  | { type: "close"; target: WindowTarget; restoreRole?: SignedRole }
  | { type: "minimize"; target: WindowTarget }
  | { type: "raise"; target: WindowTarget }
  | { type: "expand"; target: DualTarget }
  | { type: "switch" }
  | { type: "sendToRole"; target: SendTarget };

export function applyWindowAction(state: LayoutState | null, action: WindowAction): LayoutState | null {
  if (action.type === "new") return applyNewWindow(state, action.source);
  if (state === null) throw new Error(`applyWindowAction: "${action.type}" on null state`);
  switch (action.type) {
    case "close":
      return applyCloseWindow(state, action.target, action.restoreRole);
    case "minimize":
      return applyMinimize(state, action.target);
    case "raise":
      return applyRaise(state, action.target);
    case "expand":
      return applyExpand(state, action.target);
    case "switch":
      return applySwitch(state);
    case "sendToRole":
      return applySendToRole(state, action.target);
  }
}

// 렌더링이 실제로 꽂히는 물리 슬롯 6개. 각 슬롯의 모양/크기/이동 애니메이션은 컴포넌트가
// 정의하고, 여기서는 "이 role이 지금 어느 슬롯에 있어야 하는지"만 계산한다.
export type PhysicalSlot =
  | "single"
  | "singleMinimized"
  | "leftExpanded"
  | "rightExpanded"
  | "leftMinimized"
  | "rightMinimized";

// 메인이 물리적으로 좌/우 어느 쪽인지는 여기서만 정한다 — 실제로 넓은 쪽(동률이면 왼쪽)을
// WindowLayer가 렌더 시작할 때마다 setMainSide로 반영한다(useEffect가 아니라 렌더
// 본문 맨 위에서 — 그래야 그 안에서 바로 이어지는 resolveActiveSlots/locateEmptySlot/
// sideForRole 호출들과 CardWindow/FileWindow 등 자식 렌더가 같은 렌더 패스 안에서 항상
// 최신값을 본다. 한 프레임 늦게 반영되는 걸 피하려는 것).
let MAIN_SIDE: "left" | "right" = "left";

export function setMainSide(side: "left" | "right") {
  MAIN_SIDE = side;
}

// "왼쪽/오른쪽으로 보내기" 버튼처럼, 호출부가 물리적 좌/우를 알고 있을 때 그걸 main/sub
// 역할로 바꿔주는 헬퍼. main/sub 자체는 이 파일 밖에서 몰라야 하는 개념이 아니라, 물리적
// 배치(MAIN_SIDE)만 이 파일이 감춘다.
export function roleForSide(side: "left" | "right"): "main" | "sub" {
  return side === MAIN_SIDE ? "main" : "sub";
}

export function sideForRole(role: "main" | "sub"): "left" | "right" {
  return role === "main" ? MAIN_SIDE : MAIN_SIDE === "left" ? "right" : "left";
}

function locateInState(state: LayoutState | null, role: number, mainSide = MAIN_SIDE): PhysicalSlot | null {
  if (state === null) return null;

  if (state.kind === "Single") {
    if (Math.abs(state.occupant) !== role) return null;
    return state.occupant > 0 ? "single" : "singleMinimized";
  }

  if (typeof state.main === "number" && Math.abs(state.main) === role) {
    const side = mainSide;
    if (state.main > 0) return side === "left" ? "leftExpanded" : "rightExpanded";
    return side === "left" ? "leftMinimized" : "rightMinimized";
  }
  if (typeof state.sub === "number" && Math.abs(state.sub) === role) {
    const side = mainSide === "left" ? "right" : "left";
    if (state.sub > 0) return side === "left" ? "leftExpanded" : "rightExpanded";
    return side === "left" ? "leftMinimized" : "rightMinimized";
  }

  return null;
}

// 듀얼의 빈 슬롯("Empty")이 지금 어느 물리 슬롯에 있는지 — 실제 창 데이터는 없지만 자리
// 표시자(placeholder)를 그릴 위치가 필요할 때 쓴다. 빈 슬롯은 내림 개념이 없어 항상 펼침
// 쪽 물리 슬롯이다.
export function locateEmptySlot(state: LayoutState | null): PhysicalSlot | null {
  if (state === null || state.kind !== "Dual") return null;
  if (state.main === "Empty") return MAIN_SIDE === "left" ? "leftExpanded" : "rightExpanded";
  if (state.sub === "Empty") return MAIN_SIDE === "left" ? "rightExpanded" : "leftExpanded";
  return null;
}

// 각 role(호출 시점에 임시로 붙인 대수 라벨)에 실제 창 데이터를 매달아 넘기면, nextState에서
// 그 role이 어디 있는지 찾아 슬롯을 붙인 배열로 돌려준다. nextState에 없는 role은 배열에서
// 아예 빠진다(= 그 창은 사라짐).
//
// 렌더링할 때 이 배열의 React key는 role이 아니라 data 안의 실제 창 id로 줘야 한다 — role은
// 호출마다 새로 매기는 임시 라벨이라, role로 key를 주면 같은 창이 이동할 때도 리마운트된다.
//
// data(실제 창 id, 호출부는 항상 windowId 숫자를 넘긴다) 기준으로 정렬해서 반환한다 — role
// 기준(= Object.entries의 기본 오름차순)으로 두면 좌우 전환마다 normalizeRoles가 메인을 항상
// role 1로 다시 매겨서, 전환마다 두 창의 배열 순서가 뒤바뀐다. React는 그 순서 변화를
// 반영하려고 둘 중 하나의 DOM 노드를 실제로 옮기는데, 그렇게 옮겨진 쪽만 브라우저가 전환
// 애니메이션을 못 잇고 점프한다(옮기지 않은 쪽만 slot 클래스가 바뀌어 자연스럽게 슬라이드됨).
// data로 정렬하면 전환으로는 두 창의 배열 순서가 절대 안 바뀌어서, 양쪽 다 DOM 위치를 유지한
// 채 slot 클래스만 바뀐다.
export function resolveActiveSlots<T>(
  roleData: Record<number, T>,
  nextState: LayoutState | null,
  mainSide = MAIN_SIDE,
): Array<{ role: number; data: T; slot: PhysicalSlot }> {
  const result: Array<{ role: number; data: T; slot: PhysicalSlot }> = [];
  const entries = Object.entries(roleData)
    .sort(([, dataA], [, dataB]) => Number(dataA) - Number(dataB));
  for (const [roleStr, data] of entries) {
    const role = Number(roleStr);
    const slot = locateInState(nextState, role, mainSide);
    if (slot) result.push({ role, data, slot });
  }
  return result;
}

// 매핑 함수들은 호출 하나 안에서만 의미 있는 대수 라벨(1/2/3)을 쓴다 — applyNewWindow가 새
// 창을 항상 "3"으로 부르는 식이라, 라벨을 그대로 들고 다니면 다음 새 창 도착 때 또 "3"이
// 나와서 이전 서브와 충돌한다. 그래서 전환을 적용할 때마다 결과를 정규 형태로 다시 라벨링한다
// — 싱글의 유일한 창은 항상 role 1, 듀얼의 메인은 항상 role 1, 서브는 항상 role 2로.
// roleData도 그 라벨에 맞춰 같이 재배정해서 돌려준다. 이 함수를 호출 사이사이 항상 거치면
// roleData는 { 1?: ..., 2?: ... } 두 키만 쓰게 된다.
export function normalizeRoles<T>(
  state: LayoutState,
  roleData: Record<number, T>,
): { state: LayoutState; roleData: Record<number, T> } {
  if (state.kind === "Single") {
    const sign = state.occupant > 0 ? 1 : -1;
    const data = roleData[Math.abs(state.occupant)];
    const nextRoleData: Record<number, T> = {};
    if (data !== undefined) nextRoleData[1] = data;
    return { state: { kind: "Single", occupant: (1 * sign) as SignedRole }, roleData: nextRoleData };
  }

  const nextRoleData: Record<number, T> = {};
  let nextMain: SlotValue = "Empty";
  let nextSub: SlotValue = "Empty";

  if (typeof state.main === "number") {
    const sign = state.main > 0 ? 1 : -1;
    nextMain = (1 * sign) as SignedRole;
    const data = roleData[Math.abs(state.main)];
    if (data !== undefined) nextRoleData[1] = data;
  }
  if (typeof state.sub === "number") {
    const sign = state.sub > 0 ? 1 : -1;
    nextSub = (2 * sign) as SignedRole;
    const data = roleData[Math.abs(state.sub)];
    if (data !== undefined) nextRoleData[2] = data;
  }

  return { state: { kind: "Dual", main: nextMain, sub: nextSub }, roleData: nextRoleData };
}

// 창을 여는 모든 경로(카드 클릭, 파일 클릭, 기록 작성/수정 등)가 거치는 단일 요청 모양이다.
// GroupDetailContainer의 openWindow()가 이걸 받아 WindowLayer.openWindow(key)가 쓰는 문자열
// 키로 인코딩한다 — WindowLayer 자신은 콘텐츠 종류를 몰라야 하므로, 그 변환은 항상 이 파일
// (과 호출부)에서만 한다.
export type WindowOpenRequest =
  | { type: "card"; cardId: string }
  | { type: "file"; content: FileWindowContent }
  | { type: "edit"; target: EditWindowTarget };

export function encodeWindowOpenRequest(request: WindowOpenRequest): string {
  if (request.type === "card") return request.cardId;
  if (request.type === "file") return encodeFileContentKey(request.content);
  return encodeEditContentKey(request.target);
}

// WindowOpenRequest와 같은 이유로 여기 둔다 — 요청하는 쪽(KanbanBoard)은 WindowLayer가
// 내려간 헤더를 들어올릴 때 내부적으로 어떤 함수(liftMinimizedSlots/clearLiftedSlots)를
// 쓰는지 몰라도 되고, "지금 내려간 헤더 위에서 들어올려야 하는 상황인가"만 넘기면 된다.
// WindowLayer는 이 요청을 받아 자기가 호버로 거는 것과 똑같은 함수를 그대로 호출한다.
export type MinimizedHoverRequest = { hovering: boolean };
