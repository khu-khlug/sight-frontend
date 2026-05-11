import { useEffect, useState } from "react";
import { Box, Flex, Text, chakra } from "@chakra-ui/react";
import { toast } from "react-toastify";
import DoorLockKeypad from "./DoorLockKeypad";
import DoorLockScheduleCard from "./DoorLockScheduleCard";
import {
  getCurrentSchedule,
  getNextSchedule,
  getDoorLockStatus,
  authenticate,
  type DoorLockSchedule,
  type DoorLockStatus,
} from "../../api/public/doorLock";

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours()}시 ${String(d.getMinutes()).padStart(2, "0")}분`;
}

const midnight = (() => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
})();

export default function DoorLockContainer() {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(new Date());
  const [currentSchedule, setCurrentSchedule] =
    useState<DoorLockSchedule | null>(null);
  const [nextSchedule, setNextSchedule] = useState<DoorLockSchedule | null>(
    null,
  );
  const [status, setStatus] = useState<DoorLockStatus | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getCurrentSchedule().then(setCurrentSchedule);
    getNextSchedule().then(setNextSchedule);
    getDoorLockStatus().then(setStatus);
  }, []);

  const handleKey = async (key: string) => {
    if (key === "←") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key === "↵") {
      if (input.length !== 10) return;
      const result = await authenticate(input);
      setInput("");
      if (result.success) {
        toast.success(`${result.name}님 환영합니다.`, {
          position: "top-center",
          autoClose: 500,
          hideProgressBar: true,
        });
      } else {
        toast.error("인증에 실패했습니다.", {
          position: "top-center",
          autoClose: 500,
          hideProgressBar: true,
        });
      }
    } else {
      setInput((prev) => (prev.length < 10 ? prev + key : prev));
    }
  };

  const currentScheduleCardData = currentSchedule
    ? {
        category: currentSchedule.category,
        title: currentSchedule.title,
        timeLines: [
          {
            label: "경과",
            value: formatDuration(
              now.getTime() - new Date(currentSchedule.startTime).getTime(),
            ),
          },
          {
            label: "남음",
            value: formatDuration(
              new Date(currentSchedule.endTime).getTime() - now.getTime(),
            ),
          },
        ] as [
          { label: string; value: string },
          { label: string; value: string },
        ],
      }
    : {
        category: "일정없음" as const,
        title: "자유롭게 이용하세요.",
        timeLines: [
          {
            label: "남음",
            value: formatDuration(
              (nextSchedule && new Date(nextSchedule.startTime) > now
                ? new Date(nextSchedule.startTime)
                : midnight
              ).getTime() - now.getTime(),
            ),
          },
        ],
      };

  const nextScheduleCardData = nextSchedule
    ? {
        category: nextSchedule.category,
        title: nextSchedule.title,
        timeLines: [
          { label: "시작", value: formatTime(nextSchedule.startTime) },
          { label: "종료", value: formatTime(nextSchedule.endTime) },
        ] as [
          { label: string; value: string },
          { label: string; value: string },
        ],
      }
    : { category: "일정없음" as const, title: "예약된 일정이 없습니다." };

  return (
    <Flex h="100%">
      <Flex direction="column" flex="6" minH="0" overflow="hidden">
        <Box flex="2" minH="0" display="grid" placeItems="center" px={4}>
          <Box textAlign="center" w="100%">
            <Box mb={6} color="gray.400">
              <Text as="span" fontSize="lg" fontWeight="bold" mr={12}>
                오늘 {status?.todayVisitorCount ?? "-"}명 방문
              </Text>
              <Text as="span" fontSize="lg" fontWeight="bold">
                현재 {status?.currentRoomCount ?? "-"}명
              </Text>
            </Box>
            <Box
              borderRadius="lg"
              bg="#ffffff"
              display="inline-block"
              p={5}
              px="20%"
              border="1px solid"
              borderColor="gray.200"
              mb={8}
            >
              <chakra.input
                readOnly
                value={input}
                placeholder="학번을 입력하세요"
                fontSize="4xl"
                fontWeight="bold"
                letterSpacing="wide"
                fontVariantNumeric="tabular-nums"
                lineHeight="1"
                w="100%"
                textAlign="center"
                border="none"
                outline="none"
                bg="transparent"
                p={0}
                cursor="default"
                _focus={{ outline: "none", boxShadow: "none" }}
                _placeholder={{
                  fontSize: "3xl",
                  letterSpacing: "normal",
                  color: "brand.300",
                }}
              />
            </Box>
          </Box>
        </Box>
        <Flex flex="3" minH="0">
          <Box flex="1" minH="0" overflow="hidden">
            <DoorLockScheduleCard
              label="현재 일정"
              schedule={currentScheduleCardData}
            />
          </Box>
          <Box flex="1" minH="0" overflow="hidden">
            <DoorLockScheduleCard
              label="다음 일정"
              schedule={nextScheduleCardData}
            />
          </Box>
        </Flex>
      </Flex>
      <Box flex="4">
        <DoorLockKeypad onKey={handleKey} />
      </Box>
    </Flex>
  );
}
