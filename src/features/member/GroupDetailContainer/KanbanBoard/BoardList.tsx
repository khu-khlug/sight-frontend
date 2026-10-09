import { memo, useCallback, useMemo, type PointerEvent as ReactPointerEvent } from "react";
import CardList from "../CardList";
import type { LabelFilterKey } from "../label";
import type { CardListData, Props } from "./types";
import styles from "./style.module.css";

const noop = () => undefined;

export const DraggedListContent = memo(function DraggedListContent({ list, isPortfolioPublished, enabledFilters }: {
  list: CardListData;
  isPortfolioPublished: boolean;
  enabledFilters: Set<LabelFilterKey>;
}) {
  return (
    <CardList
      title={list.title}
      description={list.description}
      isPortfolioPublished={isPortfolioPublished}
      cards={list.cards}
      enabledFilters={enabledFilters}
      onAddCard={noop}
      onDeleteStart={noop}
      onDeleteList={noop}
      onUpdateList={noop}
      onCardClick={noop}
    />
  );
});

type BoardListProps = {
  list: CardListData;
  index: number;
  offset: number;
  isListDragActive: boolean;
  isDraggedList: boolean;
  isNew: boolean;
  isDeleting: boolean;
  isPlaced: boolean;
  sourceCardId?: string;
  dropIndex?: number;
  dropHeight?: number;
  placedCardId?: string;
  isPortfolioPublished: boolean;
  enabledFilters: Set<LabelFilterKey>;
  onAddCard: Props["onAddCard"];
  onDeleteStart: (listId: string) => void;
  onDeleteList: Props["onDeleteList"];
  onToggleCardPortfolio: Props["onToggleCardPortfolio"];
  onCardClick: Props["onCardClick"];
  onUpdateList: Props["onUpdateList"];
  onListHandlePointerDown: (event: ReactPointerEvent<HTMLButtonElement>, id: string, index: number) => void;
  onListHandleKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, id: string, index: number) => void;
  onCardHandlePointerDown: (event: ReactPointerEvent<HTMLButtonElement>, listId: string, cardId: string, cardIndex: number) => void;
  onCardHandleKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, listId: string, cardId: string, cardIndex: number) => void;
};

export const BoardList = memo(function BoardList({ list, index, offset, isListDragActive, isDraggedList, isNew, isDeleting, isPlaced, sourceCardId, dropIndex, dropHeight, placedCardId, isPortfolioPublished, enabledFilters, onAddCard, onDeleteStart, onDeleteList, onToggleCardPortfolio, onCardClick, onUpdateList, onListHandlePointerDown, onListHandleKeyDown, onCardHandlePointerDown, onCardHandleKeyDown }: BoardListProps) {
  const cards = useMemo(() => sourceCardId ? list.cards.filter((card) => card.id !== sourceCardId) : list.cards, [list.cards, sourceCardId]);
  const dropPlaceholder = useMemo(() => dropIndex === undefined || dropHeight === undefined
    ? undefined : { index: dropIndex, height: dropHeight }, [dropIndex, dropHeight]);
  const handleAddCard = useCallback((title: string) => onAddCard(list.id, title), [list.id, onAddCard]);
  const handleDeleteStart = useCallback(() => onDeleteStart(list.id), [list.id, onDeleteStart]);
  const handleDeleteList = useCallback(() => onDeleteList(list.id), [list.id, onDeleteList]);
  const handleToggleCardPortfolio = useCallback((cardId: string) => onToggleCardPortfolio(list.id, cardId), [list.id, onToggleCardPortfolio]);
  const handleUpdateList = useCallback((changes: { title: string; description: string }) => onUpdateList(list.id, changes), [list.id, onUpdateList]);
  const handleCardPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, cardId: string, cardIndex: number) => onCardHandlePointerDown(event, list.id, cardId, cardIndex), [list.id, onCardHandlePointerDown]);
  const handleCardKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, cardId: string, cardIndex: number) => onCardHandleKeyDown(event, list.id, cardId, cardIndex), [list.id, onCardHandleKeyDown]);
  const handleListPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => onListHandlePointerDown(event, list.id, index), [index, list.id, onListHandlePointerDown]);
  const handleListKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => onListHandleKeyDown(event, list.id, index), [index, list.id, onListHandleKeyDown]);

  return (
    <div
      data-kanban-list-id={list.id}
      className={`${styles.list} ${isNew ? styles.newList : ""} ${isDeleting ? styles.deletingList : ""} ${isDraggedList ? styles.dragPlaceholder : ""} ${isPlaced ? styles.placedList : ""}`}
      style={isListDragActive ? { transform: `translateX(${offset}px)` } : undefined}
    >
      <button
        type="button"
        className={styles.dragHandle}
        data-kanban-header
        aria-label={`${list.title} 리스트 순서 변경`}
        aria-description="클릭해 집어 들고 다시 클릭해 놓거나, 누른 채 드래그하세요. 방향키로 위치를 바꿀 수도 있습니다."
        onPointerDown={handleListPointerDown}
        onKeyDown={handleListKeyDown}
      />
      <CardList
        title={list.title}
        description={list.description}
        isPortfolioPublished={isPortfolioPublished}
        cards={cards}
        dropPlaceholder={dropPlaceholder}
        isSourceOfDraggedCard={sourceCardId !== undefined}
        placedCardId={placedCardId}
        enabledFilters={enabledFilters}
        onAddCard={handleAddCard}
        onDeleteStart={handleDeleteStart}
        onDeleteList={handleDeleteList}
        onToggleCardPortfolio={handleToggleCardPortfolio}
        onCardClick={onCardClick}
        onUpdateList={handleUpdateList}
        onCardHandlePointerDown={handleCardPointerDown}
        onCardHandleKeyDown={handleCardKeyDown}
      />
    </div>
  );
});

