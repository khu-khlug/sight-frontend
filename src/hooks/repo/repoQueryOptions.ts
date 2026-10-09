// GitHub 응답은 한 시간 재사용하고, 한 시간이 지난 뒤 탭에 다시 들어올 때 조회한다.
// 창 포커스와 네트워크 재연결은 별도 요청을 발생시키지 않는다.
export const repoQueryOptions = {
  staleTime: 60 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: 0,
} as const;
