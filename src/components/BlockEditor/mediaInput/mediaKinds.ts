import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import { Image as ImageIcon, Music, Paperclip, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { isImageUrl } from "../../../util/isImageUrl";
import type { FileAttachmentAttrs } from "../../BlockContent/FileAttachment";

// 입력 박스의 종류이자 파일이 실제로 들어가는 노드 종류다(동영상은 유튜브 주소면 youtube 노드가 된다).
export type MediaKind = "image" | "audio" | "video" | "file";

// 박스 자리에 넣을 최종 내용 — 노드 하나로 바뀐다.
export type MediaContent =
  | { type: "image"; src: string; title?: string }
  | { type: "audio"; src: string; title?: string }
  | { type: "video"; src: string; title?: string }
  | { type: "youtube"; src: string; title?: string }
  | ({ type: "file" } & FileAttachmentAttrs);

// 박스가 쓰는 오류 — 메시지를 그대로 사용자에게 보여준다(그 외 오류는 작업별 실패 문구로 바꾼다).
export class MediaInputError extends Error {}

const MB = 1024 * 1024;
// TODO: 업로드 용량 제한 정책을 정해야 한다. 지금은 커버 이미지(10MB)·활동보고서(20MB) 업로드 기준에 맞춘 임시 값이다.
// 동영상은 목업 서버의 요청 크기 제한(30MB) 안에서 정했다.
export const MAX_UPLOAD_BYTES: Record<MediaKind, number> = { image: 10 * MB, audio: 20 * MB, video: 20 * MB, file: 20 * MB };

// 종류별 확장자 — 파일 종류 판별(classifyFile), 파일 선택 창의 accept, 박스 하단의 허용 확장자 표시가 같은 목록을 쓴다.
const IMAGE_EXTENSIONS = new Set(["apng", "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"]);
const AUDIO_EXTENSIONS = new Set(["aac", "flac", "m4a", "mp3", "oga", "ogg", "opus", "wav", "weba"]);
const VIDEO_EXTENSIONS = new Set(["m4v", "mov", "mp4", "ogv", "webm"]);

type KindConfig = {
  label: string;
  icon: LucideIcon;
  // 주소 입력 방법은 입력창 안내 문구가 알려준다 — 박스 하단에는 업로드 제한만 적는다.
  urlPlaceholder: string;
  // null이면 확장자 제한이 없다(일반 파일).
  extensions: ReadonlySet<string> | null;
};

export const MEDIA_KINDS: Record<MediaKind, KindConfig> = {
  image: { label: "이미지", icon: ImageIcon, urlPlaceholder: "이미지 URL 입력 후 Enter", extensions: IMAGE_EXTENSIONS },
  audio: { label: "오디오", icon: Music, urlPlaceholder: "오디오 파일 URL 입력 후 Enter", extensions: AUDIO_EXTENSIONS },
  video: { label: "동영상", icon: Youtube, urlPlaceholder: "유튜브 또는 동영상 파일 URL 입력 후 Enter", extensions: VIDEO_EXTENSIONS },
  file: { label: "파일", icon: Paperclip, urlPlaceholder: "파일 URL 입력 후 Enter", extensions: null },
};

// 파일 선택 창의 accept 값 — 허용 확장자만 고를 수 있게 한다.
export function acceptFor(kind: MediaKind): string | undefined {
  const extensions = MEDIA_KINDS[kind].extensions;
  return extensions ? [...extensions].map((extension) => `.${extension}`).join(",") : undefined;
}

// 제한 용량은 MB 단위 정수로 정하므로 "20MB"처럼 소수점 없이 보여준다.
function formatLimit(kind: MediaKind): string {
  return `${Math.round(MAX_UPLOAD_BYTES[kind] / MB)}MB`;
}

// 박스 하단에 보이는 업로드 제한 — 용량·허용 확장자를 한 줄에 적고, 동영상은 그보다 큰 파일의 처리를 덧붙인다.
// 올리기 기능이 없는 편집기에서는 아무것도 적지 않는다.
export function describeMediaInput(kind: MediaKind, canUpload: boolean): string[] {
  if (!canUpload) return [];
  const extensions = MEDIA_KINDS[kind].extensions;
  const lines = [`파일 업로드 최대 ${formatLimit(kind)} · ${extensions ? [...extensions].join(", ") : "모든 확장자"}`];
  if (kind === "video") lines.push("그보다 큰 동영상은 유튜브에 올려서 주소를 넣어주세요");
  return lines;
}

export function oversizeMessage(kind: MediaKind): string {
  const limit = formatLimit(kind);
  if (kind === "video") return `동영상이 너무 큽니다 (최대 ${limit}). 유튜브에 올린 뒤 링크를 넣어주세요.`;
  return `파일이 너무 큽니다 (최대 ${limit}).`;
}

function extensionOf(name: string): string {
  return /\.([^./?#]+)$/.exec(name)?.[1].toLowerCase() ?? "";
}

// 형식(Content-Type)을 먼저 보고, 없거나 판단할 수 없는 형식이면 확장자로 판단한다.
export function classifyFile(name: string, contentType?: string | null): MediaKind {
  const type = contentType?.split(";")[0].trim().toLowerCase();
  if (type?.startsWith("image/")) return "image";
  if (type?.startsWith("audio/")) return "audio";
  if (type?.startsWith("video/")) return "video";
  if (type && type !== "application/octet-stream") return "file";
  const extension = extensionOf(name);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  return "file";
}

export function fileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url, window.location.href).pathname.split("/").filter(Boolean).pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    // 주소 해석에 실패하면 주소 그대로를 이름으로 쓴다.
  }
  return url;
}

