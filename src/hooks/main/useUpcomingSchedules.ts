import { useQuery } from "@tanstack/react-query";
import { SchedulePublicApi } from "../../api/public/schedule";

/**
 * 예정된 일정을 조회하는 hook
 * @param limit 조회할 일정 개수
 */
export const useUpcomingSchedules = (limit = 5) => {
  return useQuery({
    queryKey: ["schedules", "upcoming", { limit }],
    queryFn: () => SchedulePublicApi.listUpcomingSchedules(limit),
  });
};
