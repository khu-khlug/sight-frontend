// JS 안전 정수 범위를 넘는 서로 인접한 ID도 문자열로 구분하도록 한다.
let nextId = 906558544281600000n;
export const nextMockIntegerId = (): string => (nextId++).toString();

export function compareMockIntegerIds(left: string, right: string): number {
  return left.length - right.length || (left < right ? -1 : left > right ? 1 : 0);
}
