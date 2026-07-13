import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { SchedulePublicApi } from "../../../api/public/schedule";

export const useSchedules = (anchorDate: string) => {
  const from = dayjs(anchorDate).startOf("month").format("YYYY-MM-DDTHH:mm:ss");

  return useQuery({
    queryKey: ["schedules", "monthly", from],
    queryFn: () => SchedulePublicApi.listSchedules({ from, limit: 50 }),
    select: (data) => data.schedules,
  });
};
