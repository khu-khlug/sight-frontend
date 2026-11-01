export const MAX_GROUP_DELIMITED_LENGTH = 255;

export function getGroupDelimitedValuesError(values: string[], label: string, separator = ","): string | null {
  return Array.from(values.join(separator)).length > MAX_GROUP_DELIMITED_LENGTH
    ? `${label}은 구분자를 포함한 전체 길이가 255자를 넘을 수 없습니다.`
    : null;
}
