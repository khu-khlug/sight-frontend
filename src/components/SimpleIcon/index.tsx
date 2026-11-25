import { useEffect, useState } from "react";

const SIMPLE_ICONS_VERSION = "16";

const jsdelivrUrl = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`;
const unpkgUrl = (slug: string) => `https://unpkg.com/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`;

type ParsedIcon = { title: string; innerHtml: string; viewBox: string; fill: string };

// simple-icons SVG는 <title>공식 이름</title>을 담고 있어, fetch 한 번으로 아이콘 모양과
// 표시용 이름을 같이 얻는다. <title>이 없으면(예: CDN이 SVG 대신 에러 페이지를 반환) 실패로 본다.
function parseIcon(svgText: string): ParsedIcon | null {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  const title = doc.querySelector("title")?.textContent;
  if (!svg || !title) return null;

  return {
    title,
    innerHtml: svg.innerHTML,
    viewBox: svg.getAttribute("viewBox") ?? "0 0 24 24",
    fill: svg.getAttribute("fill") ?? "currentColor",
  };
}

async function fetchIcon(slug: string, colored: boolean): Promise<ParsedIcon | null> {
  const urls = colored
    ? [`https://cdn.simpleicons.org/${slug}`, jsdelivrUrl(slug), unpkgUrl(slug)]
    : [jsdelivrUrl(slug), unpkgUrl(slug)];
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const parsed = parseIcon(await response.text());
      if (parsed) return parsed;
    } catch {
      // 다음 CDN으로 폴백
    }
  }
  return null;
}

type Props = {
  slug: string;
  size?: number;
  colored?: boolean;
  onLoad?: (title: string) => void;
  onError?: () => void;
};

/*
 * 기본은 jsDelivr에서 SVG를 fetch하고, 실패하면 unpkg로 재시도한다. colored는
 * Simple Icons CDN의 브랜드 색상 SVG를 먼저 사용하고 실패하면 기존 CDN으로 폴백한다. 브라우저가
 * 같은 URL을 <img>가 아닌 fetch로 요청해도 HTTP 캐시(jsDelivr는 public, max-age=7일)를
 * 그대로 재사용하므로 두 번 그릴 일이 있어도 매번 네트워크를 타지 않는다.
 * 둘 다 실패하면 아이콘을 그리지 않고 onError로 호출자에 알린다 — 호출자가 일반 뱃지로
 * 대체할지 판단한다.
 * 원본 SVG엔 fill이 없어 currentColor로 렌더링되므로, 브랜드마다 채도·명도가 달라지는
 * 문제 없이 실루엣이 통일된다.
 */
export default function SimpleIcon({ slug, size = 14, colored = false, onLoad, onError }: Props) {
  const [icon, setIcon] = useState<ParsedIcon | null>(null);

  useEffect(() => {
    let active = true;
    setIcon(null);

    fetchIcon(slug, colored).then((result) => {
      if (!active) return;
      if (result) {
        setIcon(result);
        onLoad?.(result.title);
      } else {
        onError?.();
      }
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, colored]);

  if (!icon) return null;

  return (
    <svg
      role="img"
      aria-hidden="true"
      viewBox={icon.viewBox}
      width={size}
      height={size}
      fill={colored ? icon.fill : "currentColor"}
      dangerouslySetInnerHTML={{ __html: icon.innerHtml }}
    />
  );
}
