import { Extension } from "@tiptap/core";

// 저장 전 파일 ID가 없는 블록도 임시저장 배열의 항목과 연결할 수 있게 한다.
export const RecordFileAttributes = Extension.create({
  name: "recordFileAttributes",
  addGlobalAttributes() {
    return [{
      types: ["image", "audio", "video", "fileAttachment", "link"],
      attributes: {
        recordFileId: { default: null, rendered: false },
        fileId: { default: null, rendered: false },
      },
    }];
  },
});
