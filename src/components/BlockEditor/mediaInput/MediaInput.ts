import { Extension, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import MediaInputView from "./MediaInputView";
import { createMediaInputPlugin, MEDIA_INPUT_NODE } from "./mediaInputState";
import type { MediaInputOptions } from "./mediaInputState";

/*
 * 이미지·오디오·동영상·파일을 넣기 전에 커서 자리에 놓이는 입력 박스다(수식 입력 상자와 같은 역할).
 * 내용이 정해지면 그 자리가 실제 노드(image/audio/youtube/fileAttachment)로 바뀐다.
 * 박스 자체는 저장하지 않는다 — parseHTML이 없고, 본문을 꺼낼 때 serializeContent가 뺀다.
 */
export const MediaInput = Node.create<MediaInputOptions>({
  name: MEDIA_INPUT_NODE,
  group: "block",
  atom: true,

  addOptions() {
    return { services: null };
  },

  addAttributes() {
    return {
      kind: { default: "image", rendered: false },
      id: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [];
  },

  renderHTML() {
    return ["div", { "data-media-input": "" }];
  },

  addNodeView() {
    // 박스 안의 입력·드롭·붙여넣기는 박스가 직접 처리한다 — ProseMirror가 본문 편집으로 가로채지 않게 한다.
    return ReactNodeViewRenderer(MediaInputView, { stopEvent: () => true });
  },
});

// 박스 밖 본문에 파일을 놓거나 붙여넣을 때도 박스를 거쳐 넣는다. 목록 드롭(ConvertListDrop) 등 다른 드롭
// 처리보다 먼저 파일을 받아야 해서 우선순위를 높인다.
export const MediaInputDrop = Extension.create({
  name: "mediaInputDrop",
  priority: 1000,

  addProseMirrorPlugins() {
    return [createMediaInputPlugin(this.editor)];
  },
});
