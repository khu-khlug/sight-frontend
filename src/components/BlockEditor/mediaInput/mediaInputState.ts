import { getHTMLFromFragment } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { insertPoint } from "@tiptap/pm/transform";
import type { MutableRefObject } from "react";
import { toast } from "react-toastify";

import { readDraggedFile, type DraggedFile } from "../../../util/draggableFile";
import {
  classifyFile, createContentNode, fileNameFromUrl, MAX_UPLOAD_BYTES, MediaInputError, oversizeMessage, resolveUrlInput, toMediaContent,
} from "./mediaKinds";
import type { MediaContent, MediaKind } from "./mediaKinds";

export const MEDIA_INPUT_NODE = "mediaInput";

export type FileMetadata = { size: number | null; contentType: string | null };
// 편집기 바깥(그룹 기록 등)이 주입하는 기능 — 없으면 파일 올리기·용량 확인을 하지 않는다.
export type MediaServices = {
  // 파일을 올리고 본문에 넣을 주소를 돌려준다.
  uploadFile?: (file: File, signal: AbortSignal) => Promise<string>;
  resolveFileMetadata?: (url: string) => Promise<FileMetadata>;
};
export type MediaInputOptions = { services: MutableRefObject<MediaServices> | null };
export type MediaInputAttrs = { kind: MediaKind; id: string };
// 박스가 처리할 파일 — OS 파일이거나, 앱 안 파일 요소(저장소·활동보고서·채팅 첨부)를 끌어온 주소다.
export type MediaInputItem = { kind: "file"; file: File } | { kind: "remote"; file: DraggedFile };
// busy면 message가 진행 문구, 아니면 오류 문구다.
export type MediaInputStatus = { busy: boolean; message: string };

type StatusMeta = { id: string; status: MediaInputStatus | null };

/*
 * 박스별 진행·오류 상태는 문서가 아니라 이 플러그인 상태에 둔다 — 문서 속성으로 두면 상태가 바뀔 때마다
 * 입력으로 세어져 임시저장이 돌고, 실행 취소 기록에도 남는다. 박스가 문서에서 사라지면 상태도 지운다.
 */
export const mediaInputKey = new PluginKey<ReadonlyMap<string, MediaInputStatus>>("mediaInput");

// 진행 중인 작업은 NodeView 밖에 둔다 — 박스를 옮기면 NodeView가 새로 만들어져도 업로드가 이어진다.
const controllers = new Map<string, AbortController>();
// 툴바로 연 박스가 처음 그려질 때 입력창에 포커스를 줄 박스 id다.
export const pendingFocus = new Set<string>();

let sequence = 0;
const createId = () => `media-${Date.now().toString(36)}-${(sequence += 1).toString(36)}`;

function findMediaInput(doc: ProseMirrorNode, id: string): { pos: number; node: ProseMirrorNode } | null {
  let found: { pos: number; node: ProseMirrorNode } | null = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name !== MEDIA_INPUT_NODE) return true;
    if (node.attrs.id === id) found = { pos, node };
    return false;
  });
  return found;
}

function collectIds(doc: ProseMirrorNode): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name !== MEDIA_INPUT_NODE) return true;
    ids.add(node.attrs.id);
    return false;
  });
  return ids;
}

export function isMediaInputBusy(state: EditorState): boolean {
  for (const status of mediaInputKey.getState(state)?.values() ?? []) {
    if (status.busy) return true;
  }
  return false;
}

function getServices(editor: Editor): MediaServices {
  const extension = editor.extensionManager.extensions.find((item) => item.name === MEDIA_INPUT_NODE);
  return (extension?.options as MediaInputOptions | undefined)?.services?.current ?? {};
}

// 이미 지워진 박스의 상태는 기록하지 않는다 — 남으면 진행 중으로 계속 세어져 보내기가 막힌다.
function setStatus(editor: Editor, id: string, status: MediaInputStatus | null) {
  if (editor.isDestroyed || !findMediaInput(editor.state.doc, id)) return;
  editor.view.dispatch(editor.state.tr.setMeta(mediaInputKey, { id, status } satisfies StatusMeta));
}

