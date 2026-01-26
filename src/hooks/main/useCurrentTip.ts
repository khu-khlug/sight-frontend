import { useQuery } from "@tanstack/react-query";
import { TipPublicApi } from "../../api/public/tip";

/**
 * 현재 표시할 팁을 조회하는 hook
 */
export const useCurrentTip = () => {
  return useQuery({
    queryKey: ["tip", "current"],
    queryFn: () => TipPublicApi.getCurrentTip(),
    staleTime: 1000 * 60 * 60, // 1시간 동안 fresh 상태 유지
  });
};
