import { useEffect, type RefObject } from "react";

type Options = {
  // 스크롤되는 요소. 생략하면 끝 감지 요소에서 가장 가까운 스크롤 조상을 쓴다.
  rootRef?: RefObject<HTMLElement>;
  // 목록 끝(위쪽으로 불러오는 목록이면 맨 앞)에 두는 빈 요소.
  sentinelRef: RefObject<HTMLElement>;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  // 가로 목록이면 "horizontal". 위쪽으로 이전 항목을 불러오는 목록도 끝 감지 요소만 맨 앞에 두면 된다.
  axis?: "vertical" | "horizontal";
  // 끝에 닿기 전 미리 불러올 거리(px). 기본은 0이라, 끝의 스켈레톤이 실제로 보일 때 불러온다 —
  // 미리 불러오면 렌더 지연이 끝이 보이지 않는 스크롤 도중에 생겨 불러오는 중인지 알 수 없다.
  margin?: number;
};

/**
 * 끝 감지 요소가 보이면 다음 범위를 불러온다. 불러온 뒤에도 다음 범위가 있고 목록이 스크롤되지
 * 않을 만큼 짧으면(화면에 빈 공간이 남으면) 빈 공간이 없어질 때까지 이어서 불러온다. 창 크기가
 * 바뀌어 빈 공간이 생겨도 같다.
 */
export function useLoadMoreOnScroll({ rootRef, sentinelRef, hasMore, isLoading, loadMore, axis = "vertical", margin = 0 }: Options) {
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;
    const root = rootRef?.current ?? findScrollParent(sentinel, axis);
    if (!root) return;

    const rootMargin = axis === "horizontal" ? `0px ${margin}px 0px ${margin}px` : `${margin}px 0px ${margin}px 0px`;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { root, rootMargin });
    observer.observe(sentinel);

    // IntersectionObserver는 처음 관찰할 때 한 번 알려 주지만, 목록이 짧아 이미 보이는 상태에서
    // 크기만 바뀌는 경우를 놓치지 않도록 크기 변화도 본다.
    const fillIfShort = () => {
      const scrollable = axis === "horizontal"
        ? root.scrollWidth > root.clientWidth + 1
        : root.scrollHeight > root.clientHeight + 1;
      if (!scrollable) loadMore();
    };
    const resizeObserver = new ResizeObserver(fillIfShort);
    resizeObserver.observe(root);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [rootRef, sentinelRef, hasMore, isLoading, loadMore, axis, margin]);
}

function findScrollParent(element: HTMLElement, axis: "vertical" | "horizontal"): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node)[axis === "horizontal" ? "overflowX" : "overflowY"];
    if (overflow === "auto" || overflow === "scroll") return node;
  }
  return null;
}
