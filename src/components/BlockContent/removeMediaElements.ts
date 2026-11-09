// 표시용 문서에서만 제거한다. 중첩된 블록도 포함하며 파일명·대체 문구를 남기지 않는다.
export function removeMediaElements(root: ParentNode): void {
  for (const element of root.querySelectorAll(
    'img, picture, audio, video, iframe, object, embed, [data-type="file-attachment"], [data-youtube-video]',
  )) {
    element.remove();
  }

  // 레거시 본문은 파일 블록 대신 다운로드 링크로 첨부 파일을 저장하기도 한다.
  for (const link of root.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    let isFile = link.hasAttribute("download");
    try {
      isFile ||= /^\/(?:file\/|groups\/[^/]+\/files\/)/.test(new URL(href, window.location.origin).pathname);
    } catch { /* 주소를 해석할 수 없는 일반 링크는 그대로 둔다. */ }
    if (isFile) link.remove();
  }
}