// 오류는 박스 하단에 남기고, 박스가 화면 밖에 있을 수도 있어 알림으로도 띄운다.
function fail(editor: Editor, id: string, message: string) {
  if (editor.isDestroyed || !findMediaInput(editor.state.doc, id)) return;
  setStatus(editor, id, { busy: false, message });
  toast.error(message, { autoClose: 2500, hideProgressBar: true });
}

function replaceMediaInput(editor: Editor, id: string, content: MediaContent) {
  if (editor.isDestroyed) return;
  const found = findMediaInput(editor.state.doc, id);
  if (!found) return;
  const tr = editor.state.tr.replaceWith(found.pos, found.pos + found.node.nodeSize, createContentNode(editor.schema, content));
  editor.view.dispatch(tr.setMeta(mediaInputKey, { id, status: null } satisfies StatusMeta));
}

// failure는 MediaInputError가 아닌 오류(네트워크 등)일 때 보여줄 문구다.
async function runTask(editor: Editor, id: string, label: string, failure: string, task: (signal: AbortSignal) => Promise<MediaContent>) {
  if (controllers.has(id) || editor.isDestroyed || !findMediaInput(editor.state.doc, id)) return;
  const controller = new AbortController();
  controllers.set(id, controller);
  setStatus(editor, id, { busy: true, message: label });
  try {
    const content = await task(controller.signal);
    if (controller.signal.aborted) return;
    controllers.delete(id);
    replaceMediaInput(editor, id, content);
  } catch (error) {
    if (controller.signal.aborted) return;
    controllers.delete(id);
    fail(editor, id, error instanceof MediaInputError ? error.message : failure);
  } finally {
    if (controllers.get(id) === controller) controllers.delete(id);
  }
}

// 파일 첨부 박스는 확장자/MIME 형식과 무관하게 파일로 만든다.
function kindForInput(editor: Editor, id: string, name: string, contentType?: string | null): MediaKind {
  return findMediaInput(editor.state.doc, id)?.node.attrs.kind === "file" ? "file" : classifyFile(name, contentType);
}

function processFile(editor: Editor, id: string, file: File) {
  const kind = kindForInput(editor, id, file.name, file.type);
  if (file.size > MAX_UPLOAD_BYTES[kind]) {
    fail(editor, id, oversizeMessage(kind));
    return;
  }
  const upload = getServices(editor).uploadFile;
  if (!upload) {
    fail(editor, id, "이 편집기에서는 파일을 올릴 수 없습니다.");
    return;
  }
  void runTask(editor, id, `${file.name} 올리는 중`, "파일을 올리지 못했습니다.", async (signal) => {
    const src = await upload(file, signal);
    return toMediaContent(kind, { src, name: file.name, size: file.size, contentType: file.type || null });
  });
}

// 앱 안 파일은 올리지 않고 원래 주소를 그대로 참조한다.
function processRemote(editor: Editor, id: string, item: DraggedFile) {
  // 채팅 첨부처럼 data: 주소로 들고 있는 파일은 그대로 넣으면 본문 HTML이 커지므로 파일로 바꿔 올린다.
  if (item.url.startsWith("data:")) {
    setStatus(editor, id, { busy: true, message: `${item.name} 읽는 중` });
    fetch(item.url)
      .then((response) => response.blob())
      .then((blob) => processFile(editor, id, new File([blob], item.name, { type: item.contentType ?? blob.type })))
      .catch(() => fail(editor, id, "파일을 읽지 못했습니다."));
    return;
  }
  if (item.contentType !== undefined && item.size !== undefined) {
    const kind = kindForInput(editor, id, item.name, item.contentType);
    replaceMediaInput(editor, id, toMediaContent(kind, { src: item.url, name: item.name, size: item.size, contentType: item.contentType }));
    return;
  }
  void runTask(editor, id, `${item.name} 정보 확인 중`, "파일 정보를 확인하지 못했습니다.", async () => {
    const resolve = getServices(editor).resolveFileMetadata;
    // 용량을 확인하지 못해도 파일은 넣는다 — 용량 칸만 비워 둔다.
    const metadata = resolve ? await resolve(item.url).catch(() => null) : null;
    const contentType = item.contentType ?? metadata?.contentType ?? null;
    return toMediaContent(kindForInput(editor, id, item.name, contentType), {
      src: item.url, name: item.name, size: item.size ?? metadata?.size ?? null, contentType,
    });
  });
}

