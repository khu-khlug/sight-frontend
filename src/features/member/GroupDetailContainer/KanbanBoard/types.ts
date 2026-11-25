import type { RefObject } from "react";
import type { KanbanListDto } from "../../../../api/public/group/KanbanApi";
import type { LabelFilterKey } from "../label";
import type { WindowCoverage } from "../WindowLayer";

export type CardListData = KanbanListDto;

export type Props = {
  lists: CardListData[];
  // 리스트는 가로로 끝까지 스크롤하면, 카드는 리스트마다 세로로 끝까지 스크롤하면 이어서 불러온다.
  hasMoreLists: boolean;
  isLoadingMoreLists: boolean;
  onLoadMoreLists: () => void;
  loadingCardListIds: ReadonlySet<string>;
  onLoadMoreCards: (listId: string) => void;
  isMovePending: boolean;
  // 종료 그룹이면 리스트·카드 추가 입력을 숨긴다.
  isReadOnly?: boolean;
  isPortfolioPublished: boolean;
  dashboardOverlayRef: RefObject<HTMLDivElement>;
  dashboardExtraWidthPx: number;
  enabledFilters?: Set<LabelFilterKey>;
  // 카드 창이 리스트들을 가리고 있을 때, 가려진 쪽과 그 폭 — 그쪽 끝에 자리 차지용 빈 요소를
  // 추가해 스크롤로 가려진 리스트까지 닿을 수 있게 한다(KanbanBoard/index.tsx).
  windowCoverage?: WindowCoverage | null;
  onAddCard: (listId: string, title: string) => void | Promise<void>;
  onAddList: (title: string) => void | Promise<void>;
  onDeleteList: (listId: string) => void | Promise<void>;
  onMoveList: (listId: string, targetIndex: number) => void;
  onMoveCard: (sourceListId: string, cardId: string, targetListId: string, targetIndex: number) => void;
  onToggleCardPortfolio: (listId: string, cardId: string) => void;
  onCardClick: (cardId: string) => void;
  onUpdateList: (listId: string, changes: { title: string; description: string }) => void | Promise<void>;
};

