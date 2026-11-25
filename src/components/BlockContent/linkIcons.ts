import { getMarkRange } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import type { LinkOptions } from "@tiptap/extension-link";
import type { MarkType, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { MutableRefObject } from "react";

import styles from "./link.module.css";
import { resolveLinkTarget } from "./linkTarget";
import type { LinkTarget } from "./linkTarget";

export type LinkCard = { id: string; title: string };
// 편집기·뷰어 바깥(그룹 상세)이 주입하는 기능 — 카드 자동완성 목록과 카드 창 열기.
export type LinkServices = {
  cards?: LinkCard[];
  onOpenCard?: (cardId: string) => void;
};
type LinkWithIconsOptions = LinkOptions & { services: MutableRefObject<LinkServices> | null };

// lucide의 credit-card, link, link-2, external-link를 복사한 것 — 위젯은 React가 아니라 DOM을 직접 만들어서 SVG 문자열로 둔다.
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const LINK_ICON = svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>');
const LINK2_ICON = svg('<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>');
const ICONS: Record<LinkTarget["kind"], string> = {
  card: svg('<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>'),
  domain: LINK_ICON,
  external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  empty: LINK2_ICON,
};

const linkIconsKey = new PluginKey<DecorationSet>("linkIcons");

// 같은 링크(같은 href의 마크)가 이어진 글자 범위들 — 범위마다 앞에 아이콘을 하나 단다.
function findLinkRanges(doc: ProseMirrorNode, linkType: MarkType) {
  const ranges: { from: number; to: number; href: string }[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let current: { from: number; to: number; href: string } | null = null;
    node.forEach((child, offset) => {
      const start = pos + 1 + offset;
      const mark = child.isText ? linkType.isInSet(child.marks) : undefined;
      const href: string = mark?.attrs.href ?? "";
      if (mark && current && current.to === start && current.href === href) {
        current.to = start + child.nodeSize;
        return;
      }
      if (current) ranges.push(current);
      current = mark ? { from: start, to: start + child.nodeSize, href } : null;
    });
    if (current) ranges.push(current);
    return false;
  });
  return ranges;
}

// 뷰어에서 링크를 연다 — 카드 링크는 카드 창, 그 외는 새 탭. 카드 창을 열 수 없는 곳이면 창 주소(#card=)로 이동한다.
function followLink(href: string, services: LinkServices | undefined) {
  const target = resolveLinkTarget(href);
  if (target.kind === "card") {
    if (services?.onOpenCard) services.onOpenCard(target.cardId);
    else window.location.hash = `card=${target.cardId}`;
    return;
  }
  if (target.kind !== "empty") window.open(target.url, "_blank", "noopener,noreferrer");
}

/*
 * 기본 Link 마크 앞에 링크 종류 아이콘(카드·도메인·외부)을 위젯으로 단다. 링크 글자는 기본 <a>로 그대로 그려서
 * 편집(커서 이동·입력)에는 끼어들지 않는다. 저장되는 HTML도 그대로 <a href>다.
 * 편집기에서 아이콘을 누르면 BlockEditor의 LinkEditOverlay가 data-link-icon을 찾아 주소 입력 상자를 연다.
 */
export const LinkWithIcons = Link.extend<LinkWithIconsOptions>({
  addOptions() {
    return { ...this.parent!(), services: null };
  },

  addProseMirrorPlugins() {
    const linkType = this.type;
    const services = this.options.services;
    const build = (doc: ProseMirrorNode) => DecorationSet.create(doc, findLinkRanges(doc, linkType).map((range) =>
      Decoration.widget(range.from, (view) => {
        const icon = document.createElement("span");
        icon.className = styles.icon;
        icon.contentEditable = "false";
        icon.dataset.linkIcon = "";
        icon.dataset.href = range.href;
        icon.innerHTML = ICONS[resolveLinkTarget(range.href).kind];
        icon.addEventListener("click", (event) => {
          if (view.editable) return;
          event.preventDefault();
          followLink(range.href, services?.current);
        });
        return icon;
      }, {
        // 아이콘은 링크 글자 앞에 붙는다. 아이콘 위의 마우스 입력은 ProseMirror가 커서 이동으로 쓰지 않는다.
        side: -1,
        key: `link-icon:${range.href}`,
        ignoreSelection: true,
        stopEvent: () => true,
      })));

    return [
      ...(this.parent?.() ?? []),
      new Plugin<DecorationSet>({
        key: linkIconsKey,
        state: {
          init: (_config, state) => build(state.doc),
          apply: (tr, previous) => (tr.docChanged ? build(tr.doc) : previous),
        },
        props: {
          decorations: (state) => linkIconsKey.getState(state),
          handleDOMEvents: {
            // 편집기에서는 링크를 열지 않는다 — 글자를 눌러 커서를 놓는다.
            click(view, event) {
              const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
              if (!anchor || !view.dom.contains(anchor)) return false;
              event.preventDefault();
              if (view.editable) return false;
              followLink(anchor.getAttribute("href") ?? "", services?.current);
              return true;
            },
          },
        },
      }),
    ];
  },
});

// 아이콘 위젯 위치(링크 시작)에서 그 링크가 걸린 글자 범위를 찾는다.
export function linkRangeAt(doc: ProseMirrorNode, linkType: MarkType, pos: number) {
  return getMarkRange(doc.resolve(pos), linkType) ?? null;
}
