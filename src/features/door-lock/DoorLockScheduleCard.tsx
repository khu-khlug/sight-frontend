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
  const timeLines = schedule?.timeLines ?? [];

  return (
    <Box
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      bg="var(--dl-card-bg)"
      borderRadius="xl"
      border="1px solid"
      borderColor="var(--dl-card-border)"
      px={5}
      py={5}
      gap={2}
      overflow="hidden"
    >
      <Flex alignItems="center" justifyContent="space-between">
        {!schedule ? (
          <ScheduleCategoryBadge category="일정없음" />
        ) : schedule.category ? (
          <ScheduleCategoryBadge category={schedule.category} />
        ) : (
          <Box />
        )}
        <Text
          fontWeight="semibold"
          fontSize="xs"
          color="var(--dl-text-label)"
          letterSpacing="widest"
        >
          {label}
        </Text>
      </Flex>

      <Flex overflow="hidden" alignItems="center" justifyContent="center">
        {schedule?.title && (
          <Text
            fontWeight="semibold"
            fontSize="lg"
            color="var(--dl-text-primary)"
            overflow="hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
            lineClamp={2}
            lineHeight="1.5"
            h="3em"
            w="95%"
          >
            {schedule.title}
          </Text>
        )}
      </Flex>

      <Flex direction="column" gap={2}>
        {Array.from({ length: 2 }, (_, i) => {
          const line = timeLines[i] ?? null;
          return (
            <Flex
              key={i}
              visibility={line ? "visible" : "hidden"}
              bg="var(--dl-card-row-bg)"
              alignItems="center"
              justifyContent="space-between"
              px={4}
              py={2}
              borderRadius="md"
            >
              <Text fontWeight="medium" fontSize="sm" color="var(--dl-text-label)">
                {line?.label}
              </Text>
              <Text fontWeight="semibold" fontSize="sm" color="var(--dl-text-primary)">
                {line?.value}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}
