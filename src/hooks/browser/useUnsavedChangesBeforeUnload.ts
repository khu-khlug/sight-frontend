import { useEffect } from "react";

// 새로고침·탭 닫기처럼 React의 화면 이탈 가드를 거치지 않는 경우를 막는다.
// 여러 편집 화면이 동시에 열려 있어도 브라우저는 하나의 기본 확인창만 보여준다.
export function useUnsavedChangesBeforeUnload(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const confirmBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", confirmBeforeUnload);
    return () => window.removeEventListener("beforeunload", confirmBeforeUnload);
  }, [isDirty]);
}
