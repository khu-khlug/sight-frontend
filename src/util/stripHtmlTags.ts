/**
 * HTML 태그를 제거하고 텍스트만 반환합니다.
 * 중첩된 태그도 처리합니다.
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};
