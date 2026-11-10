// 개발 탭과 목업 상태 변경 API를 켠다. 로컬 개발 서버이거나, 개발 백엔드를 쓰는 배포에서 VITE_ENABLE_DEV_TAB=true로 빌드한 경우다.
export const isDevelopmentToolsEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TAB === "true";
