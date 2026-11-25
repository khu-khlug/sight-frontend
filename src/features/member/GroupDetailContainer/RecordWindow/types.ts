import { isIntegerId } from "../../../../util/integerId";

export type RecordWindowTarget = { groupId: string; recordId: string };

export function encodeRecordContentKey(target: RecordWindowTarget): string {
  return `record:${target.groupId}_${target.recordId}`;
}

export function decodeRecordContentKey(key: string): RecordWindowTarget | null {
  const match = /^record:([1-9]\d*)_([1-9]\d*)$/.exec(key);
  if (!match) return null;
  const [, groupId, recordId] = match;
  return isIntegerId(groupId) && isIntegerId(recordId) ? { groupId, recordId } : null;
}
