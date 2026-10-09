import { useCallback, useEffect, useRef, useState } from "react";
import { AutosaveApi, type AutosaveMetadataDto, type AutosaveInput } from "../../../../api/public/group/AutosaveApi";
import { useCurrentUser } from "../../../../hooks/user/useCurrentUser";

const LOCAL_DEBOUNCE_MS = 1000;
const SERVER_INTERVAL_MS = 10_000;
const serverSavedTimes = new Map<string, number>();

type LocalDraft = AutosaveInput & { savedAt: number; serverSavedAt?: number };
type Options = {
  location: string;
  extra: string;
  // 저장이 필요한 순간에만 호출된다(글자마다 호출되지 않는다) — 호출 시점에 본문을 직렬화해서 돌려준다.
  getContent: () => string;
  isDirty: boolean;
  ready: boolean;
  autoload: boolean;
  onRestore: (content: string) => void;
  // 로컬 임시저장 디바운스가 끝날 때(입력이 잠잠해진 시점) 함께 호출된다 — 편집기 목차 갱신에 쓴다.
  onSettled?: () => void;
};
type Session = {
  changed: () => void;
  flush: (leaving?: boolean) => Promise<void>;
  pause: () => void;
  resume: () => void;
  clear: () => Promise<void>;
};

function signature(draft: { location: string; content: string; extra?: string | null }): string {
  return JSON.stringify([draft.location, draft.content, draft.extra ?? null]);
}

function readLocal(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (typeof draft !== "object" || draft === null) return null;
    const item = draft as Partial<LocalDraft>;
    if (typeof item.location !== "string" || typeof item.content !== "string"
      || typeof item.extra !== "string" || typeof item.savedAt !== "number") return null;
    // 기존 로컬 형식은 저장 시각을 수정 시각으로 사용해 복원한다.
    const updatedAt = item.updatedAt ?? item.savedAt;
    if (!Number.isSafeInteger(updatedAt) || updatedAt < 0) return null;
    return { ...item, updatedAt } as LocalDraft;
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
  const { location, ready } = options;

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
    let observedVersion = versionRef.current;
    let observedExtra = latest.current.extra;
    setIsSaved(false);
    setError(null);

    const snapshot = (): AutosaveInput => ({
      location: latest.current.location,
      content: latest.current.getContent(),
      extra: latest.current.extra,
      updatedAt: draftUpdatedAt,
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
      const draft = snapshot();
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...draft, savedAt: Date.now(), serverSavedAt: lastSavedAt }));
        localSignature = signature(draft);
        hasDraft = true;
        if (active) setError(null);
        return true;
      } catch {
        localSignature = null;
        if (active) setError("로컬 임시저장에 실패했습니다.");
        return false;
      }
    };
    const scheduleServer = (retry = false) => {
      clearTimeout(serverTimer);
      if (!active || !needsSave() || debounceTimer !== undefined || inFlight) return;
      const current = signature(snapshot());
      if (current !== localSignature || current === serverSignature) return;
      lastSavedAt = serverSavedTimes.get(storageKey) ?? lastSavedAt;
      const wait = retry ? SERVER_INTERVAL_MS : Math.max(0, lastSavedAt + SERVER_INTERVAL_MS - Date.now());
      serverTimer = setTimeout(() => { void send(false, false); }, wait);
    };
    const send = async (force: boolean, leaving: boolean): Promise<void> => {
      if (!needsLocalSave() || (!checked && !force)) return;
      if (inFlight) {
        // 같은 내용을 중복 전송하지 않는다. 다른 내용은 기존 요청 뒤에 보낸다.
        if (signature(snapshot()) === inFlightSignature && (!leaving || inFlightLeaving)) return inFlight;
        if (!force) return;
        await inFlight;
        return send(force, leaving);
      }
      const sentVersion = versionRef.current;
      const draft = snapshot();
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
      inFlight = AutosaveApi.save(draft, { leaving })
        .then(() => {
          serverSignature = current;
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
            if (versionRef.current === sentVersion) setIsSaved(true);
            setError(null);
          }
        })
        .catch(() => {
          failed = true;
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
      if (observedVersion !== versionRef.current || observedExtra !== latest.current.extra) {
        draftUpdatedAt = Math.max(Date.now(), draftUpdatedAt + 1);
        observedVersion = versionRef.current;
        observedExtra = latest.current.extra;
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
      pause: () => { saveLocal(); paused = true; stopTimers(); },
      resume: () => { paused = false; changed(); },
      clear: async () => {
        cleared = true;
        stopTimers();
        setIsSaved(false);
        try { localStorage.removeItem(storageKey); } catch { /* 서버 삭제는 계속 시도한다. */ }
        await inFlight;
        await AutosaveApi.clear();
      },
    };
    sessionRef.current = session;

    const matches = (draft: AutosaveMetadataDto | LocalDraft) => {
      if (draft.location !== latest.current.location) return false;
      try {
        return JSON.parse(draft.extra ?? "null")?.groupId === JSON.parse(latest.current.extra).groupId;
      } catch {
        return false;
      }
    };

    const canRestore = () => active && !paused && !cleared && !changedDuringLoad && !wroteToServer;
    const restore = async () => {
      const server = await AutosaveApi.getMetadata();
      if (!canRestore()) return;
      if (server && (!Number.isSafeInteger(server.updatedAt) || server.updatedAt < 0)) {
        throw new Error("서버 임시저장의 수정 시각이 올바르지 않습니다.");
      }
      const currentLocal = readLocal(storageKey);
      // 회원별 슬롯 전체에서 최신 초안을 고른 뒤에 현재 대상과 비교한다.
      // 최신 로컬 초안이 다른 카드라면 현재 카드의 오래된 서버 초안을 제안하지 않는다.
      const useLocal = currentLocal !== null && (!server || currentLocal.updatedAt > server.updatedAt);
      const metadata = useLocal ? currentLocal : server;
      if (!metadata || !matches(metadata)) return;
      if (!latest.current.autoload && !window.confirm(
        "임시저장된 내용이 있습니다. 불러올까요? 불러오지 않고 계속 작성하면 이 임시저장은 덮어씌워질 수 있습니다.",
      )) return;

      // 서버 본문은 복구를 선택한 뒤에만 요청한다.
      const draft = useLocal ? readLocal(storageKey) : await AutosaveApi.get();
      if (!canRestore()) return;
      if (!draft || draft.location !== metadata.location || draft.updatedAt !== metadata.updatedAt
        || draft.extra !== metadata.extra) {
        setError("임시저장이 변경되었습니다. 편집창을 다시 열어 최신 초안을 확인하세요.");
        return;
      }
      if (!useLocal) {
        serverSignature = signature(draft);
        setIsSaved(true);
      }
      hasDraft = true;
      draftUpdatedAt = draft.extra === latest.current.extra
        ? draft.updatedAt : Math.max(Date.now(), draft.updatedAt + 1);
      observedVersion = versionRef.current;
      observedExtra = latest.current.extra;
      latest.current = { ...latest.current, isDirty: true };
      latest.current.onRestore(draft.content);
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
  }, [storageKey, location, ready]);

  useEffect(() => { sessionRef.current?.changed(); }, [options.extra, options.isDirty]);

  const flush = useCallback(() => sessionRef.current?.flush() ?? Promise.resolve(), []);
  const pause = useCallback(() => sessionRef.current?.pause(), []);
  const resume = useCallback(() => sessionRef.current?.resume(), []);
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
