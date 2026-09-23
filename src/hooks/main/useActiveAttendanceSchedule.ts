import { useQuery } from "@tanstack/react-query";
import { getActiveSchedules } from "../../api/public/attendance";

/**
 * 현재 출석체크가 열려있는 일정 목록을 조회하는 hook. 없으면 빈 배열.
 */
export const useActiveAttendanceSchedules = () => {
  return useQuery({
    queryKey: ["schedules", "active-attendance"],
    queryFn: getActiveSchedules,
  });
};
