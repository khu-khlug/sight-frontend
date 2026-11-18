import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { checkAttendance, type CheckAttendanceResult } from "../../../api/public/attendance";

type Props = {
  scheduleId: string;
  code: string;
};

export default function AttendanceResult({ scheduleId, code }: Props) {
  const [result, setResult] = useState<CheckAttendanceResult | null>(null);

  useEffect(() => {
    checkAttendance(scheduleId, code).then(setResult);
  }, [scheduleId, code]);

  if (!result) {
    return (
      <Flex direction="column" align="center" pt={16} gap={3}>
        <Text fontSize="2xl">⏳</Text>
        <Text fontSize="lg" color="gray.500">출석 처리 중...</Text>
      </Flex>
    );
  }

  const content: { icon: string; title: string; sub?: string; color: string } = (() => {
    switch (result.status) {
      case "success":
        return {
          icon: "✅",
          title: "출석 완료!",
          sub: result.expointGranted > 0 ? `ExPoint +${result.expointGranted} 획득` : undefined,
          color: "green.600",
        };
      case "already":
        return { icon: "✅", title: "이미 출석 완료된 일정입니다", color: "green.600" };
      case "wrong_code":
        return {
          icon: "❌",
          title: "코드가 올바르지 않습니다",
          sub: "운영진에게 코드를 다시 확인해주세요.",
          color: "red.500",
        };
      case "not_open":
        return {
          icon: "⏰",
          title: "출석 가능한 시간이 아닙니다",
          sub: "출석체크가 진행 중인 일정에서만 참여할 수 있습니다.",
          color: "orange.500",
        };
      case "not_found":
        return { icon: "❗", title: "일정을 찾을 수 없습니다", color: "red.500" };
      case "error":
        return { icon: "❗", title: "오류가 발생했습니다", sub: "잠시 후 다시 시도해주세요.", color: "red.500" };
    }
  })();

  return (
    <Flex direction="column" align="center" px={6} pt={4}>
      <Box
        w="100%"
        maxW="360px"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="xl"
        p={6}
        textAlign="center"
      >
        <Text fontSize="4xl" mb={3}>{content.icon}</Text>
        <Text fontSize="xl" fontWeight="bold" color={content.color} mb={content.sub ? 1 : 0}>
          {content.title}
        </Text>
        {content.sub && (
          <Text fontSize="sm" color="gray.500">{content.sub}</Text>
        )}
      </Box>
    </Flex>
  );
}
