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
  syncMembers,
  getMembersDate,
  sendDaemonDownAlert,
  type DoorLockSchedule,
  type DoorLockStatus,
} from "../../api/public/doorLock";

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours()}시 ${String(d.getMinutes()).padStart(2, "0")}분`;
}

export default function DoorLockContainer() {
  const [input, setInput] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentSchedule, setCurrentSchedule] =
    useState<DoorLockSchedule | null>(null);
  const [nextSchedule, setNextSchedule] = useState<DoorLockSchedule | null>(
    null,
  );
  const [status, setStatus] = useState<DoorLockStatus | null>(null);
  const [isServerOnline, setIsServerOnline] = useState(true);

  useEffect(() => {
    let failCount = 0;
    let alertSent = false;
    let hasEverConnected = false;
    let alertResetId: ReturnType<typeof setTimeout> | null = null;

    const checkHealth = () =>
      fetch("http://localhost:8080/health")
        .then((r) => {
          if (r.ok) {
            failCount = 0;
            hasEverConnected = true;
            if (alertResetId !== null) {
              clearTimeout(alertResetId);
              alertResetId = null;
            }
            alertSent = false;
            setIsServerOnline(true);
          } else {
            throw new Error();
          }
        })
        .catch(() => {
          failCount += 1;
          setIsServerOnline(false);
          if (hasEverConnected && failCount >= 3 && !alertSent) {
            alertSent = true;
            sendDaemonDownAlert();
            alertResetId = setTimeout(() => {
              alertSent = false;
            }, 60 * 60_000);
          }
        });

    const fetchSchedules = () => {
      getCurrentSchedule().then(setCurrentSchedule);
      getNextSchedule().then(setNextSchedule);
    };

    checkHealth();
    fetchSchedules();
    syncMembers();
    getDoorLockStatus().then(setStatus);

    const healthId = setInterval(checkHealth, 10_000);
    const scheduleId = setInterval(fetchSchedules, 60_000);
    const membersId = setInterval(syncMembers, 10 * 60_000);

    return () => {
      clearInterval(healthId);
      clearInterval(scheduleId);
      clearInterval(membersId);
      if (alertResetId !== null) clearTimeout(alertResetId);
    };
  }, []);

  const handleKey = async (key: string) => {
    if (key === "←") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key === "↵") {
      if (input.length !== 10 || isAuthenticating) return;
      setIsAuthenticating(true);
      const toastId = toast.loading("인증 중...", { position: "top-center" });
      const result = await authenticate(input);
      setInput("");
      setIsAuthenticating(false);
      toast.dismiss(toastId);
      const toastOptions = {
        position: "top-center" as const,
        autoClose: 1500,
        hideProgressBar: true,
      };
      if (result.success) {
        if (result.localUsed) {
          toast.warn(
            `서버 연결 실패, ${getMembersDate() ?? "알 수 없는 날짜"}자 로컬 DB를 사용합니다.`,
            toastOptions,
          );
        }
        const welcome = result.name ? `${result.name}님 환영합니다.` : "환영합니다.";
        toast.success(welcome, toastOptions);
      } else {
        const message =
          result.reason === "timeout"
            ? "서버 응답이 없습니다."
            : result.reason === "network"
              ? "서버에 연결할 수 없습니다."
              : result.reason === "signal_failed"
                ? "도어락 신호 전송에 실패했습니다."
                : "등록되지 않은 학번입니다.";
        toast.error(message, toastOptions);
        if ("localNotFound" in result && result.localNotFound) {
          toast.error("해당 회원을 로컬 DB에서 찾을 수 없습니다.", toastOptions);
        }
      }
    } else {
      setInput((prev) => (prev.length < 10 ? prev + key : prev));
    }
  };

  const currentScheduleCardData = currentSchedule
    ? {
        category: currentSchedule.category ?? undefined,
        title: currentSchedule.title,
        timeLines: [
          { label: "시작", value: formatTime(currentSchedule.scheduledAt) },
          {
            label: "종료",
            value: currentSchedule.endAt
              ? formatTime(currentSchedule.endAt)
              : "-",
          },
        ] as [
          { label: string; value: string },
          { label: string; value: string },
        ],
      }
    : {
        category: "일정없음" as const,
        title: "자유롭게 이용하세요.",
        timeLines: [],
      };

  const nextScheduleCardData = nextSchedule
    ? {
        category: nextSchedule.category ?? undefined,
        title: nextSchedule.title,
        timeLines: [
          { label: "시작", value: formatTime(nextSchedule.scheduledAt) },
          {
            label: "종료",
            value: nextSchedule.endAt ? formatTime(nextSchedule.endAt) : "-",
          },
        ] as [
          { label: string; value: string },
          { label: string; value: string },
        ],
      }
    : { category: "일정없음" as const, title: "예약된 일정이 없습니다." };

  return (
    <Flex h="100%">
      <Flex
        direction="column"
        flex="6"
        minH="0"
        overflow="hidden"
        justifyContent="space-between"
        alignItems="center"
        alignSelf="flex-end"
        h="95%"
      >
        <Flex
          flex="1"
          minH="0"
          direction="column"
          textAlign="center"
          justifyContent="center"
          alignItems="center"
          w="95%"
          borderRadius="xl"
          bg="var(--dl-card-bg)"
          border="1px solid"
          borderColor="var(--dl-card-border)"
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
            color="var(--dl-text-primary)"
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
              color: "var(--dl-text-placeholder)",
            }}
          />
        </Flex>
        <Flex
          flex="1"
          minH="0"
          textAlign="center"
          alignItems="center"
          justifyContent="center"
          w="95%"
        >
          {isServerOnline ? (
            <Box color="var(--dl-text-muted)">
              <Text as="span" fontSize="md" mr={8}>
                오늘{" "}
                <Text as="span" fontWeight="bold">
                  {status?.todayVisitorCount ?? "?"}명
                </Text>{" "}
                방문
              </Text>
              <Text as="span" fontSize="md">
                현재{" "}
                <Text as="span" fontWeight="bold">
                  {status?.currentRoomCount ?? "?"}명
                </Text>
              </Text>
            </Box>
          ) : (
            <Box color="var(--dl-text-error)" fontSize="sm" fontWeight="medium">
              <strong>서버에 연결되어 있지 않습니다.</strong>
              <br />
              <strong>
                {getMembersDate() ?? "날짜 없음"} 로컬 DB를 사용합니다.
              </strong>
            </Box>
          )}
        </Flex>

        <Flex flex="2" gap={3} w="95%">
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
      <Box flex="4" pr={2}>
        <DoorLockKeypad onKey={handleKey} />
      </Box>
    </Flex>
  );
}
