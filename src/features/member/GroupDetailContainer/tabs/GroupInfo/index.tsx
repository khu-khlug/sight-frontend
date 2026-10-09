import { Box, Button, Text } from "@chakra-ui/react";
import { GroupInfoApi } from "../../../../../api/public/group/GroupInfoApi";
import { GroupChatApi } from "../../../../../api/public/group/GroupChatApi";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ScrollText,
  CreditCard,
  PenBox,
  Briefcase,
  Presentation,
  FileText,
  UserPlus,
  MessageCircle,
  MessageCirclePlus,
  Bookmark
} from "lucide-react";

import GitRepoBadge from "../../../../../components/GitRepoBadge";
import RelativeDateTime from "../../../../../components/RelativeDateTime";
import TechBadge from "../../../../../components/TechBadge";
import { GroupInterestLabel, GroupVisibilityLabel } from "../../../../../constant";
import { useCurrentUser } from "../../../../../hooks/user/useCurrentUser";
import { GROUP_INTEREST_ICON, GroupInfo as GroupInfoData } from "./types";

type Props = {
  info: GroupInfoData;
  portfolioCounts: { listCount: number; cardCount: number };
  onTabChange: (id: string) => void;
};

type Row = { label: string; value: React.ReactNode; onClick?: () => void };

