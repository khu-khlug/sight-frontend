import { Box, Flex, Text } from "@chakra-ui/react";
import ScheduleCategoryBadge, {
  type ScheduleCategory,
} from "../../components/ScheduleCategoryBadge";

export type TimeLine = { label: string; value: string };

export type ScheduleInfo = {
  category: ScheduleCategory;
  title: string;
  timeLines: [TimeLine, TimeLine];
};

type Props = {
  label: string;
  schedule?: ScheduleInfo;
};

export default function DoorLockScheduleCard({ label, schedule }: Props) {
  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" overflow="hidden">
      <Text textAlign="center" fontWeight="bold" fontSize="md">
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
            <Flex
              flex="2"
              minH="0"
              w="90%"
              overflow="hidden"
              bg="#ffffff"
              p={5}
              py={3}
              direction="column"
              justify="space-around"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <ScheduleCategoryBadge category={schedule.category} />
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
            </Flex>

            {schedule.timeLines.map((line, i) => (
              <Flex
                key={i}
                flex="1"
                minH="0"
                w="90%"
                bg="#ffffff"
                alignItems="center"
                justifyContent="space-between"
                px={5}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontWeight="bold" fontSize="lg">{line.label}</Text>
                <Text fontWeight="bold" fontSize="lg">{line.value}</Text>
              </Flex>
            ))}
          </>
        )}
      </Flex>
    </Box>
  );
}
