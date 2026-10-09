import { Box } from "@chakra-ui/react";
import { ChevronUp, Minus, X } from "lucide-react";
import { ReactNode } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import { SkeletonResizeBoundary } from "../../../../components/SkeletonWrapper";
import { cn } from "../../../../util/cn";
import styles from "./style.module.css";

type Props = {
  headerLeft?: ReactNode;
  // headerLeft 안에 클릭 가능한 요소(예: CardWindow의 라벨 필터 점)가 있으면, 그 사이 빈
  // 공간을 잘못 클릭했을 때 헤더 onClick(내리기)까지 같이 발동한다 — 그게 싫은 쪽(CardWindow)은
  // false로 꺼서 headerLeft 영역만 그 클릭을 삼키게 한다. 내려간 상태에서 헤더를 클릭해
  // 올리는 동작(§3)은 이 prop과 무관하게 항상 유지한다 — 펼쳐진 상태에서 "내리기"로 가는
  // 경로만 막는다.
  headerLeftTogglesMinimize?: boolean;
  middleActions?: ReactNode;
  children?: ReactNode;
  bg?: string;
  isSub?: boolean;
  minimized: boolean;
  onToggleMinimize: () => void;
  isClosing?: boolean;
  onRequestClose: () => void;
};

/*
 * "창 상자 하나"의 크롬만 맡는다 — 헤더(왼쪽 표시 + 최소화/전환버튼/닫기)와 콘텐츠가 들어갈
 * 빈 영역(.content). .content는 배경색(bg)만 칠하고 children을 그대로 꽂는 슬롯이라, 스크롤이
 * 필요한지/어느 방향인지(ScrollBox·VerticalScrollBox 등 무엇을 쓸지)는 전부 children을
 * 넘기는 쪽(CardWindow, FileWindow 등)이 정한다 — 콘텐츠마다 필요한 스크롤 방향이 다르기
 * 때문이다(카드는 세로만, 텍스트 파일은 줄바꿈/가로스크롤 토글 등). 둥근 모서리(.window의
 * border-radius)에 맞춘 스크롤바 보정 클래스(.scrollbar/.scrollbarHorizontal)는 이 모듈에
 * 그대로 남겨뒀으니, children 쪽에서 이 CSS 모듈을 import해 자기 스크롤박스에 적용하면 된다.
 * 크기·위치·내리기/올리기 이동 애니메이션은 이 컴포넌트를 감싸는 슬롯
 * (WindowLayer/style.module.css의 .slot*)이 맡는다 — 여기서는 그 슬롯의 100%를 채울 뿐이다.
 * 오버레이·딤 배경·바깥 클릭 감지처럼 레이어 전체에 걸치는 동작도 WindowLayer(../WindowLayer)
 * 가 맡는다. 닫기 애니메이션 타이밍도 WindowLayer의 binding.isClosing으로 제어한다.
 * 헤더에는 항상 un-hashed 마커 "js-window-header"를,
 * 내려간 상태에서는 추가로 "js-window-minimized"를 붙인다 — WindowLayer가 다른 CSS 모듈
 * 파일에서 "듀얼 양쪽 다 내려간/펼쳐진 두 헤더 사이 호버 시 동시에 음영·들어올리기"를
 * :has()로 걸 때 참조하는 훅이다(같은 CSS 모듈이 아니라 해시된 클래스명으로는 못 잡는다).
 */
export default function Window({ headerLeft, headerLeftTogglesMinimize = true, middleActions, children, bg = "white", isSub = false, minimized, onToggleMinimize, isClosing = false, onRequestClose }: Props) {
  return (
    <div
      className={cn(
        styles.windowAnim,
        isClosing ? styles.closing : undefined,
        minimized ? "js-window-minimized" : undefined,
      )}
    >
      <Box className={cn(styles.window, minimized ? styles.windowMinimized : undefined)}>
        <Box
          className={cn(styles.header, "js-window-header", minimized ? styles.headerMinimized : undefined)}
          bg={bg}
          onClick={onToggleMinimize}
          // 휠(가운데) 버튼 클릭으로 창을 바로 닫는다 — 브라우저 탭을 휠클릭으로 닫는 것과 같은
          // 관례다. onClick은 보통 왼쪽 버튼에서만 발생해서 따로 안 막아도 같이 안 걸리지만,
          // 가운데 버튼은 누르는 순간(mousedown) 브라우저가 자동 스크롤 모드로 들어가려 하므로
          // 그것만 막아준다.
          onMouseDown={(event) => { if (event.button === 1) event.preventDefault(); }}
          onAuxClick={(event) => { if (event.button === 1) onRequestClose(); }}
        >
          <div
            className={styles.headerLeft}
            onClick={!minimized && !headerLeftTogglesMinimize ? (event) => event.stopPropagation() : undefined}
          >
            {headerLeft}
          </div>
          <div className={styles.headerRightSlot}>
            <AppTooltip content={minimized ? "올리기" : "내리기"} placement="top">
              <Box
                as="button"
                className={cn(styles.iconSlot, styles.minimizeSlot)}
                pr={isSub ? "6px" : undefined}
                aria-label={minimized ? "올리기" : "내리기"}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMinimize();
                }}
              >
                <span className={styles.iconCircle}>
                  {minimized ? <ChevronUp size={18} /> : <Minus size={18} />}
                </span>
              </Box>
            </AppTooltip>
            {!isSub && (
              <>
                {middleActions}
                <AppTooltip content="닫기" placement="top">
                  <Box
                    as="button"
                    className={cn(styles.iconSlot, styles.closeSlot)}
                    pr="6px"
                    aria-label="닫기"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestClose();
                    }}
                  >
                    <span className={styles.iconCircle}>
                      <X size={18} />
                    </span>
                  </Box>
                </AppTooltip>
              </>
            )}
          </div>
        </Box>
        <Box className={styles.content} bg={bg}>
          <SkeletonResizeBoundary>{children}</SkeletonResizeBoundary>
        </Box>
      </Box>
    </div>
  );
}