export function toMediaContent(kind: MediaKind, file: FileAttachmentAttrs): MediaContent {
  if (kind === "file") return { type: "file", ...file };
  return { type: kind, src: file.src, title: file.name };
}

// isImageUrl과 같은 방식 — <audio>/<video>가 메타데이터를 읽어 들이면 재생할 수 있는 주소로 본다.
function isPlayableUrl(tag: "audio" | "video", url: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const media = document.createElement(tag);
    const finish = (result: boolean) => {
      clearTimeout(timer);
      media.onloadedmetadata = null;
      media.onerror = null;
      media.removeAttribute("src");
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    media.onloadedmetadata = () => finish(true);
    media.onerror = () => finish(false);
    media.preload = "metadata";
    media.src = url;
  });
}

// 박스의 URL 입력을 박스 종류에 맞는 내용으로 바꾼다. 파일 박스의 용량·형식 조회는 호출부가 맡는다.
export async function resolveUrlInput(kind: Exclude<MediaKind, "file">, url: string): Promise<MediaContent> {
  if (kind === "image") {
    if (!(await isImageUrl(url))) throw new MediaInputError("이미지로 불러올 수 없는 URL입니다.");
    return { type: "image", src: url };
  }
  if (kind === "audio") {
    if (!(await isPlayableUrl("audio", url))) throw new MediaInputError("오디오로 불러올 수 없는 URL입니다.");
    return { type: "audio", src: url };
  }
  if (isValidYoutubeUrl(url)) return { type: "youtube", src: url };
  // 동영상 사이트의 페이지 주소는 <video>로 재생할 수 없다 — 파일을 직접 가리키는 주소만 받는다.
  if (!(await isPlayableUrl("video", url))) {
    throw new MediaInputError("유튜브 주소나 동영상 파일을 직접 가리키는 주소만 넣을 수 있습니다.");
  }
  return { type: "video", src: url };
}

export function createContentNode(schema: Schema, content: MediaContent): ProseMirrorNode {
  if (content.type === "file") {
    const attrs: FileAttachmentAttrs = { src: content.src, name: content.name, size: content.size, contentType: content.contentType };
    return schema.nodes.fileAttachment.create(attrs);
  }
  return schema.nodes[content.type].create({ src: content.src, title: content.title ?? null });
}
