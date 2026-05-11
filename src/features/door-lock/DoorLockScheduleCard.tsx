import { Box, Flex, Text } from "@chakra-ui/react";
import ScheduleCategoryBadge, {
  type ScheduleCategory,
} from "../../components/ScheduleCategoryBadge";

export type TimeLine = { label: string; value: string };

export type ScheduleInfo = {
  category?: ScheduleCategory;
  title?: string;
  timeLines?: TimeLine[];
};

type Props = {
  label: string;
  schedule?: ScheduleInfo;
};

export default function DoorLockScheduleCard({ label, schedule }: Props) {
  const hasTitleBox =
    schedule && (schedule.category != null || schedule.title != null);
  const timeLines = schedule?.timeLines ?? [];

  return (
    <Box
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Text textAlign="center" fontWeight="bold" fontSize="xl" color="gray.500">
        {label}
      </Text>

      <Flex
        flex="1"
        direction="column"
        justify="space-around"
        align="center"
        gap={3}
        py={3}
      >
        {!schedule ? (
          <ScheduleCategoryBadge category="일정없음" />
        ) : (
          <>
            {hasTitleBox && (
              <Flex
                flex="2"
                minH="0"
                w="90%"
                overflow="hidden"
                bg="#00000000"
                p={5}
                py={3}
                direction="column"
                justify="space-around"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              >
                {schedule.category && (
                  <ScheduleCategoryBadge category={schedule.category} />
                )}
                {schedule.title && (
                  <Text
                    fontWeight="bold"
                    fontSize="xl"
                    overflow="hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {schedule.title}
                  </Text>
                )}
              </Flex>
            )}

            {timeLines.map((line, i) => (
              <Flex
                key={i}
                flex="1"
                minH="0"
                w="90%"
                bg="#ffffff00"
                alignItems="center"
                justifyContent="space-between"
                px={5}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontWeight="bold" fontSize="lg" color="gray.500">
                  {line.label}
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {line.value}
                </Text>
              </Flex>
            ))}
          </>
        )}
      </Flex>
    </Box>
  );
}
