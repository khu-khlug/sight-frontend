import type { LayoutState } from "./windowManager";
import { encodeWindowHash } from "./windowHash";

export type WindowSnapshot = {
  state: LayoutState | null;
  roleData: Record<number, string>;
  windowIds: Record<number, number>;
  splitRatio: number;
  mainSide: "left" | "right";
};

// URL은 공유 가능한 배치만 담고, 브라우저 히스토리는 창 인스턴스의 동일성도 보존한다.
export type WindowHistoryState = {
  version: 1;
  hash: string;
  windowIds: Record<number, number>;
  splitRatio?: number;
  mainSide?: "left" | "right";
};

export function windowHistoryState(snapshot: WindowSnapshot): WindowHistoryState {
  return {
    version: 1, hash: encodeWindowHash(snapshot.state, snapshot.roleData), windowIds: snapshot.windowIds,
    splitRatio: snapshot.splitRatio, mainSide: snapshot.mainSide,
  };
}

export function readWindowHistory(value: unknown, hash: string, roleData: Record<number, string>): WindowHistoryState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WindowHistoryState>;
  if (candidate.version !== 1 || candidate.hash !== hash || !candidate.windowIds || typeof candidate.windowIds !== "object") return null;
  if (candidate.splitRatio !== undefined && (typeof candidate.splitRatio !== "number" || !Number.isFinite(candidate.splitRatio) || candidate.splitRatio < 0 || candidate.splitRatio > 1)) return null;
  if (candidate.mainSide !== undefined && candidate.mainSide !== "left" && candidate.mainSide !== "right") return null;
  const ids: Record<number, number> = {};
  const used = new Set<number>();
  for (const role of Object.keys(roleData)) {
    const id = candidate.windowIds[Number(role)];
    if (!Number.isSafeInteger(id) || id < 0 || used.has(id)) return null;
    ids[Number(role)] = id;
    used.add(id);
  }
  return { version: 1, hash, windowIds: ids, splitRatio: candidate.splitRatio, mainSide: candidate.mainSide };
}

export function restoreWindowIds(
  current: WindowSnapshot,
  roleData: Record<number, string>,
  history: WindowHistoryState | null,
  allocate: () => number,
  resolveHistoryId: (id: number, key: string) => number,
): Record<number, number> {
  if (history) return Object.fromEntries(Object.entries(roleData).map(([role, key]) =>
    [role, resolveHistoryId(history.windowIds[Number(role)], key)]));
  // 공유 주소에는 ID가 없으므로 같은 슬롯을 먼저 대응시키고, 남은 창은 콘텐츠로 대응시킨다.
  const ids: Record<number, number> = {};
  const used = new Set<number>();
  for (const [role, key] of Object.entries(roleData)) {
    const currentId = current.windowIds[Number(role)];
    if (current.roleData[Number(role)] === key && currentId !== undefined) {
      ids[Number(role)] = currentId;
      used.add(currentId);
    }
  }
  for (const [role, key] of Object.entries(roleData)) {
    if (ids[Number(role)] !== undefined) continue;
    const match = Object.entries(current.roleData).find(([oldRole, oldKey]) =>
      oldKey === key && current.windowIds[Number(oldRole)] !== undefined && !used.has(current.windowIds[Number(oldRole)]));
    const id = match ? current.windowIds[Number(match[0])] : allocate();
    ids[Number(role)] = id;
    used.add(id);
  }
  return ids;
}
