import { Box, Heading, ScrollArea } from "@chakra-ui/react";
import { SendHorizonal, Plus, X } from "lucide-react";
import { FormEvent, Fragment, KeyboardEvent, PointerEvent as ReactPointerEvent, memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import Collapse from "../../../../components/Collapse";
import HoverScrollbar from "../../../../components/HoverScrollbar";
import { useUnsavedChangesBeforeUnload } from "../../../../hooks/useUnsavedChangesBeforeUnload";
import Card from "../Card";
import type { KanbanCardDto } from "../../../../api/public/group/KanbanApi";
import { isCardDimmed, LabelFilterKey } from "../label";
import styles from "./style.module.css";

export type CardItem = KanbanCardDto;

type Props = {
  title: string;
  description: string;
  isPortfolioPublished: boolean;
  cards: CardItem[];
  dropPlaceholder?: { index: number; height: number };
  isSourceOfDraggedCard?: boolean;
  placedCardId?: string | null;
  enabledFilters: Set<LabelFilterKey>;
  onAddCard: (title: string) => void;
  onDeleteStart: () => void;
  onDeleteList: () => void | Promise<void>;
  onUpdateList: (changes: { title: string; description: string }) => void;
  onToggleCardPortfolio?: (cardId: string) => void;
  onCardClick?: (cardId: string) => void;
  onCardHandlePointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string, cardIndex: number) => void;
  onCardHandleKeyDown?: (event: KeyboardEvent<HTMLButtonElement>, cardId: string, cardIndex: number) => void;
};

type EditingField = "title" | "description" | null;

type CardRowProps = {
  card: CardItem;
  index: number;
  placed: boolean;
  isPortfolioPublished: boolean;
  enabledFilters: Set<LabelFilterKey>;
  onToggleCardPortfolio?: Props["onToggleCardPortfolio"];
  onCardClick?: Props["onCardClick"];
  onCardHandlePointerDown?: Props["onCardHandlePointerDown"];
  onCardHandleKeyDown?: Props["onCardHandleKeyDown"];
};

const CardRow = memo(function CardRow({ card, index, placed, isPortfolioPublished, enabledFilters, onToggleCardPortfolio, onCardClick, onCardHandlePointerDown, onCardHandleKeyDown }: CardRowProps) {
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => onCardHandlePointerDown?.(event, card.id, index), [card.id, index, onCardHandlePointerDown]);
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => onCardHandleKeyDown?.(event, card.id, index), [card.id, index, onCardHandleKeyDown]);
  const handleTogglePortfolio = useCallback(() => onToggleCardPortfolio?.(card.id), [card.id, onToggleCardPortfolio]);
  const handleClick = useCallback(() => onCardClick?.(card.id), [card.id, onCardClick]);

  return (
    <li
      data-card-id={card.id}
      className={`${card.id.startsWith("local-") ? styles.newCard : ""} ${placed ? styles.placedCard : ""}`}
    >
      <Card
        title={card.title}
        recordCount={card.recordCount}
        hasDescription={card.hasDescription}
        inPortfolio={card.portfolio}
        showPortfolioStatus={isPortfolioPublished}
        onTogglePortfolio={onToggleCardPortfolio ? handleTogglePortfolio : undefined}
        assigneeName={card.assigneeName}
        inheritedFrom={card.inheritedFrom}
        coverImageUrl={card.coverImageUrl}
        labels={card.labels}
        disabled={card.disabled}
        dimmed={isCardDimmed(card.labels ?? [], enabledFilters)}
        showDragHandle
        onHandlePointerDown={onCardHandlePointerDown ? handlePointerDown : undefined}
        onHandleKeyDown={onCardHandleKeyDown ? handleKeyDown : undefined}
        onClick={onCardClick ? handleClick : undefined}
      />
    </li>
  );
});

