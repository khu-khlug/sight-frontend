export type GroupPagePreferences = Readonly<{
  dualWindowEnabled: boolean;
  splitRatio: number;
}>;

const STORAGE_KEY = "sight:group-page-preferences";
const defaults: GroupPagePreferences = Object.freeze({ dualWindowEnabled: true, splitRatio: 0.7 });
let snapshot = defaults;
let initialized = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): GroupPagePreferences {
  try {
    const value: unknown = raw === null ? null : JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) return defaults;
    const settings = value as Record<string, unknown>;
    return Object.freeze({
      dualWindowEnabled: typeof settings.dualWindowEnabled === "boolean" ? settings.dualWindowEnabled : defaults.dualWindowEnabled,
      splitRatio: typeof settings.splitRatio === "number" && Number.isFinite(settings.splitRatio) && settings.splitRatio >= 0 && settings.splitRatio <= 1
        ? settings.splitRatio : defaults.splitRatio,
    });
  } catch {
    return defaults;
  }
}

function publish(next: GroupPagePreferences) {
  if (next.dualWindowEnabled === snapshot.dualWindowEnabled && next.splitRatio === snapshot.splitRatio) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    snapshot = defaults;
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    publish(parse(event.newValue));
  });
}

// UI와 창 배치 코드는 영구 저장값에 이 객체를 통해서만 접근한다.
export const groupPagePreferences = {
  getSnapshot(): GroupPagePreferences {
    initialize();
    return snapshot;
  },
  subscribe(listener: () => void): () => void {
    initialize();
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  update(patch: Partial<GroupPagePreferences>): void {
    initialize();
    const next = parse(JSON.stringify({ ...snapshot, ...patch, version: 1 }));
    if (next.dualWindowEnabled === snapshot.dualWindowEnabled && next.splitRatio === snapshot.splitRatio) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...next }));
    } catch {
      // Keep the in-memory preference usable when storage is unavailable.
    }
    publish(next);
  },
};
