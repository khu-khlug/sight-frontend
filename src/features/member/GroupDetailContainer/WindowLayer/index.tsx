import { CSSProperties, forwardRef, PointerEvent as ReactPointerEvent, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { MinimizedHoverRequest } from "../actions";
import { cn } from "../../../../util/cn";
import {
  applyCloseWindow,
  applyRaise,
  applyWindowAction,
  DualTarget,
  LayoutState,
  locateEmptySlot,
  normalizeRoles,
  PhysicalSlot,
  resolveActiveSlots,
  setMainSide,
  sideForRole,
  SlotValue,
  SignedRole,
  WindowAction,
  WindowRole,
  WindowTarget,
} from "./windowManager";
import styles from "./style.module.css";
import { decodeWindowHash, encodeWindowHash, layoutSnapshotEquals } from "./windowHash";
import { readWindowHistory, restoreWindowIds, windowHistoryState } from "./windowHistory";
import type { WindowHistoryState, WindowSnapshot } from "./windowHistory";

export type { WindowRole } from "./windowManager";
export type HistoryMode = "push" | "replace";
export type { WindowHistoryState } from "./windowHistory";

export type WindowBinding = {
  role: WindowRole;
  minimized: boolean;
  isClosing: boolean;
  canGoDual: boolean;
  otherSideEmpty: boolean;
  onToggleMinimize: () => void;
  // 지정한 콘텐츠로 같은 자리를 복귀시킬 수 있다. 생략하면 일반 창 닫기다.
  onClose: (options?: { restoreContentKey: string }) => void;
  onSwitchSide: () => void;
  onExpand: () => void;
  onSendToSide: (side: "left" | "right") => void;
  // 이 창이 저장 안 한 변경을 들고 있는 동안 확인 함수를 등록해둔다. null을 넘기면 해제.
  // 반환값 true = 계속 진행(버려도 됨), false = 취소(그대로 남아있음). WindowLayer는 이
  // 창이 실제로 사라지는 모든 경로(닫기, 다른 카드로 교체, 펼치기로 반대쪽이 사라짐 등)
  // 직전에 등록된 함수를 호출해서 확인한다 — 콘텐츠 쪽은 레이어가 싱글/듀얼 중 무엇인지,
  // 어떤 경로로 닫히는지 몰라도 된다.
  registerCloseGuard: (confirmClose: (() => boolean) | null) => void;
};

export type WindowLayerHandle = {
  // key는 WindowLayer한테는 그냥 불투명한 식별자다 — 카드면 카드 id 그대로, 카드가 아닌
  // 창(파일 등)이면 "타입:내용" 컨벤션 문자열이다(FileWindow/types.ts 등 각 창 종류가
  // 소유). 어떤 콘텐츠를 렌더링할지는 전부 renderContent prop의 책임이고, WindowLayer는
  // 이 식별자로 역할(role)에 배치하고 URL에 싣는 것만 한다.
  openWindow: (key: string, options?: { replaceFrom?: WindowRole }) => void;
  // 지금 이 카드가 열려 있으면(메인/서브 어느 쪽이든) 닫는다 — 카드가 외부에서(삭제 등) 사라진
  // 경우 호출부(GroupDetailContainer)가 쓴다. 안 열려 있으면 아무 일도 안 한다.
  closeCardIfOpen: (cardId: string) => void;
  // 지금 URL 해시를 레이어 상태로 그대로 되돌린다(knowledge/frontend/card-window-manager.md
  // §9.3) — 직접 진입·브라우저 뒤로/앞으로가기처럼 "URL이 이미 바뀐 뒤 그에 맞춰 상태만
  // 맞추면 되는" 경우에 쓴다. 주소 정규화·창 ID 보충은 replace하며 히스토리는 추가하지 않는다.
  syncFromHash: (hash: string, history?: unknown) => boolean;
  getHistoryState: () => WindowHistoryState;
  // WindowOpenRequest와 같은 패턴 — 요청하는 쪽(KanbanBoard의 가로 스크롤바)은 내려간 헤더를
  // 들어올리는 내부 함수(liftMinimizedSlots/clearLiftedSlots)를 몰라도 되고, "지금 들어올려야
  // 하는가"만 요청한다. WindowLayer는 이 요청을 받아 네이티브 호버가 거는 것과 같은 함수를
  // 그대로 호출한다.
  requestMinimizedHover: (request: MinimizedHoverRequest) => void;
  // 스크롤바 썸을 드래그로 잡고 있는 동안에도 호버와 독립된 소스로 등록한다 — 드래그 중
  // 커서가 트랙 밖으로 잠깐 나가도 들뜸이 꺼지지 않아야 한다.
  setScrollbarGrabbed: (grabbed: boolean) => void;
};

// 듀얼 한쪽이 빈 슬롯이고 반대쪽이 실제로 펼쳐져 칸반을 가리고 있을 때, 그 가린 폭만큼
// 호출부(GroupDetailContainer)가 칸반 스크롤 여유를 더 줄 수 있도록 알려준다.
export type WindowCoverage = { side: "left" | "right"; widthPx: number };

type Props = {
  // key는 WindowLayerHandle.openWindow와 같은 식별자다. 호출부가 key를 보고 카드인지
  // 파일인지 판별해 알맞은 창을 렌더링한다 — WindowLayer는 그 판별에 관여하지 않는다.
  renderContent: (key: string, binding: WindowBinding) => ReactNode;
  // 콘텐츠 판별은 호출부가 맡고, 레이어는 지원하지 않는 복원 슬롯을 기본 닫기 규칙으로 제외한다.
  isSupportedContent: (key: string) => boolean;
  onUnsupportedContent: () => void;
  isDashboardExpanded?: boolean;
  // 실제 내비게이션(navigate 호출)이 필요할 때만 부른다 — commit()이 자기 행동의 결과로
  // URL을 바꿀 때. 해시 문법 자체는 windowHash.ts가 갖고 있고, 여기서는 완성된 문자열만
  // 넘긴다.
  onHashChange: (hash: string, mode: HistoryMode, history: WindowHistoryState) => void;
  // 지금 메인 카드가 뭔지 알려주기만 한다(내비게이션과 무관) — commit()과 syncFromHash() 둘
  // 다에서 호출된다. 호출부(GroupDetailContainer)는 이 값으로 "열려 있는 카드가 아직
  // 존재하는지"만 확인한다.
  onMainCardChange: (cardId: string | null) => void;
  onCoverageChange?: (coverage: WindowCoverage | null) => void;
  // 개인설정의 "듀얼 윈도우 기능" 토글 — 꺼지면 가용 영역이 충분히 넓어도(원래라면
  // 듀얼이 가능해도) 항상 싱글만 쓰게 한다. "화면이 좁아서 듀얼이 불가능한" 기존 조건
  // (canGoDual)과 같은 자리에 조건 하나를 더하는 것뿐이라, 이미 있는 "좁아지면 싱글로
  // 강제 전환" 로직을 그대로 재사용한다.
  dualWindowEnabled?: boolean;
  initialSplitRatio?: number;
  onSplitRatioCommit?: (ratio: number) => void;
};

// style.module.css의 --content-inset/--dual-gap과 반드시 같은 값이어야 한다 — 펼침 슬롯의
// 실제 렌더 폭을 DOM 측정 없이 계산하는 데 쓴다.
const CONTENT_INSET = 40;
const DUAL_GAP = 20;
const MIN_DUAL_RESIZE_RANGE = 100;
// .slot의 left/width/height/bottom 트랜지션 시간(style.module.css)과 같은 값 — 전환
// 애니메이션이 끝나는 시점에 맞춰 .slotFront를 뗀다.
const SWITCH_ANIMATION_MS = 200;
const CLOSE_ANIMATION_MS = 160;
const OUTSIDE_CLICK_MOVE_THRESHOLD = 4;

function dualWidths(ratio: number, width: number, height: number) {
  const available = width - 2 * CONTENT_INSET - DUAL_GAP;
  const minSlotWidth = Math.max(0, (height - 2 * CONTENT_INSET - DUAL_GAP) / 2);
  const leftWidth = Math.min(Math.max(ratio * available, minSlotWidth), Math.max(minSlotWidth, available - minSlotWidth));
  return { available, minSlotWidth, leftWidth, rightWidth: available - leftWidth };
}

type RenderedWindow = {
  windowId: number;
  contentKey: string;
  slot: PhysicalSlot;
  role: WindowRole;
  target: WindowTarget;
  isClosing: boolean;
  aloneEdgeClass?: string;
  style?: CSSProperties;
  renderContent?: Props["renderContent"];
};

const SLOT_CLASS: Record<PhysicalSlot, string> = {
  single: styles.slotSingle,
  singleMinimized: styles.slotSingleMinimized,
  leftExpanded: styles.slotLeftExpanded,
  rightExpanded: styles.slotRightExpanded,
  leftMinimized: styles.slotLeftMinimized,
  rightMinimized: styles.slotRightMinimized,
};

const MINIMIZED_SLOTS = new Set<PhysicalSlot>(["singleMinimized", "leftMinimized", "rightMinimized"]);
const BLOCKING_SLOTS = new Set<PhysicalSlot>(["single", "leftExpanded", "rightExpanded"]);

function targetForRole(state: LayoutState, role: number): WindowTarget {
  if (state.kind === "Single") return "single";
  const isMain = typeof state.main === "number" && Math.abs(state.main) === role;
  return isMain ? "dualMain" : "dualSub";
}

// 가려지지 않는 틈이 하나라도 있는가(빈 슬롯이거나 내려간 자리) — 있으면 그 틈을 통해 칸반을
// 조작할 수 있어야 하니 오버레이 전체의 클릭/딤을 꺼서 틈을 통과시킨다(실제 창 자신은 각
// 슬롯이 pointer-events:auto로 다시 켜서 평소처럼 클릭된다).
function isGap(value: SlotValue): boolean {
  return value === "Empty" || value < 0;
}
function hasPassthroughGap(state: LayoutState | null): boolean {
  if (state === null) return true;
  if (state.kind === "Single") return state.occupant < 0;
  return isGap(state.main) || isGap(state.sub);
}

function mainCardId(state: LayoutState | null, roleData: Record<number, string>): string | null {
  if (state === null) return null;
  if (state.kind === "Single") return roleData[Math.abs(state.occupant)] ?? null;
  if (typeof state.main === "number") return roleData[Math.abs(state.main)] ?? null;
  return null;
}

/*
 * 카드 창뿐 아니라 앞으로 생길 다른 창 종류도 같이 쓸 레이어 껍데기. 상태전이(windowManager.ts의
 * 매핑 함수들)를 직접 호출해서 소유하고, 6개 물리 슬롯(싱글/싱글내림/좌펼침/우펼침/좌내림/
 * 우내림) 중 배치가 있는 곳만 렌더링한다. 호출하는 쪽(GroupDetailContainer)은 "이 카드
 * 열어줘"만 요청하고, URL은 onHashChange로 받은 문자열을 그대로 navigate에 싣기만 한다 —
 * 해시 문법과 상태 적용은 여기서 소유한다. 일반 조작은 해시가 바뀔 때마다 히스토리를 추가한다.
 */
const WindowLayer = forwardRef<WindowLayerHandle, Props>(function WindowLayer(
  { renderContent, isSupportedContent, onUnsupportedContent, isDashboardExpanded = false, onHashChange, onMainCardChange, onCoverageChange, dualWindowEnabled = true, initialSplitRatio = 0.7, onSplitRatioCommit },
  ref,
) {
  const [snapshot, setSnapshot] = useState<WindowSnapshot>({
    state: null, roleData: {}, windowIds: {},
    splitRatio: initialSplitRatio,
    mainSide: initialSplitRatio >= 0.5 ? "left" : "right",
  });
  const snapshotRef = useRef(snapshot);
  const { state, roleData, windowIds, splitRatio, mainSide } = snapshot;
  // 자식 창의 방향 버튼도 현재 실제 메인 위치를 같은 렌더에서 참조한다.
  setMainSide(mainSide);
  // roleData(콘텐츠 키, URL에 싣는 값)와 완전히 분리된 창 식별자 — 같은 콘텐츠 키가 양쪽
  // 슬롯에 동시에 뜰 수 있어 콘텐츠 키 자체는 "이 창 하나"의 식별자로 못 쓴다. role 번호도
  // normalizeRoles가 매 액션마다 "메인=1, 서브=2"로 재배정해서 위치의 별칭일 뿐이라 못 쓴다.
  // 그래서 창이 진짜로 새로 열릴 때만(openWindow, 복원 목표에만 있는 창, 닫은 자리의 콘텐츠 복귀) 자동증가 정수를
  // 민트해서 roleData와 똑같은 모양(Record<number, number>)으로 나란히 들고 다닌다 —
  // normalizeRoles/resolveActiveSlots가 이미 <T> 제네릭이라 그대로 재사용한다.
  const nextWindowIdRef = useRef(0);
  const windowKeysRef = useRef(new Map<number, string>());
  const historyIdAliasesRef = useRef(new Map<string, number>());
  const [exitingWindows, setExitingWindows] = useState<RenderedWindow[]>([]);
  const [roleChangedWindowIds, setRoleChangedWindowIds] = useState<Set<number>>(new Set());
  const windowElementsRef = useRef(new Map<number, HTMLDivElement>());
  const exitTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => () => {
    for (const timer of exitTimersRef.current.values()) clearTimeout(timer);
  }, []);
  // windowId별로 등록된 닫기 확인 함수 — registerCloseGuard로 콘텐츠가 직접 채운다.
  const closeGuardsRef = useRef<Map<number, () => boolean>>(new Map());
  // state가 null이면 아무것도 렌더링 안 하므로(아래 return null) 일반 useRef로는 그 사이에
  // DOM 노드가 생겼다 사라졌다 해도 effect가 다시 안 붙는다 — 콜백 ref로 노드 자체를 상태에
  // 담아서, 노드가 실제로 생길 때마다 측정 effect가 다시 걸리게 한다.
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [overlayWidth, setOverlayWidth] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(0);
  // 최소·최대 너비 사이에 100px 이상 조절 여유가 있고 개인설정이 켜져야 듀얼을 허용한다.
  const { available: dualAvailableWidth, minSlotWidth: dualMinimumWidth } = dualWidths(0.5, overlayWidth, overlayHeight);
  const canGoDual = dualWindowEnabled && dualAvailableWidth - 2 * dualMinimumWidth >= MIN_DUAL_RESIZE_RANGE;
  const [isResizing, setIsResizing] = useState(false);
  // 좌우 전환 버튼을 누른 쪽 창의 windowId — 전환 트랜지션이 진행되는 동안만 그 슬롯을
  // 반대쪽 위로 지나가게 한다. role은 전환 후 normalizeRoles가 다시 1/2로 매기므로
  // 식별자로 못 쓴다 — item.data(이제 windowId, 리마운트 방지에도 쓰는 그 값)로 추적한다.
  const [switchFrontId, setSwitchFrontId] = useState<number | null>(null);
  const switchFrontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (switchFrontTimerRef.current !== null) clearTimeout(switchFrontTimerRef.current);
  }, []);

  // 내려간 슬롯 "들뜨기" — 호버를 낼 수 있는 쪽마다 자기 몫의 변수 하나씩 쓴다(아래 slot
  // 3종 + 스크롤바). 이벤트가 생기면 자기 변수만 갱신하고 공용 액션 함수(recomputeLift)를
  // 부른다 — 그 함수는 등록된 변수 전부를 OR로 묶어서, 하나라도 true면 전체를 들어올리고
  // 전부 false면 내린다. 서로 다른 소스가 서로의 변수를 지우지 않으니(각자 자기 것만 쓴다)
  // "한쪽 소스가 끝날 때 다른 쪽이 이미 걸어둔 들뜸까지 같이 지워지는" 경합이 안 생긴다.
  const hoverSourcesRef = useRef({
    scrollbar: false,
    // 스크롤바 썸을 드래그로 잡고 있는 동안 — 드래그 중엔 커서가 트랙 바깥으로 잠깐 벗어나도
    // (포인터 캡처로 스크롤은 계속됨) 호버와는 별개로 계속 들떠 있어야 하니 독립된 변수를 둔다.
    scrollbarGrabbed: false,
    singleMinimized: false,
    leftMinimized: false,
    rightMinimized: false,
  });
  const [isMinimizedLifted, setIsMinimizedLifted] = useState(false);
  const recomputeLift = useCallback(() => {
    const next = Object.values(hoverSourcesRef.current).some(Boolean);
    setIsMinimizedLifted((current) => (current === next ? current : next));
  }, []);
  const setHoverSource = useCallback((key: keyof typeof hoverSourcesRef.current, hovering: boolean) => {
    hoverSourcesRef.current[key] = hovering;
    recomputeLift();
  }, [recomputeLift]);

  useEffect(() => {
    if (!overlayEl) return;
    let previousSize: { width: number; height: number } | null = null;
    let areaTransitioning = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let restoreFrame = 0;
    const pauseSlotTransitions = () => {
      clearTimeout(settleTimer);
      cancelAnimationFrame(restoreFrame);
      overlayEl.setAttribute("data-available-area-changing", "");
    };
    const restoreSlotTransitions = () => {
      // 마지막 측정값이 창 스타일에 반영된 다음 전환을 다시 켠다.
      cancelAnimationFrame(restoreFrame);
      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = requestAnimationFrame(() => {
          overlayEl.removeAttribute("data-available-area-changing");
        });
      });
    };
    const onTransitionRun = (event: TransitionEvent) => {
      if (event.target !== overlayEl || event.propertyName !== "left") return;
      areaTransitioning = true;
      pauseSlotTransitions();
    };
    const onTransitionFinish = (event: TransitionEvent) => {
      if (event.target !== overlayEl || event.propertyName !== "left") return;
      areaTransitioning = false;
      restoreSlotTransitions();
    };
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (previousSize && (previousSize.width !== width || previousSize.height !== height)) {
        pauseSlotTransitions();
        if (!areaTransitioning) settleTimer = setTimeout(restoreSlotTransitions, 120);
      }
      previousSize = { width, height };
      setOverlayWidth(width);
      setOverlayHeight(height);
    });
    overlayEl.addEventListener("transitionrun", onTransitionRun);
    overlayEl.addEventListener("transitionend", onTransitionFinish);
    overlayEl.addEventListener("transitioncancel", onTransitionFinish);
    observer.observe(overlayEl);
    return () => {
      observer.disconnect();
      clearTimeout(settleTimer);
      cancelAnimationFrame(restoreFrame);
      overlayEl.removeEventListener("transitionrun", onTransitionRun);
      overlayEl.removeEventListener("transitionend", onTransitionFinish);
      overlayEl.removeEventListener("transitioncancel", onTransitionFinish);
      overlayEl.removeAttribute("data-available-area-changing");
    };
  }, [overlayEl]);

  // 최소 폭은 가용 높이 기준으로 유지한다. 듀얼에서는 두 최소 폭을 제외하고도
  // 100px 이상 여유가 있으므로 양쪽 최소 폭과 너비 조절 범위를 함께 보장한다.
  const { available, minSlotWidth, leftWidth, rightWidth } = dualWidths(splitRatio, overlayWidth, overlayHeight);

  // 커밋 직전 windowIds와 비교해서, 이번 커밋으로 사라지는 창(windowId)이 있으면 등록된 확인
  // 함수를 전부 물어본다 — 하나라도 거부하면 커밋 자체를 중단한다(상태 변경 없음).
  function droppedWindowIds(before: Record<number, number>, after: Record<number, number>): number[] {
    const kept = new Set(Object.values(after));
    return Object.values(before).filter((id) => !kept.has(id));
  }
  function confirmDroppedWindows(nextWindowIds: Record<number, number>): boolean {
    for (const id of droppedWindowIds(snapshotRef.current.windowIds, nextWindowIds)) {
      const guard = closeGuardsRef.current.get(id);
      if (guard && !guard()) return false;
    }
    return true;
  }

  function renderedWindowsFor(value: WindowSnapshot): RenderedWindow[] {
    const layout = value.state;
    if (!layout) return [];
    return resolveActiveSlots(value.windowIds, layout, value.mainSide).map<RenderedWindow>((item) => {
      const target = targetForRole(layout, item.role);
      const alone = layout.kind === "Dual" && (target === "dualMain" ? isGap(layout.sub) : isGap(layout.main));
      return {
        windowId: item.data,
        contentKey: value.roleData[item.role],
        slot: item.slot,
        target,
        role: layout.kind === "Single" ? "single" : target === "dualMain" ? "main" : "sub",
        isClosing: false,
        aloneEdgeClass: alone && item.slot === "leftExpanded" ? styles.slotLeftExpandedAlone
          : alone && item.slot === "rightExpanded" ? styles.slotRightExpandedAlone : undefined,
      };
    });
  }

  // 액션 계산과 URL 복원이 모두 목표 상태만 넘긴다. 창 동일성·차이 적용·애니메이션은 여기서 공유한다.
  function applySnapshot(next: WindowSnapshot, options?: { skipCloseGuard?: boolean; frontWindowId?: number }): boolean {
    const before = snapshotRef.current;
    if (!options?.skipCloseGuard && !confirmDroppedWindows(next.windowIds)) return false;
    const keptIds = new Set(Object.values(next.windowIds));
    const beforeWindows = renderedWindowsFor(before);
    const afterWindows = renderedWindowsFor(next);
    // 내리기/올리기는 애니메이션을 유지하고 메인↔서브 역할만 바뀐 창의 높이는 즉시 반영한다.
    setRoleChangedWindowIds(new Set(afterWindows.filter((item) => {
      const previous = beforeWindows.find((window) => window.windowId === item.windowId);
      return previous && previous.role !== item.role
        && previous.role !== "single" && item.role !== "single"
        && MINIMIZED_SLOTS.has(previous.slot) === MINIMIZED_SLOTS.has(item.slot);
    }).map((item) => item.windowId)));
    const removed = beforeWindows.filter((item) => !keptIds.has(item.windowId)).map((item) => {
      const element = windowElementsRef.current.get(item.windowId);
      const rect = element?.getBoundingClientRect();
      const overlayRect = overlayEl?.getBoundingClientRect();
      return {
        ...item,
        isClosing: true,
        // 삭제 API가 목록을 갱신하더라도 닫힘이 끝날 때까지 기존 콘텐츠를 유지한다.
        renderContent,
        style: rect && overlayRect ? {
          left: rect.left - overlayRect.left,
          bottom: overlayRect.bottom - rect.bottom,
          width: rect.width,
          height: rect.height,
        } : undefined,
      };
    });
    // 접근성 트리에서 숨기기 전에 포커스를 이동한다. 닫기·교체·히스토리 복원이 모두 이 경로를 쓴다.
    for (const id of keptIds) windowElementsRef.current.get(id)?.removeAttribute("inert");
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && removed.some((item) => windowElementsRef.current.get(item.windowId)?.contains(focused))) {
      const remaining = [...afterWindows].sort((a, b) => Number(a.role === "sub") - Number(b.role === "sub"))
        .map((item) => windowElementsRef.current.get(item.windowId))
        .find((element) => element !== undefined);
      const focusTarget = remaining?.querySelector<HTMLButtonElement>(".js-window-header button:not(:disabled)")
        ?? remaining ?? overlayEl?.parentElement;
      if (focusTarget) {
        const previousTabIndex = focusTarget.getAttribute("tabindex");
        focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        if (previousTabIndex === null) focusTarget.removeAttribute("tabindex");
        else focusTarget.setAttribute("tabindex", previousTabIndex);
      }
      // 대상이 포커스를 받지 못하더라도 닫히는 창에 포커스를 남기지 않는다.
      if (document.activeElement === focused) focused.blur();
    }
    for (const item of removed) windowElementsRef.current.get(item.windowId)?.setAttribute("inert", "");
    // 빠른 뒤로/앞으로가기에서 닫히는 중인 창이 다시 필요해지면 제거를 취소하고 같은 DOM을 유지한다.
    for (const id of keptIds) {
      const timer = exitTimersRef.current.get(id);
      if (timer !== undefined) clearTimeout(timer);
      exitTimersRef.current.delete(id);
    }
    setExitingWindows((current) => [
      ...current.filter((item) => !keptIds.has(item.windowId) && !removed.some((drop) => drop.windowId === item.windowId)),
      ...removed,
    ]);
    for (const item of removed) {
      const previousTimer = exitTimersRef.current.get(item.windowId);
      if (previousTimer !== undefined) clearTimeout(previousTimer);
      exitTimersRef.current.set(item.windowId, setTimeout(() => {
        setExitingWindows((current) => current.filter((value) => value.windowId !== item.windowId));
        closeGuardsRef.current.delete(item.windowId);
        exitTimersRef.current.delete(item.windowId);
      }, CLOSE_ANIMATION_MS));
    }
    const crossed = afterWindows.find((item) => {
      const previous = beforeWindows.find((old) => old.windowId === item.windowId);
      return previous && ((previous.slot.startsWith("left") && item.slot.startsWith("right"))
        || (previous.slot.startsWith("right") && item.slot.startsWith("left")));
    });
    if (crossed) {
      setSwitchFrontId(options?.frontWindowId ?? crossed.windowId);
      if (switchFrontTimerRef.current !== null) clearTimeout(switchFrontTimerRef.current);
      switchFrontTimerRef.current = setTimeout(() => setSwitchFrontId(null), SWITCH_ANIMATION_MS);
    }
    snapshotRef.current = next;
    setMainSide(next.mainSide);
    for (const [role, id] of Object.entries(next.windowIds)) {
      windowKeysRef.current.set(id, next.roleData[Number(role)]);
    }
    setSnapshot(next);
    onMainCardChange(mainCardId(next.state, next.roleData));
    return true;
  }

  function updateHistory(before: WindowSnapshot, next: WindowSnapshot) {
    const history = windowHistoryState(next);
    const previousHash = encodeWindowHash(before.state, before.roleData);
    onHashChange(history.hash, history.hash === previousHash ? "replace" : "push", history);
  }

  // 자동 리사이즈만 닫힘 확인을 생략한다. 해시가 달라지는 일반 조작은 전부 push한다.
  const commit = (raw: LayoutState | null, mergedRoleData: Record<number, string>, mergedWindowIds: Record<number, number>, options?: { skipCloseGuard?: boolean; frontWindowId?: number; splitRatio?: number; mainSide?: "left" | "right" }) => {
    const before = snapshotRef.current;
    const normalized = raw === null ? { state: null, roleData: {} } : normalizeRoles(raw, mergedRoleData);
    const next: WindowSnapshot = {
      ...normalized,
      windowIds: raw === null ? {} : normalizeRoles(raw, mergedWindowIds).roleData,
      splitRatio: options?.splitRatio ?? before.splitRatio,
      mainSide: options?.mainSide ?? before.mainSide,
    };
    if (!applySnapshot(next, options)) return;
    updateHistory(before, next);
  };

  const applyAction = (action: WindowAction, frontWindowId?: number) => {
    if (state === null) return;
    commit(applyWindowAction(state, action), roleData, windowIds, { frontWindowId });
  };

  const sendToSide = (side: "left" | "right") => {
    const current = snapshotRef.current;
    if (!canGoDual || current.state?.kind !== "Single") return;
    // 선택한 방향을 메인으로 정한 뒤 기존의 "메인으로 보내기" 상태 매핑을 사용한다.
    const ratio = side === "left" ? 0.51 : 0.49;
    const next = applyWindowAction(current.state, { type: "sendToRole", target: "main" });
    commit(next, current.roleData, current.windowIds, { splitRatio: ratio, mainSide: side });
    onSplitRatioCommit?.(ratio);
  };

  const moveToEmptySide = (frontWindowId: number) => {
    const current = snapshotRef.current;
    if (current.state?.kind !== "Dual") return;
    const { main, sub } = current.state;
    const occupant = typeof main === "number" && sub === "Empty" ? main
      : main === "Empty" && typeof sub === "number" ? sub : null;
    if (occupant === null) return;
    const side = typeof main === "number"
      ? (current.mainSide === "left" ? "right" : "left") : current.mainSide;
    const mainRatio = current.mainSide === "left" ? current.splitRatio : 1 - current.splitRatio;
    const ratio = side === "left" ? mainRatio : 1 - mainRatio;
    commit({ kind: "Dual", main: occupant, sub: "Empty" }, current.roleData, current.windowIds,
      { splitRatio: ratio, mainSide: side, frontWindowId });
    onSplitRatioCommit?.(ratio);
  };

  function mainSideForSplit(ratio: number): "left" | "right" {
    const widths = dualWidths(ratio, overlayWidth, overlayHeight);
    if (widths.available <= 0 || overlayHeight <= 0) return ratio >= 0.5 ? "left" : "right";
    return widths.leftWidth >= widths.rightWidth ? "left" : "right";
  }

  function reassignMainSide(value: WindowSnapshot, nextSide: "left" | "right"): WindowSnapshot {
    if (value.mainSide === nextSide || value.state?.kind !== "Dual") return { ...value, mainSide: nextSide };
    // 크기 조절은 내용 교환이 아니라 메인/서브 역할 이름만 다시 붙이는 작업이다.
    // 부호(내림 상태)와 Empty까지 함께 재배정해야 mainSide가 바뀌어도 물리적 좌우는 유지된다.
    // 사용자 교환 액션은 부호를 슬롯에 남기므로 여기에서 재사용하지 않는다.
    const switched: LayoutState = { kind: "Dual", main: value.state.sub, sub: value.state.main };
    return {
      ...value,
      ...normalizeRoles(switched, value.roleData),
      windowIds: normalizeRoles(switched, value.windowIds).roleData,
      mainSide: nextSide,
    };
  }

  function resizeSplit(ratio: number) {
    const current = snapshotRef.current;
    const next = reassignMainSide({ ...current, splitRatio: ratio }, mainSideForSplit(ratio));
    if (next.splitRatio === current.splitRatio && next.mainSide === current.mainSide) return;
    // 드래그 중에는 화면만 갱신하고 종료 시 시작 상태와 비교해 히스토리를 한 번 저장한다.
    if (resizeSessionRef.current) {
      applySnapshot(next);
      return;
    }
    commit(next.state, next.roleData, next.windowIds, { splitRatio: next.splitRatio, mainSide: next.mainSide });
  }

  // 화면 변화로 최소 폭에 걸려 양쪽이 같아지는 경우도 왼쪽을 메인으로 정한다.
  useEffect(() => {
    if (canGoDual && overlayWidth > 0 && overlayHeight > 0) resizeSplit(snapshotRef.current.splitRatio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayWidth, overlayHeight, canGoDual]);

  useImperativeHandle(ref, () => ({
    getHistoryState: () => windowHistoryState(snapshotRef.current),
    openWindow: (key: string, options) => {
      // 기본 새 창 배치는 듀얼이고, 출발 창 교체 요청은 그 자리를 유지한다. 가용 영역이
      // 최소·최대 너비 차이가 부족해 듀얼이 불가능하면(§6-2) 기존 창을 교체하는 싱글로 직접 연다.
      // 복원(뒤로/앞으로가기, 직접 진입)은 이 함수를 쓰지 않는다 — syncFromHash가 해시에
      // 담긴 상태를 그대로 복원하므로, 여기서는 "사용자가 지금 이 카드나 파일을 클릭해서
      // 새로 연다"는 경우만 다룬다.
      // applyWindowAction은 "new"를 state===null에서도 받아주는 유일한 액션이라, 결과가
      // null일 수 없다("new"가 null을 반환하는 경우는 없다 — null은 레이어가 닫힐 때만 나온다).
      const nextState: LayoutState = canGoDual
        ? (applyWindowAction(state, { type: "new", source: options?.replaceFrom }) as LayoutState)
        : { kind: "Single", occupant: 3 };
      // 새 창을 여는 경우다 — 이동/리사이즈/전환은 기존 id를 그대로
      // 들고 간다(commit이 normalizeRoles로 재배정만 할 뿐, 이 Record에 없던 role엔 id를
      // 새로 만들지 않는다).
      commit(nextState, { ...roleData, 3: key }, { ...windowIds, 3: nextWindowIdRef.current++ });
    },
    closeCardIfOpen: (cardId: string) => {
      if (state === null) return;
      const entry = Object.entries(roleData).find(([, id]) => id === cardId);
      if (!entry) return;
      const target = targetForRole(state, Number(entry[0]));
      commit(applyCloseWindow(state, target), roleData, windowIds);
    },
    syncFromHash: (hash: string, savedHistory?: unknown) => {
      let decoded = decodeWindowHash(hash);
      let rejectedContent = false;
      while (decoded.state !== null) {
        const unsupported = Object.entries(decoded.roleData).find(([, key]) => !isSupportedContent(key));
        if (!unsupported) break;
        rejectedContent = true;
        const target = targetForRole(decoded.state, Number(unsupported[0]));
        const next = applyCloseWindow(decoded.state, target);
        decoded = next === null ? { state: null, roleData: {} } : normalizeRoles(next, decoded.roleData);
      }
      if (rejectedContent) onUnsupportedContent();
      const canonicalHash = encodeWindowHash(decoded.state, decoded.roleData);
      const history = readWindowHistory(savedHistory, canonicalHash, decoded.roleData);
      if (history) {
        for (const id of Object.values(history.windowIds)) {
          nextWindowIdRef.current = Math.max(nextWindowIdRef.current, id + 1);
        }
      }
      const current = snapshotRef.current;
      let next: WindowSnapshot = {
        ...decoded,
        splitRatio: history?.splitRatio ?? current.splitRatio,
        mainSide: history?.mainSide ?? current.mainSide,
        windowIds: restoreWindowIds(current, decoded.roleData, history, () => nextWindowIdRef.current++, (id, key) => {
          // 페이지를 나갔다 재진입한 뒤 예전 히스토리의 ID가 다른 콘텐츠에 쓰였을 수 있다.
          // 충돌하는 ID만 별칭을 부여하고 같은 항목을 다시 복원할 때도 그 별칭을 유지한다.
          const aliasKey = `${id}:${key}`;
          const alias = historyIdAliasesRef.current.get(aliasKey);
          if (alias !== undefined) return alias;
          const previousKey = windowKeysRef.current.get(id);
          if (previousKey === undefined || previousKey === key) return id;
          const replacement = nextWindowIdRef.current++;
          historyIdAliasesRef.current.set(aliasKey, replacement);
          return replacement;
        }),
      };
      next = reassignMainSide(next, mainSideForSplit(next.splitRatio));
      const sameIds = Object.entries(next.windowIds).every(([role, id]) => current.windowIds[Number(role)] === id);
      const sameGeometry = next.splitRatio === current.splitRatio && next.mainSide === current.mainSide;
      if (!(layoutSnapshotEquals(next, current) && sameIds && sameGeometry) && !applySnapshot(next)) return false;
      // 직접 진입·공유 URL에는 ID가 없으므로 현재 항목에만 보충한다. 복원 자체는 push하지 않는다.
      const sameSavedIds = history && Object.entries(next.windowIds).every(([role, id]) => history.windowIds[Number(role)] === id);
      const restoredHash = encodeWindowHash(next.state, next.roleData);
      if (!sameSavedIds || history?.splitRatio !== next.splitRatio || history?.mainSide !== next.mainSide || restoredHash !== hash) {
        onHashChange(restoredHash, "replace", windowHistoryState(next));
      }
      return true;
    },
    requestMinimizedHover: (request: MinimizedHoverRequest) => {
      setHoverSource("scrollbar", request.hovering);
    },
    setScrollbarGrabbed: (grabbed: boolean) => {
      setHoverSource("scrollbarGrabbed", grabbed);
    },
  }), [state, roleData, windowIds, canGoDual, onMainCardChange, onHashChange, setHoverSource, splitRatio, mainSide, overlayWidth, overlayHeight, isSupportedContent, onUnsupportedContent]);

  // 화면이 좁아지면 듀얼을 싱글로 되돌린다(되돌릴 수 없는 전환 — 나중에 다시 넓어져도 자동으로
  // 복귀하지 않는다. §5 펼치기의 "의도 유지"와 다르다). 싱글은 canGoDual과 무관하므로
  // 건드리지 않는다.
  const prevCanGoDualRef = useRef(canGoDual);
  useEffect(() => {
    if (prevCanGoDualRef.current && !canGoDual && state?.kind === "Dual") {
      // applyExpand는 "반대쪽을 버리고 이쪽을 싱글로"를 양쪽 다 실제 창인 경우(EXPAND_MAP의
      // dualMain:Dual(1,2) 같은 항목)까지 이미 다 커버한다 — 반대쪽이 빈 슬롯뿐인 경우와
      // 다른 함수로 나눌 필요가 없다. 메인이 실제 창이면 메인 기준, 아니면(=서브가 실제 창)
      // 서브 기준으로 펼친다.
      const target = typeof state.main === "number" ? "dualMain" : "dualSub";
      commit(applyWindowAction(state, { type: "expand", target }), roleData, windowIds, { skipCloseGuard: true });
    }
    prevCanGoDualRef.current = canGoDual;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGoDual]);

  const active = useMemo(() => resolveActiveSlots(windowIds, state), [windowIds, state, mainSide]);
  const emptySlot = locateEmptySlot(state);

  const isClickThrough = hasPassthroughGap(state);

  // 반대쪽이 가리지 않는 상태(빈 슬롯이거나 내려감)이고 이쪽이 실제로 펼쳐져 있을 때만
  // 칸반을 가린다 — 양쪽 다 펼쳐진 실제 창이면 어느 쪽도 "유일하게 가리는 쪽"이 아니라서
  // 이 함수의 범위 밖이다(그 경우는 커버리지 없음, null 유지).
  const coverage: WindowCoverage | null = useMemo(() => {
    if (state === null || state.kind !== "Dual") return null;
    // 드래그로 좌우 폭이 달라질 수 있으니, 가리는 쪽의 실제 렌더 폭(leftWidth/rightWidth)을
    // 그대로 써야 한다 — 고정 50:50 폭을 쓰면 비율을 치우친 뒤 칸반 스크롤 여유 계산이 어긋난다.
    if (isGap(state.main) && typeof state.sub === "number" && state.sub > 0) {
      const side = sideForRole("sub");
      return { side, widthPx: side === "left" ? leftWidth : rightWidth };
    }
    if (isGap(state.sub) && typeof state.main === "number" && state.main > 0) {
      const side = sideForRole("main");
      return { side, widthPx: side === "left" ? leftWidth : rightWidth };
    }
    return null;
  }, [state, leftWidth, rightWidth, mainSide]);

  useEffect(() => {
    onCoverageChange?.(coverage);
  }, [coverage, onCoverageChange]);

  const windowsGroupRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const outsidePressRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null);

  // 레이어 밖으로 나갔다 돌아와도 드래그한 사실을 유지해 클릭에서 제외한다.
  useEffect(() => {
    const trackMovement = (event: PointerEvent) => {
      const press = outsidePressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > OUTSIDE_CLICK_MOVE_THRESHOLD) {
        press.moved = true;
      }
    };
    const clearPress = () => { outsidePressRef.current = null; };
    document.addEventListener("pointermove", trackMovement, true);
    document.addEventListener("pointerup", clearPress);
    document.addEventListener("pointercancel", clearPress, true);
    document.addEventListener("dragstart", clearPress, true);
    window.addEventListener("blur", clearPress);
    return () => {
      document.removeEventListener("pointermove", trackMovement, true);
      document.removeEventListener("pointerup", clearPress);
      document.removeEventListener("pointercancel", clearPress, true);
      document.removeEventListener("dragstart", clearPress, true);
      window.removeEventListener("blur", clearPress);
    };
  }, []);

  // "바깥" 클릭만 다룬다 — 창 자체(헤더 포함) 안에서 일어난 클릭이 버블링돼 올라온 거면
  // 무시한다. 안 그러면 펼쳐진 창 헤더(내려가 있지 않을 땐 자기 onClick이 없다)를 눌렀을 때
  // 이벤트가 여기까지 올라와서 "바깥 클릭"으로 오인되어 둘 다 내려가 버린다.
  //
  // 정렬 메뉴·담당자 선택 같은 Popover(RecordSortMenu, AssigneePicker 등)는 Chakra <Portal>로
  // 내용을 DOM 트리 밖(보통 body 근처)에 그린다 — React는 synthetic event를 리액트 트리
  // 기준으로 버블시켜 이 핸들러까지 올라오지만, windowsGroupRef.contains()는 실제 DOM 트리
  // 기준이라 포털 안 클릭은 "창 바깥"으로 오판된다. Popover의 role="dialog"와
  // 언어 선택 등 Menu의 role="menu"를 따로 걸러낸다. Dialog의 배경·Positioner도 제외해서
  // 모달을 닫는 바깥 클릭이 창 최소화까지 이어지지 않게 한다. 리사이즈 핸들(두 창 사이)도
  // windowsGroup 바깥의 형제 엘리먼트라 따로 걸러줘야 한다 — 안 그러면 드래그 없이 그냥
  // 클릭(또는 드래그 종료의 click 이벤트)만 해도 "바깥 클릭"으로 오인돼 둘 다 내려간다.
  const isOutsideTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (windowsGroupRef.current?.contains(target)) return false;
    if (resizeHandleRef.current?.contains(target)) return false;
    if (target.closest('[role="dialog"], [role="menu"], button')) return false;
    if (target.closest('[data-scope="dialog"][data-part="backdrop"], [data-scope="dialog"][data-part="positioner"]')) return false;
    return true;
  };

  const closeWindow = (target: WindowTarget, options?: { restoreContentKey: string }) => {
    if (state === null) return;
    if (!options) {
      applyAction({ type: "close", target });
      return;
    }
    // 복귀할 콘텐츠가 이미 열려 있으면 기존 창 id를 유지하고 닫기 패치에서 펼친다.
    const existing = Object.entries(roleData).find(([role, key]) => (
      key === options.restoreContentKey && targetForRole(state, Number(role)) !== target
    ));
    const restoreRole = (existing ? Number(existing[0]) : 3) as SignedRole;
    const restoredWindowId = existing ? windowIds[restoreRole] : nextWindowIdRef.current++;
    const next = applyWindowAction(state, { type: "close", target, restoreRole });
    commit(next, { ...roleData, [restoreRole]: options.restoreContentKey }, { ...windowIds, [restoreRole]: restoredWindowId });
  };

  const handleOutsidePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    outsidePressRef.current = null;
    if (isClickThrough || state === null || !event.isPrimary || event.button !== 0 || !isOutsideTarget(event.target)) return;
    outsidePressRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  };

  const handleOutsidePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const press = outsidePressRef.current;
    outsidePressRef.current = null;
    if (!press || press.pointerId !== event.pointerId || press.moved || event.button !== 0) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > OUTSIDE_CLICK_MOVE_THRESHOLD) return;
    // 터치의 암묵적 포인터 캡처로 target이 누른 요소에 고정돼도 실제 뗀 위치를 검사한다.
    const releaseTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (isClickThrough || state === null || !isOutsideTarget(releaseTarget)) return;
    let next: LayoutState | null = state;
    for (const item of active) {
      if (!BLOCKING_SLOTS.has(item.slot) || next === null) continue;
      next = applyWindowAction(next, { type: "minimize", target: targetForRole(next, item.role) });
    }
    commit(next, roleData, windowIds);
  };

  const bothMinimized = state?.kind === "Dual"
    && typeof state.main === "number" && state.main < 0
    && typeof state.sub === "number" && state.sub < 0;
  const bothExpanded = state?.kind === "Dual"
    && typeof state.main === "number" && state.main > 0
    && typeof state.sub === "number" && state.sub > 0;

  const handleRestoreBoth = () => {
    if (state === null || state.kind !== "Dual") return;
    let next: LayoutState = state;
    for (const item of active) {
      if (!MINIMIZED_SLOTS.has(item.slot)) continue;
      next = applyRaise(next, targetForRole(next, item.role));
    }
    commit(next, roleData, windowIds);
  };

  const handleMinimizeBoth = () => {
    if (state === null || state.kind !== "Dual") return;
    let next: LayoutState | null = state;
    for (const item of active) {
      if (!BLOCKING_SLOTS.has(item.slot) || next === null) continue;
      next = applyWindowAction(next, { type: "minimize", target: targetForRole(next, item.role) });
    }
    commit(next, roleData, windowIds);
  };

  // 듀얼이고 "양쪽 다 내려감"만 아니면(둘 다 펼침 / 한쪽만 펼침+반대 내려감 / 한쪽만
  // 펼침+반대 빈 슬롯, 3가지 전부) 드래그 핸들을 띄운다. 위치는 항상 일반 배치 기준
  // (content-inset)이다 — "혼자일 때 가장자리로 더 붙이기"(slotLeftExpandedAlone 등)는
  // 벽과의 거리(위치)만 바꾸는 별개 메커니즘이고, 이 비율은 폭만 정하므로 서로 안 건드린다.
  const showResizeHandle = state?.kind === "Dual" && !bothMinimized;
  const resizeSessionRef = useRef<{ pointerId: number; initialSnapshot: WindowSnapshot; pointerOffsetX: number; userSelect: string } | null>(null);
  useEffect(() => () => {
    const session = resizeSessionRef.current;
    if (!session) return;
    document.body.style.userSelect = session.userSelect;
    document.documentElement.removeAttribute("data-window-split-resizing");
  }, []);

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || resizeSessionRef.current || !overlayEl || available <= 0) return;
    const rect = overlayEl.getBoundingClientRect();
    // 실제 잡은 위치와 비율상의 경계 사이 차이를 유지한다. 단독 창의 위치 보정,
    // 핸들 안의 클릭 위치, 최소 폭 제한으로 경계가 이동해도 시작 너비가 튀지 않는다.
    const pointerOffsetX = event.clientX - rect.left - CONTENT_INSET - DUAL_GAP / 2
      - snapshotRef.current.splitRatio * available;
    resizeSessionRef.current = {
      pointerId: event.pointerId,
      initialSnapshot: snapshotRef.current,
      pointerOffsetX,
      userSelect: document.body.style.userSelect,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.documentElement.setAttribute("data-window-split-resizing", "");
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = resizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId || !overlayEl || available <= 0) return;
    const rect = overlayEl.getBoundingClientRect();
    const x = event.clientX - rect.left - CONTENT_INSET - DUAL_GAP / 2 - session.pointerOffsetX;
    // 저장 비율은 사용자의 선택값이고 최소 폭 제한은 dualWidths에서 렌더링에만 적용한다.
    const ratio = Math.min(1, Math.max(0, x / available));
    resizeSplit(ratio);
  };

  const endResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = resizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    resizeSessionRef.current = null;
    setIsResizing(false);
    document.body.style.userSelect = session.userSelect;
    document.documentElement.removeAttribute("data-window-split-resizing");
    if (event.type === "pointerup") {
      const next = snapshotRef.current;
      const initial = session.initialSnapshot;
      if (next.splitRatio !== initial.splitRatio || next.mainSide !== initial.mainSide) {
        updateHistory(initial, next);
      }
      if (next.splitRatio !== initial.splitRatio) onSplitRatioCommit?.(next.splitRatio);
    } else {
      applySnapshot(session.initialSnapshot);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (state === null && exitingWindows.length === 0) return null;

  const overlayStyle = {
    "--dual-split-ratio": splitRatio,
    "--dual-min-slot-width": `${minSlotWidth}px`,
    "--divider-left": coverage?.side === "left"
      ? "calc(var(--content-inset) / 2 + var(--dual-slot-width-left) + var(--dual-gap) / 2)"
      : coverage?.side === "right"
      ? "calc(100% - var(--content-inset) / 2 - var(--dual-slot-width-right) - var(--dual-gap) / 2)"
      : "calc(var(--content-inset) + var(--dual-slot-width-left) + var(--dual-gap) / 2)",
  } as CSSProperties;
  // 두 슬롯 "사이" 중앙선 — 리사이즈 핸들과 "모두 올리기/내리기" 버튼(.midGapZone)이 같이
  // 쓴다. 혼자일 때는 그 창 자체가 가장자리로 붙어 있으므로(slotLeftExpandedAlone 등,
  // content-inset/2) 중앙선도 그 붙은 창의 실제 가장자리를 따라가야
  // 한다 — 안 그러면 핸들이 창에서 동떨어진, 아무 의미 없는 자리에 남는다. 비율이 위치를
  // 만들어내는 게 아니라(그건 여전히 width만 결정한다), 핸들이 "이미 정해진 창 위치"를
  // 그대로 따라가는 것뿐이다.

  return (
    <div
      ref={setOverlayEl}
      data-window-layer=""
      data-resizing={isResizing}
      className={cn(styles.overlay, isClickThrough ? styles.overlayClickThrough : undefined, isResizing ? styles.overlayDragging : undefined)}
      style={overlayStyle}
      onPointerDownCapture={handleOutsidePointerDown}
      onPointerUpCapture={handleOutsidePointerUp}
    >
      <div
        className={cn(
          styles.overlayDim,
          isDashboardExpanded ? styles.overlayDimSquareLeft : undefined,
          isClickThrough ? styles.overlayDimHidden : undefined,
        )}
      />

      {emptySlot && <div className={cn(styles.slot, SLOT_CLASS[emptySlot], styles.emptySlot)} aria-hidden="true" />}

      <div ref={windowsGroupRef} className={styles.windowsGroup}>
        {[...renderedWindowsFor(snapshot), ...exitingWindows].map((item) => {
          const minimized = MINIMIZED_SLOTS.has(item.slot);
          const { target, role, contentKey, windowId, isClosing } = item;
          const otherSideEmpty = snapshot.state?.kind === "Dual"
            && (target === "dualMain" ? snapshot.state.sub === "Empty" : snapshot.state.main === "Empty");
          const binding: WindowBinding = {
            role,
            minimized,
            isClosing,
            canGoDual,
            otherSideEmpty,
            onToggleMinimize: () => { if (!isClosing) applyAction(minimized ? { type: "raise", target } : { type: "minimize", target }); },
            onClose: (options) => { if (!isClosing) closeWindow(target, options); },
            onSwitchSide: () => {
              if (isClosing) return;
              if (otherSideEmpty) moveToEmptySide(windowId);
              else applyAction({ type: "switch" }, windowId);
            },
            onExpand: () => { if (!isClosing) applyAction({ type: "expand", target: target as DualTarget }); },
            onSendToSide: (side) => { if (!isClosing) sendToSide(side); },
            registerCloseGuard: (confirmClose) => {
              if (isClosing) return;
              if (confirmClose) closeGuardsRef.current.set(windowId, confirmClose);
              else closeGuardsRef.current.delete(windowId);
            },
          };
          // 반대쪽이 비었거나 내려가 있어서 이 창 혼자 칸반을 가리고 있을 때(coverage와 같은
          // 조건), 폭은 그대로 두고 자기 쪽 가장자리로 더 밀착시켜 칸반이 보이는 틈을 넓힌다.
          const aloneEdgeClass = item.aloneEdgeClass;
          return (
            <div
              key={windowId}
              ref={(element) => {
                if (element) {
                  windowElementsRef.current.set(windowId, element);
                  element.toggleAttribute("inert", isClosing);
                } else windowElementsRef.current.delete(windowId);
              }}
              style={item.style}
              className={cn(
                styles.slot,
                SLOT_CLASS[item.slot],
                role === "sub" && !minimized ? styles.slotSubExpanded : undefined,
                roleChangedWindowIds.has(windowId) ? styles.slotRoleChanged : undefined,
                aloneEdgeClass,
                windowId === switchFrontId ? styles.slotFront : undefined,
                minimized && isMinimizedLifted ? styles.slotLifted : undefined,
              )}
              // 버튼(최소화/닫기) 위에서는 들어올리지 않는다 — 기존 :hover:not(:has(button:hover))
              // 와 같은 예외를 그대로 유지한다. pointerenter/leave는 버블링 중 하위 요소 전환을
              // 구분 못 해서(슬롯에 들어온 뒤로 계속 "진입 상태") pointermove로 매번 커서
              // 아래가 버튼인지 확인한다. item.slot은 minimized일 때만 singleMinimized/
              // leftMinimized/rightMinimized 중 하나라 hoverSourcesRef의 키와 그대로 맞는다.
              onPointerMove={minimized ? (event) => {
                const overButton = !!(event.target as HTMLElement).closest("button");
                setHoverSource(item.slot as "singleMinimized" | "leftMinimized" | "rightMinimized", !overButton);
              } : undefined}
              onPointerLeave={minimized ? () => setHoverSource(item.slot as "singleMinimized" | "leftMinimized" | "rightMinimized", false) : undefined}
            >
              {(item.renderContent ?? renderContent)(contentKey, binding)}
            </div>
          );
        })}
      </div>

      {bothMinimized && (
        <button
          type="button"
          className={cn(styles.midGapZone, styles.midGapZoneBottom)}
          style={{ left: "var(--divider-left)" }}
          aria-label="두 창 모두 올리기"
          onClick={handleRestoreBoth}
        />
      )}
      {bothExpanded && (
        <button
          type="button"
          className={cn(styles.midGapZone, styles.midGapZoneTop)}
          style={{ left: "var(--divider-left)" }}
          aria-label="두 창 모두 내리기"
          onClick={handleMinimizeBoth}
        />
      )}

      {showResizeHandle && (
        <div
          ref={resizeHandleRef}
          className={styles.resizeHandle}
          style={{ left: "var(--divider-left)" }}
          aria-hidden="true"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onLostPointerCapture={endResize}
        />
      )}
    </div>
  );
});

export default WindowLayer;
