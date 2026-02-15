import type { ScheduleDto, ScheduleCategory } from "../../../api/public/schedule";
import { Box, Text, Badge } from "@chakra-ui/react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import "dayjs/locale/ko";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale("ko");

type Props = {
  schedule: ScheduleDto;
};

const scheduleCategoryLabels: Record<ScheduleCategory, string> = {
  ROOM_405: "405호",
  ROOM_406: "406호",
  ROOM_410: "410호",
  CLUB: "동아리",
  ACADEMIC: "학사",
  EXTERNAL: "외부",
};

const scheduleCategoryColors: Record<ScheduleCategory, string> = {
  ROOM_405: "blue",
  ROOM_406: "green",
  ROOM_410: "purple",
  CLUB: "orange",
  ACADEMIC: "red",
  EXTERNAL: "gray",
};

const getRelativeDate = (dateTime: dayjs.Dayjs): string => {
  if (dateTime.isToday()) return "오늘";
  if (dateTime.isTomorrow()) return "내일";
  return dateTime.format("M/D");
};

export default function ScheduleItem({ schedule }: Props) {
  const dateTime = dayjs(schedule.startTime);
  const relativeDate = getRelativeDate(dateTime);
  const time = dateTime.format("HH:mm");
  const categoryLabel = schedule.category
    ? scheduleCategoryLabels[schedule.category]
    : "기타";
  const categoryColor = schedule.category
    ? scheduleCategoryColors[schedule.category]
    : "gray";

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
          <Badge colorPalette={categoryColor} size="sm">
            {categoryLabel}
          </Badge>
        </Box>
        <Text fontSize="md">{schedule.title}</Text>
      </Box>
    </Box>
  );
}
