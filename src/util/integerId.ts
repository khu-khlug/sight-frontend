const MAX_LONG_ID = "9223372036854775807";

// API·주소의 ID는 숫자로 변환하지 않고 signed BIGINT의 양수 범위를 검사한다.
export function isIntegerId(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d*$/.test(value)
    && (value.length < MAX_LONG_ID.length || (value.length === MAX_LONG_ID.length && value <= MAX_LONG_ID));
}

export function requireIntegerId(value: unknown): string {
  if (!isIntegerId(value)) throw new Error("서버 식별자가 올바른 10진수 문자열이 아닙니다.");
  return value;
}
