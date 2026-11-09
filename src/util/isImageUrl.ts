// URL이 실제로 이미지로 불러와지는지 확인한다 — <img> 로딩은 CORS 헤더가 없어도(표시 목적만
// 이면) 성공하므로, Content-Type 헤더를 직접 읽는 fetch보다 외부 도메인(깃허브 raw 등)에
// 더 안전하게 쓸 수 있다. timeoutMs 안에 load/error 둘 다 안 뜨면 실패로 간주한다.
export function isImageUrl(url: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    }
    img.onload = () => {
      cleanup();
      resolve(true);
    };
    img.onerror = () => {
      cleanup();
      resolve(false);
    };
    img.src = url;
  });
}
