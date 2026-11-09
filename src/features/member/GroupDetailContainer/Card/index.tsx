import { Box, chakra } from "@chakra-ui/react";
import { BriefcaseBusiness, PenBox, Handshake, SquareMenu } from "lucide-react";
import { KeyboardEvent, PointerEvent } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import { LabelColor, LABEL_COLOR_HEX, LABEL_COLOR_NAME } from "../label";
import styles from "./style.module.css";

export type CardProps = {
  title: string;
  recordCount: number;
  hasDescription?: boolean;
  inPortfolio?: boolean;
  showPortfolioStatus?: boolean;
  onTogglePortfolio?: () => void;
  assigneeName?: string | null;
  inheritedFrom?: string | null;
  coverImageUrl?: string | null;
  labels?: LabelColor[];
  // 카드 자체의 비활성 상태(라벨 필터와 무관하게 항상 어둡다)
  disabled?: boolean;
  // 라벨 필터로 제외됨(라벨 필터 상태에 따라 바뀐다)
  dimmed?: boolean;
  showDragHandle?: boolean;
  onHandlePointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandleKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
};

/*
 * 어둡게 표시는 opacity나 배경색을 직접 바꾸는 게 아니라, 카드 위에 반투명 검정
 * 오버레이를 "덧대는" 방식으로 한다 — disabled/dimmed처럼 서로 다른 이유가 동시에
 * 적용되면 오버레이가 겹쳐서 자연히 더 어두워진다(나중에 다른 이유가 추가돼도 같은
 * 방식으로 오버레이만 하나 더 얹으면 된다).
 */
export default function Card({
  title,
  recordCount,
  hasDescription = false,
  inPortfolio = false,
  showPortfolioStatus = false,
  onTogglePortfolio,
  assigneeName,
  inheritedFrom,
  coverImageUrl,
  labels = [],
  disabled = false,
  dimmed = false,
  showDragHandle = false,
  onHandlePointerDown,
  onHandleKeyDown,
  onClick,
}: CardProps) {
  return (
    // 오버레이는 이 래퍼(테두리·패딩이 전혀 없음) 기준으로 위치를 잡는다 — absolute의
    // inset은 부모의 "패딩 박스" 기준이라, 만약 .card(테두리 있음)를 기준으로 삼으면
    // inset: 0은 테두리 안쪽에서 끝나 테두리가 하얗게 남고, 테두리 두께만큼 보정하면
    // 이번엔 그 테두리 자체가 덧칠돼 오히려 더 진해진다 — 아예 테두리 없는 박스를
    // 기준으로 삼아 그런 보정이 필요 없게 한다.
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ""}`} data-kanban-card>
      <article className={styles.card} onClick={onClick}>
        {coverImageUrl && <img className={styles.coverImage} src={coverImageUrl} alt={`${title} 카드 커버 이미지`} />}
        <div className={`${styles.cardBody} ${showDragHandle ? styles.withHandle : ""}`}>
          {labels.length > 0 && (
            <div className={styles.labels}>
              {labels.map((color) => (
                <AppTooltip key={color} content={LABEL_COLOR_NAME[color]}>
                  <chakra.span
                    className={styles.labelDot}
                    bg={LABEL_COLOR_HEX[color]}
                  />
                </AppTooltip>
              ))}
            </div>
          )}
          <h3 className={styles.title}>{title}</h3>
          {(assigneeName || recordCount > 0 || inheritedFrom || hasDescription || showPortfolioStatus) && (
            <div className={styles.metadata}>
              {assigneeName && (
                <AppTooltip content={`담당자: ${assigneeName}`}>
                  <span className={styles.assignee} aria-label={`담당자 ${assigneeName}`}>{assigneeName}</span>
                </AppTooltip>
              )}
              {recordCount > 0 && (
                <span className={styles.metaItem} aria-label={`기록 ${recordCount}개`}>
                  <PenBox size={14} aria-hidden="true" />
                  <span>{recordCount}</span>
                </span>
              )}
              {hasDescription && (
                <AppTooltip content="카드 설명 있음">
                  <span className={styles.metaItem} aria-label="카드 설명 있음">
                    <SquareMenu size={14} aria-hidden="true" />
                  </span>
                </AppTooltip>
              )}
              {inheritedFrom && (
                <AppTooltip content="다른 카드에서 이어받음">
                  <span className={styles.metaItem} aria-label="다른 카드에서 이어받음">
                    <Handshake size={14} aria-hidden="true" />
                  </span>
                </AppTooltip>
              )}
              {showPortfolioStatus && (
                <AppTooltip content={inPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 공개하기"}>
                  <button
                    type="button"
                    className={`${styles.metaItem} ${styles.portfolio} ${inPortfolio ? "" : styles.portfolioInactive}`}
                    aria-label={`${title} 카드 ${inPortfolio ? "포트폴리오에서 제외하기" : "포트폴리오에 공개하기"}`}
                    aria-pressed={inPortfolio}
                    disabled={!onTogglePortfolio}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTogglePortfolio?.();
                    }}
                  >
                    <BriefcaseBusiness size={14} aria-hidden="true" />
                  </button>
                </AppTooltip>
              )}
            </div>
          )}
          {showDragHandle && (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label={`${title} 카드 이동`}
              aria-description="누른 채 드래그하거나 클릭해 집어 든 뒤 원하는 위치를 다시 클릭하세요."
              tabIndex={onHandlePointerDown ? 0 : -1}
              onPointerDown={onHandlePointerDown}
              onKeyDown={onHandleKeyDown}
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </div>
      </article>
      {disabled && <Box className={styles.overlay} bg="blackAlpha.500" />}
      {dimmed && <Box className={styles.overlay} bg="blackAlpha.700" />}
    </div>
  );
}
