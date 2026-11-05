import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordFileDto, RecordFileInput, RecordUploadDto } from "../../../../api/public/group/KanbanApi";
import { AutosaveApi, type AutosaveInput, type AutosaveTarget } from "../../../../api/public/group/AutosaveApi";
import { useCurrentUser } from "../../../../hooks/user/useCurrentUser";

const LOCAL_DEBOUNCE_MS = 1000;
const SERVER_INTERVAL_MS = 10_000;
const serverSavedTimes = new Map<string, number>();

// 로컬 초안은 서버 요청과 같은 형식이다. 서버는 경로로 그룹을 정하므로 로컬에는 그룹 아이디를 함께 둔다.
type LocalDraft = AutosaveInput & { groupId: number; savedAt: number; serverSavedAt?: number };
type Options = {
  groupId: number;
  // false면 서버 임시저장을 보내지 않는다. 종료 그룹은 서버 임시저장을 받지 않는다.
  serverEnabled?: boolean;
  // 작성 중인 카드. 기존 기록 수정은 기록을 조회한 뒤에 알 수 있으며, 알기 전에는 ready를 false로 둔다.
  cardId: string | null;
  // 수정 중인 기록 아이디. 새 기록이면 null이다.
  recordId: number | null;
  // 저장이 필요한 순간에만 호출된다(글자마다 호출되지 않는다) — 호출 시점에 본문을 직렬화해서 돌려준다.
  getContent: () => string;
  // 본문이 참조하는 첨부 파일 전체. 임시저장 요청에 함께 보낸다.
  getFiles?: () => RecordFileInput[];
  // 임시저장 응답의 새 파일 업로드 정보를 받는다.
  onUploads?: (uploads: RecordUploadDto[]) => Promise<void>;
  isDirty: boolean;
  ready: boolean;
  autoload: boolean;
  onRestore: (content: string, files?: RecordFileDto[]) => void;
  // 로컬 임시저장 디바운스가 끝날 때(입력이 잠잠해진 시점) 함께 호출된다 — 편집기 목차 갱신에 쓴다.
  onSettled?: () => void;
};
type Session = {
  changed: () => void;
  flush: (leaving?: boolean) => Promise<void>;
  pause: () => Promise<void>;
  resume: (recordId?: number) => void;
  clear: () => Promise<void>;
};

function signature(draft: AutosaveTarget & { content: string }): string {
  return JSON.stringify([draft.cardId, draft.recordId, draft.content, "files" in draft ? draft.files : []]);
}

// 새 기록은 카드로, 기존 기록 수정은 기록으로 같은 대상인지 본다(기록은 다른 카드로 옮겨졌을 수 있다).
function isSameTarget(left: AutosaveTarget, right: AutosaveTarget): boolean {
  return right.recordId !== null ? left.recordId === right.recordId : left.recordId === null && left.cardId === right.cardId;
}

// 형식이 맞지 않는 로컬 초안(이전 형식 포함)은 없는 것으로 본다.
function readLocal(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (typeof draft !== "object" || draft === null) return null;
    const item = draft as Partial<LocalDraft>;
    if (typeof item.groupId !== "number" || typeof item.cardId !== "string"
      || (item.recordId !== null && typeof item.recordId !== "number") || typeof item.content !== "string"
      || !Array.isArray(item.files) || typeof item.updatedAt !== "string" || Number.isNaN(Date.parse(item.updatedAt))
      || typeof item.savedAt !== "number") return null;
    const document = JSON.parse(item.content);
    if (!document || document.type !== "doc") return null;
    return item as LocalDraft;
  } catch {
    return null;
  }
}

