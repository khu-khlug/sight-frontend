/*
 * 링크 주소(href)를 어디로 가는 링크인지로 나눈다.
 * - card: "#카드id" — 같은 그룹의 카드 창을 연다.
 * - domain: 이 사이트(같은 도메인) 주소 — 상대 주소는 현재 도메인을 앞에 붙인다.
 * - external: 다른 도메인 주소, mailto: 등.
 * - empty: 아직 주소를 넣지 않은 링크.
 */
export type LinkTarget =
  | { kind: "card"; cardId: string }
  | { kind: "domain"; url: string }
  | { kind: "external"; url: string }
  | { kind: "empty" };

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function resolveLinkTarget(href: string | null | undefined): LinkTarget {
  const value = href?.trim() ?? "";
  if (!value) return { kind: "empty" };
  if (value.startsWith("#")) {
    const cardId = value.slice(1).trim();
    return cardId ? { kind: "card", cardId } : { kind: "empty" };
  }
  const origin = window.location.origin;
  try {
    // 스킴이 있거나 "//"로 시작하는 주소만 절대 주소로 본다. 그 외는 이 사이트의 경로로 보고 도메인을 붙인다.
    const absolute = SCHEME_PATTERN.test(value) || value.startsWith("//");
    const url = new URL(absolute ? value : value.startsWith("/") ? value : `/${value}`, origin);
    return url.origin === origin ? { kind: "domain", url: url.href } : { kind: "external", url: url.href };
  } catch {
    return { kind: "empty" };
  }
}
