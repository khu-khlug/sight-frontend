export type RecordWindowTarget = { groupId: number; recordId: number };

export function encodeRecordContentKey(target: RecordWindowTarget): string {
  return `record:${target.groupId}_${target.recordId}`;
}

export function decodeRecordContentKey(key: string): RecordWindowTarget | null {
  const match = /^record:([1-9]\d*)_([1-9]\d*)$/.exec(key);
  if (!match) return null;
  const groupId = Number(match[1]);
  const recordId = Number(match[2]);
  return Number.isSafeInteger(groupId) && Number.isSafeInteger(recordId) ? { groupId, recordId } : null;
}
