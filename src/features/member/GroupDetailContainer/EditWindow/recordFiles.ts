import type { JSONContent } from "@tiptap/core";
import { KanbanApi, type RecordFileDto, type RecordFileInput, type RecordUploadDto } from "../../../../api/public/group/KanbanApi";
import type { DraggedFile } from "../../../../util/draggableFile";

type TrackedFile = RecordFileInput & { url: string | null; completed: boolean; previewUrl?: string; file?: File; uploadUrl?: string; sent?: boolean };
let sequence = 0;
const createFileId = () => `f-${Date.now().toString(36)}-${++sequence}`;
const siteFiles = new Map<string, { groupId: string; file: RecordFileDto }>();
const canonical = (url: string) => {
  try { return new URL(url, window.location.origin).href; }
  catch { return url; }
};

export function registerSiteFiles(files: RecordFileDto[] | undefined, groupId: string): void {
  for (const file of files ?? []) if (file.url) siteFiles.set(canonical(file.url), { groupId, file });
}
export function findSiteFile(url: string) { return siteFiles.get(canonical(url)); }
export function siteFileDrag(url: string): DraggedFile | null {
  const file = findSiteFile(url)?.file;
  return file?.url ? { url: file.url, name: file.name, size: file.size, contentType: file.contentType } : null;
}

export class RecordFileTracker {
  private files = new Map<string, TrackedFile>();
  private uploading: Promise<void> | null = null;
  private referencedIds = new Set<string>();

  reset(files: RecordFileDto[] | undefined) {
    this.dispose();
    this.files = new Map((files ?? []).map((file) => [file.id, { ...file, completed: file.url !== null }]));
  }
  dispose() {
    for (const file of this.files.values()) if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
  }
  merge(files: RecordFileDto[] | undefined) {
    for (const file of files ?? []) this.files.set(file.id, { ...file, completed: file.url !== null });
  }
  addLocal(file: File): string {
    const id = createFileId();
    const previewUrl = URL.createObjectURL(file);
    this.files.set(id, { id, fileId: null, name: file.name, size: file.size, contentType: file.type || "application/octet-stream", url: null, completed: false, previewUrl, file });
    return previewUrl;
  }
  addExisting(file: RecordFileDto & { url: string }): string {
    for (const tracked of this.files.values()) if (tracked.fileId === file.fileId && tracked.url) return tracked.url;
    const id = createFileId();
    this.files.set(id, { ...file, id, completed: true });
    return file.url;
  }

  // JSON의 주소 속성만 처리하며 조회 본문에 파일 배열의 URL을 주입하지 않는다.
  toServer(content: string, validation: "draft" | "submit" | "complete" = "draft"): { content: string; files: RecordFileInput[] } {
    const document: JSONContent = content.trim() ? JSON.parse(content) : { type: "doc", content: [{ type: "paragraph" }] };
    const referenced = new Map<string, RecordFileInput>();
    const visit = (node: JSONContent) => {
      const attrs = node.attrs;
      if (attrs) {
        for (const key of ["src", "href"]) {
          if (!(key in attrs)) continue;
          const source: unknown = attrs[key];
          const file = typeof attrs.recordFileId === "string" ? this.files.get(attrs.recordFileId) : undefined;
          const tracked = file ?? [...this.files.values()].find((entry) => typeof source === "string" && !!source
            && (source === entry.previewUrl || (entry.url && canonical(source) === canonical(entry.url))));
          if (tracked) {
            if (validation !== "draft" && !tracked.completed && !tracked.file) throw new Error("업로드하지 못한 파일을 지운 뒤 다시 첨부해 주세요.");
            if (validation === "complete" && !tracked.completed) throw new Error("첨부 파일 업로드가 끝나지 않았습니다. 다시 저장해 주세요.");
            attrs.recordFileId = tracked.id;
            attrs.fileId = tracked.fileId;
            attrs[key] = tracked.url ?? (tracked.fileId && typeof source === "string" && !source.startsWith("blob:") ? source : "");
            const { id, fileId, name, size, contentType } = tracked;
            referenced.set(id, { id, fileId, name, size, contentType });
            break;
          }
          if (typeof source === "string" && source.startsWith("blob:")) attrs[key] = "";
        }
      }
      node.content?.forEach(visit);
      node.marks?.forEach(visit);
    };
    visit(document);
    this.referencedIds = new Set(referenced.keys());
    return { content: JSON.stringify(document), files: [...referenced.values()] };
  }
  replacements(): { from: string; to: string }[] {
    return [...this.files.values()].flatMap((file) => file.previewUrl && file.url ? [{ from: file.previewUrl, to: file.url }] : []);
  }

  async applyUploads(groupId: string, uploads: RecordUploadDto[] | undefined): Promise<void> {
    for (const upload of uploads ?? []) {
      const file = this.files.get(upload.id);
      if (file) { file.fileId = upload.fileId; file.url = upload.url; file.uploadUrl = upload.uploadUrl; }
    }
    const next = (this.uploading ?? Promise.resolve()).catch(() => undefined).then(() => this.uploadPending(groupId));
    this.uploading = next;
    try { await next; } finally { if (this.uploading === next) this.uploading = null; }
  }
  private async uploadPending(groupId: string): Promise<void> {
    const ready: TrackedFile[] = [];
    let failed = false;
    for (const file of this.files.values()) {
      if (!this.referencedIds.has(file.id)) continue;
      if (!file.file || !file.uploadUrl || !file.fileId) continue;
      if (!file.sent) {
        const response = await fetch(file.uploadUrl, { method: "PUT", body: file.file }).catch(() => null);
        if (!response?.ok) { failed = true; continue; }
        file.sent = true;
      }
      ready.push(file);
    }
    if (ready.length) {
      const results = await KanbanApi.notifyRecordFilesUploaded(groupId, ready.map((file) => file.fileId!));
      for (const file of ready) {
        const result = results.find((item) => item.fileId === file.fileId);
        if (result?.isSuccess) { file.completed = true; file.file = undefined; file.uploadUrl = undefined; }
        else { failed = true; if (result?.reason === "NOT_UPLOADED") file.sent = false; }
      }
    }
    if (failed) throw new Error("일부 첨부 파일을 올리지 못했습니다. 다시 저장해 주세요.");
  }
}
