/**
 * 숫자를 통화 형식으로 포맷팅합니다.
 * @param amount - 포맷팅할 금액
 * @returns ₩ 기호와 천단위 구분자가 포함된 문자열
 * @example
 * formatCurrency(20000) // "₩20,000"
 * formatCurrency(3302795) // "₩3,302,795"
 */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}
