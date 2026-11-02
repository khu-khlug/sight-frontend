import { KanbanApi, type RecordFileDto, type RecordFileInput, type RecordUploadDto } from "../../../../api/public/group/KanbanApi";
import type { DraggedFile } from "../../../../util/draggableFile";

/*
 * 기록 본문의 첨부 파일. 서버는 본문을 파싱하지 않으므로, 본문에는 실제 주소 대신 기록 안에서만 유일한
 * 식별자 토큰("sightfile:<식별자>")을 넣고, 식별자와 백엔드 파일 아이디의 대응은 요청의 files 배열로 보낸다.
 * 편집 중에는 편집기가 바로 보여 줄 수 있게 토큰 대신 읽기 링크(새 파일은 blob 주소)를 넣어 두고,
 * 서버로 보낼 때 토큰으로, 받을 때 주소로 바꾼다.
 */
const TOKEN_PREFIX = "sightfile:";
const token = (id: string) => `${TOKEN_PREFIX}${id}`;
const replaceAll = (text: string, from: string, to: string) => text.split(from).join(to);

// file·uploadUrl은 아직 올리지 못한 새 파일에만 있다. 올리기에 실패하면 다음 저장 때 같은 주소로 다시 올린다.
type TrackedFile = RecordFileInput & { url: string | null; file?: File; uploadUrl?: string };

let sequence = 0;
// 기존 기록의 식별자와 겹치지 않으면 된다. 시각과 순번을 섞어 한 기록 안에서 유일하게 만든다.
const createFileId = () => `f-${Date.now().toString(36)}-${(sequence += 1).toString(36)}`;

/*
 * 화면에 보여 준 기록 첨부 파일의 읽기 링크 → 그룹·백엔드 파일. 그 링크를 편집창에 끌어 놓으면 같은 그룹 파일은
 * 다시 올리지 않고 백엔드 파일 아이디로 참조한다. 읽기 링크는 만료되므로 본문에 링크를 그대로 넣지 않기 위해서다.
 */
const siteFiles = new Map<string, { groupId: number; file: RecordFileDto }>();

export function findSiteFile(url: string): { groupId: number; file: RecordFileDto } | undefined {
  return siteFiles.get(url);
}

// 기록 뷰어의 본문 이미지를 끌 때 쓴다. 사이트에 저장된 기록 첨부 파일만 앱 안 파일 요소로 끌고, 외부 주소는 기본 끌기로 둔다.
export function siteFileDrag(url: string): DraggedFile | null {
  const file = siteFiles.get(url)?.file;
  return file?.url ? { url: file.url, name: file.name, size: file.size, contentType: file.contentType } : null;
}

// 조회 응답의 본문을 화면에 보여 줄 때 토큰을 읽기 링크로 바꾼다. 업로드가 끝나지 않은 파일은 토큰을 그대로 둔다.
export function resolveRecordContent(content: string, files: RecordFileDto[] | undefined, groupId: number): string {
  let resolved = content;
  for (const file of files ?? []) {
    if (!file.url) continue;
    siteFiles.set(file.url, { groupId, file });
    resolved = replaceAll(resolved, token(file.id), file.url);
  }
  return resolved;
}

export class RecordFileTracker {
  private files = new Map<string, TrackedFile>();

  reset(files: RecordFileDto[] | undefined) {
    for (const file of this.files.values()) if (file.file && file.url) URL.revokeObjectURL(file.url);
    this.files = new Map((files ?? []).map((file) => [file.id, {
      id: file.id, fileId: file.fileId, name: file.name, size: file.size, contentType: file.contentType, url: file.url,
    }]));
  }

  // 임시저장을 불러올 때 그 임시저장의 파일 매핑을 더한다. 같은 식별자는 새 값으로 바꾼다.
  merge(files: RecordFileDto[] | undefined) {
    for (const file of files ?? []) {
      this.files.set(file.id, { id: file.id, fileId: file.fileId, name: file.name, size: file.size, contentType: file.contentType, url: file.url });
    }
  }

  // 편집기에 새 파일을 넣을 때 쓴다. 올리지 않고 blob 주소를 돌려주며, 실제 업로드는 저장 응답을 받은 뒤에 한다.
  addLocal(file: File): string {
    const id = createFileId();
    const url = URL.createObjectURL(file);
    this.files.set(id, { id, fileId: null, name: file.name, size: file.size, contentType: file.type || "application/octet-stream", url, file });
    return url;
  }

  // 같은 그룹의 업로드된 파일을 참조로 넣는다. 이미 참조 중인 파일이면 그 항목의 링크를 그대로 쓴다.
  addExisting(file: RecordFileDto & { url: string }): string {
    for (const tracked of this.files.values()) {
      if (tracked.fileId === file.fileId && tracked.url) return tracked.url;
    }
    const id = createFileId();
    this.files.set(id, { id, fileId: file.fileId, name: file.name, size: file.size, contentType: file.contentType, url: file.url });
    return file.url;
  }

  // 서버에서 받은 본문을 편집기에 넣을 형태로 바꾼다.
  fromServer(content: string): string {
    let resolved = content;
    for (const file of this.files.values()) if (file.url) resolved = replaceAll(resolved, token(file.id), file.url);
    return resolved;
  }

  // 편집기 본문을 서버로 보낼 형태로 바꾸고, 본문이 참조하는 파일 전체를 files 배열로 만든다.
  toServer(html: string): { content: string; files: RecordFileInput[] } {
    let content = html;
    const files: RecordFileInput[] = [];
    for (const file of this.files.values()) {
      if (file.url && content.includes(file.url)) content = replaceAll(content, file.url, token(file.id));
      if (content.includes(token(file.id))) {
        files.push({ id: file.id, fileId: file.fileId, name: file.name, size: file.size, contentType: file.contentType });
      }
    }
    return { content, files };
  }

  // 저장 응답의 업로드 정보로 새 파일을 올리고 서버에 알린다. 반영된 fileId는 다음 저장부터 함께 보낸다.
  async applyUploads(groupId: number, uploads: RecordUploadDto[] | undefined): Promise<void> {
    for (const upload of uploads ?? []) {
      const file = this.files.get(upload.id);
      if (!file) continue;
      file.fileId = upload.fileId;
      file.uploadUrl = upload.uploadUrl;
    }
    const uploaded: string[] = [];
    let failed = false;
    for (const file of this.files.values()) {
      if (!file.file || !file.uploadUrl || !file.fileId) continue;
      const response = await fetch(file.uploadUrl, { method: "PUT", body: file.file }).catch(() => null);
      if (!response?.ok) { failed = true; continue; }
      uploaded.push(file.fileId);
      file.file = undefined;
      file.uploadUrl = undefined;
    }
    if (uploaded.length) {
      const results = await KanbanApi.notifyRecordFilesUploaded(groupId, uploaded);
      if (results.some((result) => !result.isSuccess)) failed = true;
    }
    if (failed) throw new Error("일부 첨부 파일을 올리지 못했습니다.");
  }
}
