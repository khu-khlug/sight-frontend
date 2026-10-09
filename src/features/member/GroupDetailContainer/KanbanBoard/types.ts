import type { RefObject } from "react";
import type { KanbanListDto } from "../../../../api/public/group/KanbanApi";
import type { MinimizedHoverRequest } from "../actions";
import type { LabelFilterKey } from "../label";
import type { WindowCoverage } from "../WindowLayer";

export type CardListData = KanbanListDto;

export type Props = {
  lists: CardListData[];
  isMovePending: boolean;
  isPortfolioPublished: boolean;
  dashboardOverlayRef: RefObject<HTMLDivElement>;
  dashboardExtraWidthPx: number;
  enabledFilters?: Set<LabelFilterKey>;
  // 카드 창이 리스트들을 가리고 있을 때, 가려진 쪽과 그 폭 — 그쪽 끝에 자리 차지용 빈 요소를
  // 추가해 스크롤로 가려진 리스트까지 닿을 수 있게 한다(KanbanBoard/index.tsx).
  windowCoverage?: WindowCoverage | null;
  // 내려간 창이 있으면서 동시에 이 가로 스크롤바 자리와도 좌표가 겹칠 때(KanbanBoard/index.tsx의
  // pointermove 판정) 호출된다 — 스크롤바가 z-index로 헤더보다 위로 올라와 네이티브 :hover로는
  // 더 이상 "헤더 들뜨기"를 걸 수 없어서, WindowOpenRequest와 같은 패턴으로 요청만 넘기면
  // 호출부(GroupDetailContainer)가 WindowLayerHandle.requestMinimizedHover로 중계한다.
  onMinimizedHoverRequest?: (request: MinimizedHoverRequest) => void;
  // 가로 스크롤바 썸을 드래그로 잡고 있는 동안(zag-js가 트랙/썸에 붙이는 data-scrolling
  // 속성) 호출된다 — 드래그 중엔 커서가 트랙 밖으로 잠깐 나가도 좌표 기반 호버 판정과
  // 무관하게 계속 들떠 있어야 해서, 호버와는 별개 소스로 WindowLayerHandle.setScrollbarGrabbed
  // 에 전달한다.
  onScrollbarGrabbedChange?: (grabbed: boolean) => void;
  onAddCard: (listId: string, title: string) => void;
  onAddList: (title: string) => void;
  onDeleteList: (listId: string) => void | Promise<void>;
  onMoveList: (listId: string, targetIndex: number) => void;
  onMoveCard: (sourceListId: string, cardId: string, targetListId: string, targetIndex: number) => void;
  onToggleCardPortfolio: (listId: string, cardId: string) => void;
  onCardClick: (cardId: string) => void;
  onUpdateList: (listId: string, changes: { title: string; description: string }) => void;
};

