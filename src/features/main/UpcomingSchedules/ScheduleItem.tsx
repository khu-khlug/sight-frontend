import type { Schedule } from "../../../api/main/types";
import { Box, Text, Badge } from "@chakra-ui/react";
import dayjs from "dayjs";

type Props = {
  schedule: Schedule;
};

const scheduleTypeLabels: Record<Schedule["type"], string> = {
  PERSONAL: "개인",
  CLUB: "동아리",
  GROUP: "그룹",
};

const scheduleTypeColors: Record<Schedule["type"], string> = {
  PERSONAL: "blue",
  CLUB: "green",
  GROUP: "purple",
};

export default function ScheduleItem({ schedule }: Props) {
  const startTime = dayjs(schedule.startTime).format("HH:mm");

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="12px"
      padding="12px"
      borderRadius="md"
      _hover={{ backgroundColor: "gray.50" }}
      cursor="pointer"
      transition="background-color 0.2s"
    >
      <Box minWidth="48px" textAlign="center">
        <Text fontSize="sm" fontWeight="bold">
          {startTime}
        </Text>
      </Box>

      <Box flex="1">
        <Box display="flex" alignItems="center" gap="8px" marginBottom="4px">
          <Badge colorPalette={scheduleTypeColors[schedule.type]} size="sm">
            {scheduleTypeLabels[schedule.type]}
          </Badge>
          {schedule.relatedEntity && (
            <Text fontSize="xs" color="gray.600">
              {schedule.relatedEntity.name}
            </Text>
          )}
        </Box>
        <Text fontSize="md">{schedule.title}</Text>
      </Box>
    </Box>
  );
}
