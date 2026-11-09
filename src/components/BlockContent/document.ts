import type { JSONContent } from "@tiptap/core";
import { resolveApiUrl } from "../../api/client/resolveApiUrl";

function resolveFileUrls(node: JSONContent): void {
  for (const key of ["src", "href", "poster"]) {
    const value: unknown = node.attrs?.[key];
    if (typeof value === "string" && /^\/(?:groups\/[^/]+\/files\/|image\/|api\/)/.test(value)) {
      node.attrs![key] = resolveApiUrl(value);
    }
  }
  node.content?.forEach(resolveFileUrls);
  node.marks?.forEach(resolveFileUrls);
}

export const emptyDocument = (): JSONContent => ({ type: "doc", content: [{ type: "paragraph" }] });

// HTML은 기존 개발 데이터 입력을 읽는 용도로만 허용한다. 신규 저장은 JSON으로만 한다.
export function parseBlockContent(content: string): JSONContent | string {
  if (!content.trim()) return emptyDocument();
  try {
    const value: unknown = JSON.parse(content);
    if (value && typeof value === "object" && "type" in value && value.type === "doc") {
      const document = value as JSONContent;
      resolveFileUrls(document);
      return document;
    }
  } catch { /* 기존 개발용 HTML·일반 텍스트 입력. */ }
  return content;
}

const mediaTypes = new Set(["image", "audio", "video", "youtube", "fileAttachment", "mediaInput"]);

export function withoutMedia(node: JSONContent): JSONContent {
  return { ...node, content: node.content?.filter((child) => {
    if (mediaTypes.has(child.type ?? "")) return false;
    return !child.marks?.some((mark) => {
      if (mark.type !== "link" || typeof mark.attrs?.href !== "string") return false;
      try { return /^\/(?:file\/|groups\/[^/]+\/files\/)/.test(new URL(mark.attrs.href, window.location.origin).pathname); }
      catch { return false; }
    });
  }).map(withoutMedia) };
}