const CardList = memo(function CardList({ title, description, isPortfolioPublished, cards, dropPlaceholder, isSourceOfDraggedCard = false, placedCardId, enabledFilters, onAddCard, onDeleteStart, onDeleteList, onUpdateList, onToggleCardPortfolio, onCardClick, onCardHandlePointerDown, onCardHandleKeyDown }: Props) {
  const introRef = useRef<HTMLFormElement>(null);
  const cardListRef = useRef<HTMLUListElement>(null);
  const cardPositionsRef = useRef<Map<string, number>>(new Map());
  const cardAnimationsRef = useRef<Map<string, Animation>>(new Map());
  const cardAddFormRef = useRef<HTMLFormElement>(null);
  const cardTitleInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  useUnsavedChangesBeforeUnload(
    (editingField === "title" && draftTitle !== title)
    || (editingField === "description" && draftDescription !== description)
    || (isAdding && cardTitle.trim().length > 0),
  );
  const displayedDescription = description || "리스트 설명";
  const cardLayoutKey = `${cards.map((card) => card.id).join("|")}:${dropPlaceholder?.index ?? -1}:${dropPlaceholder?.height ?? 0}`;

  useLayoutEffect(() => {
    const nextPositions = new Map<string, number>();
    cardListRef.current?.querySelectorAll<HTMLElement>("[data-card-id]").forEach((element) => {
      const id = element.dataset.cardId;
      if (!id) return;
      const top = element.offsetTop;
      const previousTop = cardPositionsRef.current.get(id);
      const distance = previousTop === undefined ? 0 : previousTop - top;
      if (Math.abs(distance) > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cardAnimationsRef.current.get(id)?.cancel();
        const animation = element.animate([
          { transform: `translateY(${distance}px)` },
          { transform: "translateY(0)" },
        ], { duration: 180, easing: "ease-out" });
        cardAnimationsRef.current.set(id, animation);
      }
      nextPositions.set(id, top);
    });
    cardAnimationsRef.current.forEach((animation, id) => {
      if (!nextPositions.has(id)) {
        animation.cancel();
        cardAnimationsRef.current.delete(id);
      }
    });
    cardPositionsRef.current = nextPositions;
  }, [cardLayoutKey]);

  useEffect(() => () => {
    if (deleteTimerRef.current !== null) clearTimeout(deleteTimerRef.current);
  }, []);

  useEffect(() => {
    if (!editingField) return;

    const cancelOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !introRef.current?.contains(event.target)) {
        setEditingField(null);
      }
    };

    document.addEventListener("pointerdown", cancelOnOutsideClick);
    return () => document.removeEventListener("pointerdown", cancelOnOutsideClick);
  }, [editingField]);

  useEffect(() => {
    if (!isAdding) return;

    const cancelCardAddOnOutsideClick = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (cardAddFormRef.current?.contains(event.target) || addButtonRef.current?.contains(event.target)) return;
      setCardTitle("");
      setIsAdding(false);
    };

    document.addEventListener("pointerdown", cancelCardAddOnOutsideClick);
    return () => document.removeEventListener("pointerdown", cancelCardAddOnOutsideClick);
  }, [isAdding]);

  useEffect(() => {
    if (isAdding) cardTitleInputRef.current?.focus();
  }, [isAdding]);

  const closeForm = () => {
    setCardTitle("");
    setIsAdding(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = cardTitle.trim();
    if (!trimmedTitle) return;
    onAddCard(trimmedTitle);
    closeForm();
  };

  const startEditing = (field: Exclude<EditingField, null>) => {
    setDraftTitle(title);
    setDraftDescription(description);
    if (isAdding) closeForm();
    setEditingField(field);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setEditingField("title");
      return;
    }
    const nextDescription = draftDescription.trim();
    if (nextTitle !== title || nextDescription !== description) {
      onUpdateList({ title: nextTitle, description: nextDescription });
    }
    setEditingField(null);
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingField(null);
    }
  };

  const handleDeleteList = () => {
    if (isDeleting || cards.length > 0) return;
    if (!window.confirm("삭제된 리스트는 복구할 수 없습니다. 삭제하시겠습니까?")) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDeleteList();
      return;
    }

    setIsDeleting(true);
    onDeleteStart();
    deleteTimerRef.current = setTimeout(() => {
      void Promise.resolve(onDeleteList()).finally(() => setIsDeleting(false));
    }, 220);
  };

  return (
    <Box as="main" display="flex" flexDirection="column" flex="1" minH="0" w="232px" maxW="100%" data-kanban-list-content className={isDeleting ? styles.deletingList : undefined}>
      <form ref={introRef} className={styles.intro} data-kanban-header onSubmit={handleSave}>
        <div className={styles.header}>
          {editingField === "title" ? (
            <input
              autoFocus
              className={styles.editTitleInput}
              aria-label="리스트 이름"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleEditKeyDown}
              required
            />
          ) : (
            <button
              type="button"
              className={styles.titleEditTrigger}
              aria-label={`${title} 리스트 이름 수정`}
              onClick={() => startEditing("title")}
            >
              <Heading as="span" size="xl">{title}</Heading>
            </button>
          )}
          <AppTooltip content={editingField ? "리스트 변경 저장" : isAdding ? "카드 추가 취소" : "카드 추가"}>
            <button
              ref={addButtonRef}
              type={editingField ? "submit" : "button"}
              className={styles.addButton}
              aria-label={editingField ? `${title} 리스트 변경 저장` : isAdding ? `${title} 카드 추가 취소` : `${title}에 카드 추가`}
              aria-expanded={editingField ? undefined : isAdding}
              onClick={editingField ? undefined : () => isAdding ? closeForm() : setIsAdding(true)}
            >
              {editingField ? <SendHorizonal size={18} aria-hidden="true" />
                : isAdding ? <X size={18} aria-hidden="true" />
                  : <Plus size={18} aria-hidden="true" />}
            </button>
          </AppTooltip>
        </div>
        {editingField === "description" ? (
          <input
            autoFocus
            className={styles.editDescriptionInput}
            aria-label="리스트 설명"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <AppTooltip content={displayedDescription}>
            <button
              type="button"
              className={styles.listDescription}
              aria-label={`${title} 리스트 설명 수정: ${displayedDescription}`}
              onClick={() => startEditing("description")}
            >
              {displayedDescription}
            </button>
          </AppTooltip>
        )}
      </form>
      <Collapse open={isAdding}>
        <form
          ref={cardAddFormRef}
          className={styles.cardAddForm}
          aria-hidden={!isAdding}
          onSubmit={handleSubmit}
        >
          <input
            ref={cardTitleInputRef}
            className={styles.cardTitleInput}
            aria-label="카드 제목"
            placeholder="카드 제목"
            required
            disabled={!isAdding}
            value={cardTitle}
            onChange={(event) => setCardTitle(event.target.value)}
          />
          <button type="submit" className={styles.cardSubmitButton} disabled={!isAdding || !cardTitle.trim()}>
            추가
          </button>
        </form>
      </Collapse>
      {cards.length === 0 && !dropPlaceholder && !isSourceOfDraggedCard ? (
        <button
          type="button"
          className={styles.deleteListButton}
          aria-label={`${title} 리스트 삭제`}
          onClick={handleDeleteList}
        >
          리스트 삭제
        </button>
      ) : (
        <ScrollArea.Root className={styles.cardArea} data-kanban-card-scroll-area size="xs" variant="hover">
          <ScrollArea.Viewport
            h="100%"
            data-kanban-card-list
            style={{ width: "220px", minWidth: "220px", maxWidth: "220px", flex: "none", overflowX: "hidden", overscrollBehaviorY: "contain" }}
          >
            <ScrollArea.Content style={{ width: "220px", minWidth: 0, maxWidth: "220px" }}>
              <ul ref={cardListRef} className={styles.list} data-kanban-card-items>
                {cards.map((card, index) => (
                  <Fragment key={card.id}>
                    {dropPlaceholder?.index === index && <li className={styles.dropSpace} style={{ height: dropPlaceholder.height }} aria-hidden="true" />}
                    <CardRow
                      card={card}
                      index={index}
                      placed={placedCardId === card.id}
                      isPortfolioPublished={isPortfolioPublished}
                      enabledFilters={enabledFilters}
                      onToggleCardPortfolio={onToggleCardPortfolio}
                      onCardClick={onCardClick}
                      onCardHandlePointerDown={onCardHandlePointerDown}
                      onCardHandleKeyDown={onCardHandleKeyDown}
                    />
                  </Fragment>
                ))}
                {dropPlaceholder?.index === cards.length && <li className={styles.dropSpace} style={{ height: dropPlaceholder.height }} aria-hidden="true" />}
              </ul>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <HoverScrollbar />
        </ScrollArea.Root>
      )}
    </Box>
  );
});

export default CardList;