export default function GroupInfo({ info, portfolioCounts, onTabChange }: Props) {
  const action = useGroupAction(info.id);
  const queryClient = useQueryClient();
  const isBookmarked = info.isBookmarked;
  const currentUserQuery = useCurrentUser();
  const isLeader = currentUserQuery.data?.id === info.leaderUserId;
  const showCreateChatRoom = isLeader && !info.hasChatRoom;
  const handleJoinChat = () => {
    const memberId = currentUserQuery.data?.id;
    if (memberId === undefined) return;
    action.mutate(() => GroupChatApi.joinGroupDiscordChannel(info.id, memberId), {
      onSuccess: () => { toast.success("채팅에 참여했습니다."); onTabChange("discord"); },
    });
  };
  const handleCreateChatRoom = () => action.mutate(() => GroupChatApi.createGroupDiscordChannel(info.id), {
    onSuccess: () => { toast.success("채팅방을 만들고 참여했습니다."); onTabChange("discord"); },
  });
  const handleJoinGroup = () => action.mutate(() => GroupInfoApi.joinGroup(info.id), {
    onSuccess: () => {
      const current = queryClient.getQueryData<GroupInfoData>(["group-detail", info.id, "info"]) ?? info;
      toast.success(current.hasChatRoom && !current.isChatParticipant
        ? "그룹에 참여했습니다. 채팅방에도 참여해 주세요."
        : "그룹에 참여했습니다.");
    },
  });

  // 3개씩(기본 정보) / 4개씩(활동 통계) / 3개씩(공개·참여 설정) 세 묶음으로 나눠 표시한다.
  // 세 묶음 사이에만 구분선을 두고, 묶음 안에서는 행 간격으로 구분한다.
  const rowGroups: Row[][] = [
    [
      {
        label: "관심 분야",
        value:
          info.interests.length > 0 ? (
            <Box display="flex" flexDirection="column" gap="4px">
              {info.interests.map((interest) => {
                const Icon = GROUP_INTEREST_ICON[interest];
                return (
                  <Box key={interest} display="flex" alignItems="center" gap="6px">
                    <Icon size={14} />
                    {GroupInterestLabel[interest]}
                  </Box>
                );
              })}
            </Box>
          ) : (
            "없음"
          ),
      },
      {
        label: "사용 기술",
        value:
          info.techStack.length > 0 ? (
            <Box display="flex" flexWrap="wrap" gap="6px">
              {info.techStack.map((slug) => (
                <TechBadge key={slug} slug={slug} />
              ))}
            </Box>
          ) : (
            "없음"
          ),
      },
      {
        label: "저장소",
        onClick: () => onTabChange("repository"),
        value:
          info.repositoryUrls.length > 0 ? (
            <Box display="flex" flexDirection="column" gap="4px">
              {info.repositoryUrls.map((url) => (
                <GitRepoBadge key={url} url={url} />
              ))}
            </Box>
          ) : (
            "없음"
          ),
      },
    ],
    [
      { label: "멤버 수", value: `${info.memberCount}명`, onClick: () => onTabChange("member") },
      {
        label: "활동 기록",
        onClick: () => onTabChange("log"),
        value: (
          <Box display="flex" alignItems="center" gap="10px" flexWrap="wrap">
            <Box display="flex" alignItems="center" gap="4px">
              <ScrollText size={14} />
              {info.listCount}
            </Box>
            <Box display="flex" alignItems="center" gap="4px">
              <CreditCard size={14} />
              {info.cardCount}
            </Box>
            <Box display="flex" alignItems="center" gap="4px">
              <PenBox size={14} />
              {info.recordCount}
            </Box>
          </Box>
        ),
      },
      { label: "생성 일자", value: <RelativeDateTime value={info.createdAt} format="YYYY-MM-DD HH:mm" /> },
      { label: "최근 활동", value: <RelativeDateTime value={info.lastActivityAt} format="YYYY-MM-DD HH:mm" /> },
    ],
    [
      { label: "참여 신청", value: info.allowJoin ? "가능" : "불가능" },
      { label: "공개 범위", value: GroupVisibilityLabel[info.visibility] },
      {
        label: "활동공개",
        onClick: () => onTabChange("exposure"),
        value: (
          <Box display="flex" alignItems="center" gap="10px" flexWrap="wrap">
            <Box display="flex" alignItems="center" gap="4px">
              <Briefcase size={14} />
              {info.hasPublishedPortfolio ? `${portfolioCounts.listCount}/${portfolioCounts.cardCount}` : "-"}
            </Box>
            <Box display="flex" alignItems="center" gap="4px">
              <Presentation size={14} />
              {info.seminarCount}
            </Box>
            <Box display="flex" alignItems="center" gap="4px">
              <FileText size={14} />
              {info.reportCount}
            </Box>
          </Box>
        ),
      },
    ],
  ];

  return (
    <Box>
      <Text fontSize="md" whiteSpace="pre-wrap" color="gray.700" mb={4}>
        {info.description || "그룹 설명이 없습니다."}
      </Text>
      <Box display="flex" flexWrap="wrap" gap="6px" mb={5}>
        {info.isMember ? (
          showCreateChatRoom ? (
            <Button
              flex="1"
              size="sm"
              variant="outline"
              disabled={action.isPending}
              onClick={handleCreateChatRoom}
              transition="background-color 150ms ease, transform 100ms ease"
              _hover={{ bg: "var(--main-color)", color: "white", borderColor: "var(--main-color)" }}
              _active={{ transform: "scale(0.97)" }}
            >
              <MessageCirclePlus size={16} /> 채팅방 생성
            </Button>
          ) : (
            <Button
              flex="1"
              size="sm"
              variant="outline"
              disabled={action.isPending || !info.hasChatRoom || info.isChatParticipant}
              onClick={info.hasChatRoom && !info.isChatParticipant ? handleJoinChat : undefined}
              transition="background-color 150ms ease, transform 100ms ease"
              _hover={{ bg: "var(--main-color)", color: "white", borderColor: "var(--main-color)" }}
              _active={{ transform: "scale(0.97)" }}
            >
              <MessageCircle size={16} /> 채팅 참여
            </Button>
          )
        ) : (
          <Button
            flex="1"
            size="sm"
            variant="outline"
            disabled={action.isPending || !info.allowJoin}
            onClick={handleJoinGroup}
            transition="background-color 150ms ease, transform 100ms ease"
            _hover={{ bg: "var(--main-color)", color: "white", borderColor: "var(--main-color)" }}
            _active={{ transform: "scale(0.97)" }}
          >
            <UserPlus size={16} /> 그룹 참가
          </Button>
        )}
        <Button
          flex="1"
          size="sm"
          variant="outline"
          disabled={action.isPending}
          onClick={() => action.mutate(() => isBookmarked ? GroupInfoApi.removeGroupBookmark(info.id) : GroupInfoApi.addGroupBookmark(info.id))}
          aria-pressed={isBookmarked}
          bg="transparent"
          color={isBookmarked ? "black" : undefined}
          transition="background-color 150ms ease, transform 100ms ease"
          _hover={{ bg: "transparent" }}
          _active={{ transform: "scale(0.97)" }}
        >
          <Bookmark size={16} color={isBookmarked ? "var(--chakra-colors-yellow-400)" : undefined} fill={isBookmarked ? "var(--chakra-colors-yellow-400)" : "none"} />
          {isBookmarked ? "즐겨찾기 취소" : "즐겨찾기"}
        </Button>
      </Box>
      <Box display="flex" flexDirection="column">
        {rowGroups.map((group, groupIndex) => (
          <Box
            key={groupIndex}
            display="flex"
            flexDirection="column"
            gap="10px"
            borderTop={groupIndex > 0 ? "1px solid" : undefined}
            borderColor="gray.300"
            mt={groupIndex > 0 ? "18px" : 0}
            pt={groupIndex > 0 ? "14px" : 0}
          >
            {group.map((row) => (
              <Box
                key={row.label}
                display="flex"
                alignItems="flex-start"
                gap="12px"
                px="8px"
                py="6px"
                borderRadius="6px"
                transition="background-color 150ms ease"
                cursor={row.onClick ? "pointer" : undefined}
                onClick={row.onClick}
                _hover={{ bg: "blackAlpha.50" }}
              >
                <Text flex="none" width="60px" fontSize="sm" color="gray.500">
                  {row.label}
                </Text>
                <Box flex="1" minW={0} fontSize="sm" wordBreak="break-all">
                  {row.value}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
