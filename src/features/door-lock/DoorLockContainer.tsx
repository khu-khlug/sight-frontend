import { useEffect, useState } from "react";
import { Box, Flex, Text, chakra } from "@chakra-ui/react";
import DoorLockKeypad from "./DoorLockKeypad";
import DoorLockScheduleCard from "./DoorLockScheduleCard";

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h === 0 ? `${m}분` : `${h}시간 ${m}분`;
}

const CURRENT_START = new Date(Date.now() - 23 * 60 * 1000);
const CURRENT_END = new Date(Date.now() + 97 * 60 * 1000);

const TODAY_VISITOR_COUNT = 12;
const CURRENT_IN_ROOM_COUNT = 3;

export default function DoorLockContainer() {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  const handleKey = (key: string) => {
    if (key === "←") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key !== "↵") {
      setInput((prev) => (prev.length < 10 ? prev + key : prev));
    }
  };

  return (
    <Flex h="100%">
      <Flex direction="column" flex="6" minH="0" overflow="hidden">
        <Box flex="2" minH="0" display="grid" placeItems="center" px={4}>
          <Box textAlign="center" w="100%">
            <Box mb={6} color="gray.400">
              <Text as="span" fontSize="lg" fontWeight="bold" mr={12}>
                오늘 {TODAY_VISITOR_COUNT}명 방문
              </Text>
              <Text as="span" fontSize="lg" fontWeight="bold">
                현재 {CURRENT_IN_ROOM_COUNT}명
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
              schedule={{
                category: "동아리",
                title: "정기 회의 한번더 이상 20261231 좀더길게 테스트",
                timeLines: [
                  {
                    label: "경과",
                    value: formatDuration(
                      now.getTime() - CURRENT_START.getTime(),
                    ),
                  },
                  {
                    label: "남음",
                    value: formatDuration(
                      CURRENT_END.getTime() - now.getTime(),
                    ),
                  },
                ],
              }}
            />
          </Box>
          <Box flex="1" minH="0" overflow="hidden">
            <DoorLockScheduleCard
              label="다음 일정"
              schedule={{
                category: "세미나",
                title: "Git 입문 세미나",
                timeLines: [
                  { label: "시작", value: "18:00" },
                  { label: "종료", value: "20:00" },
                ],
              }}
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
