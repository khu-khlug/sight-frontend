import { mergeAttributes, Node } from "@tiptap/core";

/*
 * 동영상 파일을 직접 가리키는 주소(직접 올린 파일, 앱 안 파일, 직접 링크)를 <video>로 재생하는 블록이다.
 * 유튜브 주소는 이 노드가 아니라 Youtube 확장(iframe)이 맡는다.
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes({ controls: "", preload: "metadata" }, HTMLAttributes)];
  },
});
