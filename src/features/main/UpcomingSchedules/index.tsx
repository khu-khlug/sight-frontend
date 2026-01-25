import { useUpcomingSchedules } from "../../../hooks/main/useUpcomingSchedules";
import { Box, Text, Spinner } from "@chakra-ui/react";
import Container from "../../../components/Container";
import ScheduleItem from "./ScheduleItem";

export default function UpcomingSchedules() {
  const { data, isLoading } = useUpcomingSchedules(5);

  return (
    <Container>
      <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
        예정된 일정
      </Text>

      {isLoading && (
        <Box display="flex" justifyContent="center" padding="40px">
          <Spinner size="lg" color="var(--main-color)" />
        </Box>
      )}

      {!isLoading && data && data.count === 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding="40px"
        >
          <Text color="gray.500">예정된 일정이 없습니다.</Text>
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Box display="flex" flexDirection="column">
          {data.schedules.map((schedule) => (
            <ScheduleItem key={schedule.id} schedule={schedule} />
          ))}
        </Box>
      )}
    </Container>
  );
}