function processItem(editor: Editor, id: string, item: MediaInputItem) {
  if (item.kind === "file") processFile(editor, id, item.file);
  else processRemote(editor, id, item.file);
}

function kindForItem(item: MediaInputItem): MediaKind {
  return item.kind === "file" ? classifyFile(item.file.name, item.file.type) : classifyFile(item.file.name, item.file.contentType);
}

export function readDroppedItems(dataTransfer: DataTransfer | null): MediaInputItem[] {
  const dragged = readDraggedFile(dataTransfer);
  if (dragged) return [{ kind: "remote", file: dragged }];
  return Array.from(dataTransfer?.files ?? []).map((file) => ({ kind: "file", file }));
}

/*
 * 박스를 넣는다. at이 없으면 커서 자리에, 있으면 그 위치에서 블록이 들어갈 수 있는 가장 가까운 자리에 넣는다.
 * item이 있으면 넣자마자 그 파일을 처리한다(드롭·붙여넣기는 박스 없이 들어와도 박스를 거쳐 같은 경로로 처리된다).
 */
export function insertMediaInput(editor: Editor, kind: MediaKind, options: { item?: MediaInputItem; at?: number; focus?: boolean } = {}): boolean {
  if (!editor.isEditable) return false;
  const type = editor.schema.nodes[MEDIA_INPUT_NODE];
  const id = createId();
  const node = type.create({ kind, id } satisfies MediaInputAttrs);
  const tr = editor.state.tr;
  if (options.at === undefined) {
    tr.replaceSelectionWith(node);
  } else {
    const pos = insertPoint(tr.doc, options.at, type);
    if (pos === null) return false;
    tr.insert(pos, node);
  }
  if (options.focus) pendingFocus.add(id);
  editor.view.dispatch(tr.scrollIntoView());
  if (options.item) processItem(editor, id, options.item);
  return true;
}

// 박스에 놓거나 고른 파일들 — 첫 파일은 이 박스 자리에, 나머지는 바로 뒤에 새 박스로 넣는다.
export function submitMediaItems(editor: Editor, id: string, items: MediaInputItem[]) {
  const found = findMediaInput(editor.state.doc, id);
  if (!found || !items.length) return;
  const [first, ...rest] = items;
  const after = found.pos + found.node.nodeSize;
  // 같은 위치에 거꾸로 넣어야 원래 순서가 된다. 뒤에 넣으므로 이 박스의 위치는 바뀌지 않는다.
  for (const item of rest.reverse()) {
    const kind = found.node.attrs.kind === "file" ? "file" : kindForItem(item);
    insertMediaInput(editor, kind, { item, at: after });
  }
  processItem(editor, id, first);
}

export function submitMediaUrl(editor: Editor, id: string, kind: MediaKind, url: string) {
  if (kind !== "file") {
    void runTask(editor, id, "주소 확인 중", "주소를 확인하지 못했습니다.", () => resolveUrlInput(kind, url));
    return;
  }
  void runTask(editor, id, "파일 정보 확인 중", "파일 정보를 확인하지 못했습니다.", async () => {
    const resolve = getServices(editor).resolveFileMetadata;
    const metadata = resolve ? await resolve(url).catch(() => null) : null;
    return { type: "file", src: url, name: fileNameFromUrl(url), size: metadata?.size ?? null, contentType: metadata?.contentType ?? null };
  });
}

