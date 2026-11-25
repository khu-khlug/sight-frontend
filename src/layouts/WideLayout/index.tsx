import type { CSSProperties } from "react";
import NavigationBar from "../NavigationBar";
import "./style.css";

type Props = {
  children: React.ReactNode;
  /** 지정하면 페이지 배경색을 덮어쓴다. 지정하지 않으면 CSS 기본값을 쓴다. */
  backgroundColor?: string;
  /** 내비게이션의 상하 패딩(px). 생략하면 화면 크기별 기본값을 유지한다. */
  navPaddingY?: number;
};

/**
 * `MainLayout`과 같은 구조이며 콘텐츠 영역의 최대 너비 제한이 없다.
 * 헤더 아래 여백 외의 좌우·하단 padding과 자식 간격은 없으므로 간격은 콘텐츠가 정한다.
 */
export default function WideLayout({ children, backgroundColor, navPaddingY }: Props) {
  const layoutStyle = {
    backgroundColor,
    "--layout-nav-padding-y": navPaddingY === undefined ? undefined : `${navPaddingY}px`,
  } as CSSProperties;
  return (
    <div
      className="wide-layout"
      style={layoutStyle}
    >
      <NavigationBar wide paddingY={navPaddingY} />
      <div className="wide-layout__content">{children}</div>
    </div>
  );
}
