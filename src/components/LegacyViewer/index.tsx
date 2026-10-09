import DOMPurify from "dompurify";
import { useMemo } from "react";

import { cn } from "../../util/cn";
import styles from "./style.module.css";

type Props = { content: string; className?: string };

function prepareHtml(content: string): string {
  const body = DOMPurify.sanitize(content, {
    RETURN_DOM: true,
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "referrerpolicy", "target"],
    FORBID_TAGS: ["style", "form"],
    FORBID_ATTR: ["srcdoc", "srcset"],
    SANITIZE_NAMED_PROPS: true,
  });
  if (!(body instanceof Element)) {
    throw new Error("레거시 본문을 HTML 요소로 정리하지 못했습니다.");
  }

  // 레거시 아코디언의 jQuery 동작을 브라우저 기본 접기/펼치기로 대체한다.
  for (const accordion of Array.from(body.querySelectorAll(".accordion-content")).reverse()) {
    const title = Array.from(accordion.children).find((element) => element.classList.contains("accordion-button"));
    const item = Array.from(accordion.children).find((element) => element.classList.contains("accordion-item"));
    if (!title || !item) continue;
    const details = document.createElement("details");
    details.className = "legacy-accordion";
    details.open = true;
    const summary = document.createElement("summary");
    summary.append(...Array.from(title.childNodes));
    details.append(summary, ...Array.from(item.childNodes));
    accordion.replaceWith(details);
  }

  // 기존 사이트의 이미지/파일은 현재 사이트의 레거시 파일 경로로 요청한다.
  for (const element of body.querySelectorAll("[src], [href], [poster]")) {
    for (const attribute of ["src", "href", "poster"]) {
      const value = element.getAttribute(attribute);
      if (!value || value.startsWith("#")) continue;
      try {
        const url = new URL(value, window.location.origin);
        if (/^\/(?:image|file)\//.test(url.pathname)) {
          element.setAttribute(attribute, `/legacy${url.pathname}${url.search}${url.hash}`);
        }
      }
      catch { element.removeAttribute(attribute); }
    }
  }

  // YouTube 임베드만 허용하며 본문의 스크립트/인라인 이벤트는 위에서 제거한다.
  for (const frame of body.querySelectorAll("iframe")) {
    const url = new URL(frame.getAttribute("src") ?? "", window.location.origin);
    if (url.protocol !== "https:" || !["www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)
      || !url.pathname.startsWith("/embed/")) {
      frame.remove();
      continue;
    }
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
    frame.setAttribute("loading", "lazy");
  }
  for (const link of body.querySelectorAll('a[target="_blank"]')) {
    link.setAttribute("rel", "noopener noreferrer");
  }
  return body.innerHTML;
}

export default function LegacyViewer({ content, className }: Props) {
  const html = useMemo(() => prepareHtml(content), [content]);
  return <div className={cn(styles.document, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