// 저장·임시저장·보내기에 쓰는 본문 HTML — 아직 내용이 정해지지 않은 박스는 문서에 남기지 않는다.
export function serializeContent(editor: Editor): string {
  const ranges: { from: number; to: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== MEDIA_INPUT_NODE) return true;
    ranges.push({ from: pos, to: pos + node.nodeSize });
    return false;
  });
  if (!ranges.length) return editor.getHTML();
  const tr = editor.state.tr;
  for (const range of ranges.reverse()) tr.delete(range.from, range.to);
  return getHTMLFromFragment(tr.doc.content, editor.schema);
}

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function createMediaInputPlugin(editor: Editor) {
  // 방향키로 옮긴 선택인지 — 마우스(드래그 핸들 등)로 박스가 통째로 선택될 때는 입력창으로 옮기지 않는다.
  let movedByArrow = false;

  return new Plugin<ReadonlyMap<string, MediaInputStatus>>({
    key: mediaInputKey,
    state: {
      init: () => new Map(),
      apply(tr, previous) {
        let next = previous;
        const meta = tr.getMeta(mediaInputKey) as StatusMeta | undefined;
        if (meta) {
          const updated = new Map(previous);
          if (meta.status) updated.set(meta.id, meta.status);
          else updated.delete(meta.id);
          next = updated;
        }
        if (tr.docChanged && next.size) {
          const present = collectIds(tr.doc);
          if ([...next.keys()].some((id) => !present.has(id))) {
            next = new Map([...next].filter(([id]) => present.has(id)));
          }
        }
        return next;
      },
    },
    props: {
      // 기록만 하고 처리는 ProseMirror 기본 동작에 맡긴다(false).
      handleKeyDown(_view, event) {
        // Shift 등 보조키와 함께 누르면 선택 범위를 넓히는 중이라 입력창으로 들어가지 않는다.
        movedByArrow = ARROW_KEYS.has(event.key) && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
        return false;
      },
      handleDOMEvents: {
        mousedown() {
          movedByArrow = false;
          return false;
        },
      },
      handleDrop(view, event, _slice, moved) {
        if (moved || !view.editable) return false;
        const items = readDroppedItems(event.dataTransfer);
        if (!items.length) return false;
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return false;
        event.preventDefault();
        // 같은 위치에 거꾸로 넣어야 원래 순서가 된다.
        for (const item of [...items].reverse()) insertMediaInput(editor, kindForItem(item), { item, at: coords.pos });
        return true;
      },
      handlePaste(view, event) {
        const data = event.clipboardData;
        if (!view.editable || !data?.files.length) return false;
        // 오피스 프로그램은 표·글을 복사할 때 그 모양의 이미지도 함께 싣는다 — 글이 있으면 일반 붙여넣기에 맡긴다.
        if (data.getData("text/plain")) return false;
        for (const file of Array.from(data.files)) {
          insertMediaInput(editor, classifyFile(file.name, file.type), { item: { kind: "file", file } });
        }
        return true;
      },
    },
    view: (editorView) => ({
      // 진행 중이던 박스가 문서에서 사라지면(삭제·실행 취소) 그 작업을 멈춘다.
      update(view, previousState) {
        const current = mediaInputKey.getState(view.state);
        mediaInputKey.getState(previousState)?.forEach((_status, id) => {
          if (!current?.has(id)) controllers.get(id)?.abort();
        });

        // 방향키로 앞뒤 블록에서 박스로 오면 ProseMirror는 박스를 통째로 선택한다 — 그 대신 박스 안 입력창에 커서를 둔다.
        const arrived = movedByArrow && !view.state.selection.eq(previousState.selection);
        movedByArrow = false;
        const { selection } = view.state;
        if (!arrived || !(selection instanceof NodeSelection) || selection.node.type.name !== MEDIA_INPUT_NODE) return;
        // ProseMirror가 이 키 입력을 마치며 편집 영역에 포커스·선택을 다시 그린 뒤에 옮긴다.
        requestAnimationFrame(() => {
          if (!view.state.selection.eq(selection)) return;
          const dom = view.nodeDOM(selection.from);
          if (dom instanceof HTMLElement) dom.querySelector<HTMLInputElement>("input[data-media-input-url]")?.focus();
        });
      },
      destroy() {
        mediaInputKey.getState(editorView.state)?.forEach((_status, id) => controllers.get(id)?.abort());
      },
    }),
  });
}
