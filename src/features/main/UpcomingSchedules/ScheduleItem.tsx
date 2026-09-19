import type { ScheduleListItemDto } from "../../../api/public/schedule";
import { Box, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import "dayjs/locale/ko";
import ScheduleCategoryBadge from "../../../components/ScheduleCategoryBadge";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale("ko");

type Props = {
  schedule: ScheduleListItemDto;
};

const getRelativeDate = (dateTime: dayjs.Dayjs): string => {
  if (dateTime.isToday()) return "오늘";
  if (dateTime.isTomorrow()) return "내일";
  return dateTime.format("M/D");
};

export default function ScheduleItem({ schedule }: Props) {
  const dateTime = dayjs(schedule.scheduledAt);
  const relativeDate = getRelativeDate(dateTime);
  const time = dateTime.format("HH:mm");
  return (
    <Box
      display="flex"
      alignItems="center"
      gap="12px"
      padding="12px"
      borderRadius="md"
      _hover={{ backgroundColor: "gray.50" }}
      transition="background-color 0.2s"
    >
      <Box minWidth="60px" textAlign="center">
        <Text fontSize="xs" color="gray.500">
          {relativeDate}
        </Text>
        <Text fontSize="sm" fontWeight="bold">
          {time}
        </Text>
      </Box>

      <Box flex="1">
        <Box display="flex" alignItems="center" gap="8px" marginBottom="4px">
          <ScheduleCategoryBadge category={schedule.category} />
        </Box>
        <Text fontSize="md">{schedule.title}</Text>
      </Box>
    </Box>
  );
}