export function useRecordDraft(options: Options) {
  const { data: user } = useCurrentUser();
  const latest = useRef(options);
  latest.current = options;
  const sessionRef = useRef<Session | null>(null);
  // 입력이 있을 때마다 올라간다 — 본문을 직렬화·비교하지 않고도 "저장 이후 입력이 있었는지"를 알 수 있다.
  const versionRef = useRef(0);
  // 서버 임시저장이 성공한 뒤 입력이 아직 없을 때만 true — "임시저장됨" 뱃지가 이 값을 따른다.
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = user ? `sight:record-draft:${user.id}` : null;
  const { ready } = options;
  // 대상이 바뀌면 임시저장 세션을 새로 시작한다.
  const targetKey = options.recordId !== null ? `record:${options.recordId}` : `new:${options.cardId}`;

  useEffect(() => {
    if (!storageKey || !ready) return;
    let active = true;
    let checked = false;
    let paused = false;
    let cleared = false;
    let hasDraft = false;
    let changedDuringLoad = latest.current.isDirty;
    const loadingVersion = versionRef.current;
    let localSignature: string | null = null;
    let serverSignature: string | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let serverTimer: ReturnType<typeof setTimeout> | undefined;
    let inFlight: Promise<void> | null = null;
    let inFlightSignature: string | null = null;
    let inFlightLeaving = false;
    const local = readLocal(storageKey);
    let lastSavedAt = serverSavedTimes.get(storageKey)
      ?? (typeof local?.serverSavedAt === "number" ? local.serverSavedAt : 0);
    let wroteToServer = false;
    let draftUpdatedAt = Date.now();
    let savedRecordId = latest.current.recordId;
    let observedVersion = versionRef.current;
    setIsSaved(false);
    setError(null);

    // ready가 된 뒤에만 세션이 돌므로 cardId는 정해져 있다.
    const snapshot = (): AutosaveInput => ({
      cardId: latest.current.cardId ?? "",
      recordId: savedRecordId,
      content: latest.current.getContent(),
      files: latest.current.getFiles?.() ?? [],
      updatedAt: new Date(draftUpdatedAt).toISOString(),
    });
    const stopTimers = () => {
      clearTimeout(debounceTimer);
      clearTimeout(serverTimer);
      debounceTimer = undefined;
      serverTimer = undefined;
    };
    const needsLocalSave = () => !cleared && !paused
      && (latest.current.isDirty || hasDraft);
    const needsSave = () => checked && needsLocalSave();
    const saveLocal = () => {
      if (!needsLocalSave()) return false;
      try {
        const draft = snapshot();
        const stored: LocalDraft = { ...draft, groupId: latest.current.groupId, savedAt: Date.now(), serverSavedAt: lastSavedAt };
        localStorage.setItem(storageKey, JSON.stringify(stored));
        localSignature = signature(draft);
        hasDraft = true;
        if (active) setError(null);
        return true;
      } catch {
        localSignature = null;
        if (active) setError("임시저장을 준비하지 못했습니다. 업로드하지 못한 파일은 다시 첨부해 주세요.");
        return false;
      }
    };
    const scheduleServer = (retry = false) => {
      clearTimeout(serverTimer);
      if (!active || !needsSave() || debounceTimer !== undefined || inFlight) return;
      let current: string;
      try { current = signature(snapshot()); } catch { return; }
      if (current !== localSignature || current === serverSignature) return;
      lastSavedAt = serverSavedTimes.get(storageKey) ?? lastSavedAt;
      const wait = retry ? SERVER_INTERVAL_MS : Math.max(0, lastSavedAt + SERVER_INTERVAL_MS - Date.now());
      serverTimer = setTimeout(() => { void send(false, false); }, wait);
    };
    const send = async (force: boolean, leaving: boolean): Promise<void> => {
      if (!needsLocalSave() || (!checked && !force)) return;
      let draft: AutosaveInput;
      try { draft = snapshot(); }
      catch (error) { if (active) setError(error instanceof Error ? error.message : "임시저장을 준비하지 못했습니다."); return; }
      if (inFlight) {
        // 같은 내용을 중복 전송하지 않는다. 다른 내용은 기존 요청 뒤에 보낸다.
        if (signature(draft) === inFlightSignature && (!leaving || inFlightLeaving)) return inFlight;
        if (!force) return;
        await inFlight;
        return send(force, leaving);
      }
      if (latest.current.serverEnabled === false || !latest.current.cardId) return;
      const sentVersion = versionRef.current;
      const current = signature(draft);
      lastSavedAt = serverSavedTimes.get(storageKey) ?? lastSavedAt;
      if (current === serverSignature) return;
      if (!force && (debounceTimer !== undefined || current !== localSignature)) return;
      if (!force && Date.now() < lastSavedAt + SERVER_INTERVAL_MS) {
        scheduleServer();
        return;
      }
      inFlightSignature = current;
      inFlightLeaving = leaving;
      wroteToServer = true;
      let failed = false;
      inFlight = AutosaveApi.save(latest.current.groupId, draft, { leaving })
        .then(async (uploads) => {
          await latest.current.onUploads?.(uploads);
          if (cleared) return;
          let savedSignature = current;
          let completed = snapshot();
          // 업로드 중 새 파일이 들어와도 ID·주소 반영을 끝낸 뒤에만 저장 완료로 본다.
          while (signature(completed) !== savedSignature && !cleared) {
            const followup = await AutosaveApi.save(latest.current.groupId, completed, { leaving });
            savedSignature = signature(completed);
            await latest.current.onUploads?.(followup);
            completed = snapshot();
          }
          serverSignature = savedSignature;
          saveLocal();
          lastSavedAt = Date.now();
          serverSavedTimes.set(storageKey, lastSavedAt);
          // 입력 본문은 덮어쓰지 않고 다음 창/새로고침에서도 전송 간격을 유지한다.
          const stored = readLocal(storageKey);
          if (stored) {
            try { localStorage.setItem(storageKey, JSON.stringify({ ...stored, serverSavedAt: lastSavedAt })); }
            catch { /* 기존 로컬 초안은 유지된다. */ }
          }
          if (active && !cleared) {
            // 전송 중에 입력이 더 있었다면 지금 내용은 서버에 없으므로 뱃지를 띄우지 않는다.
            if (versionRef.current === sentVersion || signature(snapshot()) === serverSignature) setIsSaved(true);
            setError(null);
          }
        })
        .catch(() => {
          failed = true;
          saveLocal();
          if (active && !cleared) setError("서버 임시저장에 실패했습니다.");
        })
        .finally(() => {
          inFlight = null;
          inFlightSignature = null;
          scheduleServer(failed);
        });
      return inFlight;
    };
    const changed = () => {
      if (observedVersion !== versionRef.current) {
        draftUpdatedAt = Math.max(Date.now(), draftUpdatedAt + 1);
        observedVersion = versionRef.current;
      }
      changedDuringLoad ||= versionRef.current !== loadingVersion || latest.current.isDirty;
      // 입력 후 전부 지우거나 원문으로 되돌려도 이전 초안이 남지 않도록 저장한다.
      hasDraft ||= latest.current.isDirty;
      stopTimers();
      if (!needsLocalSave()) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        latest.current.onSettled?.();
        if (saveLocal()) scheduleServer();
      }, LOCAL_DEBOUNCE_MS);
    };
    const flush = async (leaving = false) => {
      stopTimers();
      if (!needsLocalSave()) return;
      changedDuringLoad = true;
      saveLocal();
      // 종료 경로에서는 로컬 저장 실패와 무관하게 서버에도 최신 내용을 보낸다.
      await send(true, leaving);
    };
    const session: Session = {
      changed,
      flush,
      pause: async () => { saveLocal(); paused = true; stopTimers(); await inFlight; },
      resume: (recordId) => {
        if (recordId !== undefined) savedRecordId = recordId;
        paused = false;
        changed();
        saveLocal();
        scheduleServer();
      },
      clear: async () => {
        cleared = true;
        stopTimers();
        setIsSaved(false);
        try { localStorage.removeItem(storageKey); } catch { /* 서버 삭제는 계속 시도한다. */ }
        await inFlight;
        if (latest.current.serverEnabled !== false) await AutosaveApi.clear(latest.current.groupId);
      },
    };
    sessionRef.current = session;

    const currentTarget = (): AutosaveTarget => ({ cardId: latest.current.cardId ?? "", recordId: latest.current.recordId });

    const canRestore = () => active && !paused && !cleared && !changedDuringLoad && !wroteToServer;
    const restore = async () => {
      // 서버는 경로 그룹의 임시저장만 돌려준다.
      const server = await AutosaveApi.getMetadata(latest.current.groupId);
      if (!canRestore()) return;
      if (server && Number.isNaN(Date.parse(server.updatedAt))) {
        throw new Error("서버 임시저장의 수정 시각이 올바르지 않습니다.");
      }
      const currentLocal = readLocal(storageKey);
      // 로컬 초안은 서버 임시저장을 보조할 뿐이다. 서버에 이 그룹의 임시저장이 없으면 로컬 초안도 없는 것으로
      // 보고 복원하지 않는다. 있으면 이 그룹의 로컬 초안과 수정 시각을 비교해 더 최신인 것을 쓴다.
      if (!server) return;
      const useLocal = currentLocal !== null && currentLocal.groupId === latest.current.groupId
        && Date.parse(currentLocal.updatedAt) > Date.parse(server.updatedAt);
      const metadata = useLocal ? currentLocal : server;
      if (!isSameTarget(metadata, currentTarget())) return;
      if (!latest.current.autoload && !window.confirm(
        "임시저장된 내용이 있습니다. 불러올까요? 불러오지 않고 계속 작성하면 이 임시저장은 덮어씌워질 수 있습니다.",
      )) return;

      // 서버 본문은 복구를 선택한 뒤에만 요청한다.
      const serverDraft = await AutosaveApi.get(latest.current.groupId);
      const draft = useLocal ? readLocal(storageKey) : serverDraft;
      if (!canRestore()) return;
      if (!draft || draft.cardId !== metadata.cardId || draft.recordId !== metadata.recordId || draft.updatedAt !== metadata.updatedAt) {
        setError("임시저장이 변경되었습니다. 편집창을 다시 열어 최신 초안을 확인하세요.");
        return;
      }
      if (!useLocal) {
        serverSignature = signature(draft);
        setIsSaved(true);
      }
      hasDraft = true;
      // 기록이 그사이 다른 카드로 옮겨졌으면 지금 카드로 다시 저장해야 하므로 수정 시각을 올린다.
      const restoredAt = Date.parse(draft.updatedAt);
      draftUpdatedAt = draft.cardId === latest.current.cardId ? restoredAt : Math.max(Date.now(), restoredAt + 1);
      observedVersion = versionRef.current;
      latest.current = { ...latest.current, isDirty: true };
      // 본문은 그대로 복원하며 파일 배열은 연결 관리에 사용한다.
      // 로컬 요청에는 완료 상태가 없으므로 같은 대상의 서버 파일 정보로 보완한다.
      const serverFiles = serverDraft && isSameTarget(serverDraft, draft) ? serverDraft.files : [];
      latest.current.onRestore(draft.content, (draft.files ?? []).map((file) => {
        const stored = serverFiles.find((entry) => entry.id === file.id && (file.fileId === null || entry.fileId === file.fileId));
        return stored ?? { ...file, url: "url" in file ? file.url as string | null : null };
      }) as RecordFileDto[]);
    };
    void restore().catch(() => {
      if (!active || paused || cleared) return;
      // 서버 시각을 확인하지 못하면 어느 슬롯이 최신인지 추측해서 복원하지 않는다.
      setError("임시저장을 조회하지 못했습니다. 편집창을 다시 열어 복구를 시도하세요.");
    }).finally(() => {
      if (!active) return;
      checked = true;
      changed();
    });

    const onLeave = () => { void flush(true); };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") onLeave();
    };
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      // 창 교체·내부 페이지 이동도 마지막 입력을 보존한다.
      active = false;
      void flush();
      stopTimers();
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [storageKey, targetKey, ready]);

  useEffect(() => { sessionRef.current?.changed(); }, [options.isDirty]);

  const flush = useCallback(() => sessionRef.current?.flush() ?? Promise.resolve(), []);
  const pause = useCallback(() => sessionRef.current?.pause() ?? Promise.resolve(), []);
  const resume = useCallback((recordId?: number) => sessionRef.current?.resume(recordId), []);
  const clear = useCallback(() => sessionRef.current?.clear() ?? Promise.resolve(), []);
  // 글자마다 호출된다 — 본문은 직렬화하지 않고 입력이 있었다는 사실과 타이머만 갱신한다.
  const touch = useCallback(() => {
    versionRef.current += 1;
    setIsSaved(false);
    // React가 다음 렌더를 하기 전 이탈하더라도 입력이 있었던 것으로 취급한다.
    latest.current = { ...latest.current, isDirty: true };
    sessionRef.current?.changed();
  }, []);
  return { isSaved, error, flush, pause, resume, clear, touch };
}
