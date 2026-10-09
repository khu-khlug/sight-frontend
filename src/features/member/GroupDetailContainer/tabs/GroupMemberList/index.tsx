import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { GroupMemberListApi } from "../../../../../api/public/group/GroupMemberListApi";
import { useQuery } from "@tanstack/react-query";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Badge, Box, Button, Text } from "@chakra-ui/react";
import { StretchHorizontal, PenBox } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Collapse from "../../../../../components/Collapse";
import CollegeIcon from "../../../../../components/CollegeIcon";
import { GroupCategory } from "../../../../../constant";
import { useCurrentUser } from "../../../../../hooks/user/useCurrentUser";
import { GroupMember } from "./types";

type Props = {
  groupId: number;
  category: GroupCategory;
};

// 그룹장이 있으면 목록 맨 앞으로 오도록 정렬한다.
const sortMembers = (members: GroupMember[]) =>
  [...members].sort((a, b) => Number(b.isLeader) - Number(a.isLeader));

export default function GroupMemberList({ groupId, category }: Props) {
  const membersQuery = useQuery({ queryKey: ["group-detail", groupId, "members"], queryFn: () => GroupMemberListApi.listGroupMembers(groupId) });
  const action = useGroupAction(groupId);
  const members = membersQuery.data ?? [];
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const currentUserQuery = useCurrentUser();
  // 그룹장 위임/내보내기는 그룹장만 할 수 있는 동작이라, 보는 사람이 그룹장일 때만 뜬다.
  const viewerIsLeader = members.some(
    (member) => member.userId === currentUserQuery.data?.id && member.isLeader,
  );

  if (membersQuery.isPending) return <ContentSkeleton />;
  if (membersQuery.isError) return <Text role="alert">멤버를 불러오지 못했습니다.</Text>;
  return (
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>
        그룹 참여는 본인이 직접 해야 합니다.
      </Text>
      <Text fontSize="md" color="black" mb={3}>
        멤버 {members.length}명
      </Text>
      <Box display="flex" flexDirection="column" gap="8px">
        {sortMembers(members).map((member) => {
          const isSelected = selectedUserId === member.userId;

          return (
            <Box key={member.userId}>
              <Box
                display="flex"
                flexDirection="column"
                gap="4px"
                px="8px"
                py="6px"
                borderRadius="6px"
                bg={isSelected ? "blackAlpha.100" : "whiteAlpha.700"}
                cursor={member.isLeader ? "default" : "pointer"}
                transition="background-color 150ms ease, transform 100ms ease"
                _hover={member.isLeader ? undefined : { bg: "blackAlpha.50" }}
                _active={member.isLeader ? undefined : { transform: "scale(0.97)" }}
                onClick={
                  // 그룹장 자신의 카드는 선택(위임/내보내기 패널)이 뜨면 안 된다 — 스스로에게
                  // 할 수 없는 동작이라 눌러도 아무 반응이 없어야 한다.
                  member.isLeader
                    ? undefined
                    : () => setSelectedUserId((prev) => (prev === member.userId ? null : member.userId))
                }
              >
                <Box display="flex" alignItems="center" flexWrap="wrap" gap="6px">
                  {member.isLeader && (
                    <Badge colorPalette="red" size="sm" flex="none">
                      그룹장
                    </Badge>
                  )}
                  <Badge size="sm" display="flex" alignItems="center" gap="4px" flex="none">
                    <CollegeIcon college={member.college} size={14} />
                    {member.college}
                  </Badge>
                </Box>
                <Box display="flex" alignItems="center" gap="8px">
                  {/* 이 Box가 flex:1로 남는 공간을 다 차지하고, 안의 Text는 내용 너비만큼만
                      차지한다 — 그래야 이름 옆 빈 공간을 눌러도 리다이렉션되지 않는다 */}
                  <Box flex="1" minW="0">
                    <Text
                      as="span"
                      display="inline"
                      fontSize="md"
                      wordBreak="break-all"
                      _hover={{ textDecoration: "underline" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/member/${member.userId}`);
                      }}
                    >
                      {member.name}
                    </Text>
                  </Box>
                  <Box display="flex" alignItems="center" gap="10px" flex="none" fontSize="sm" color="gray.500">
                    <Box display="flex" alignItems="center" gap="4px">
                      <StretchHorizontal size={14} />
                      {member.cardCount}
                    </Box>
                    <Box display="flex" alignItems="center" gap="4px">
                      <PenBox size={14} />
                      {member.recordCount}
                    </Box>
                  </Box>
                </Box>
              </Box>
              {viewerIsLeader && (
                <Collapse open={isSelected}>
                  <Box display="flex" gap="6px" mt="6px" px="8px" py="8px" borderRadius="6px" bg="blackAlpha.50">
                    <Button flex="1" size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate(() => GroupMemberListApi.delegateGroupLeader(groupId, member.userId))}>
                      그룹장 위임
                    </Button>
                    {/* 멤버 내보내기는 운영 카테고리 그룹에서는 제외된다(GROUP_BUSINESS_RULES.md
                        §5-3: "누가: 그룹장 (운영 카테고리 제외)") — 그룹장 위임은 이 예외가
                        없어서(§5-4) 카테고리와 무관하게 그대로 둔다. */}
                    {category !== GroupCategory.MANAGE && (
                      <Button flex="1" size="sm" variant="outline" colorPalette="red" disabled={action.isPending} onClick={() => action.mutate(() => GroupMemberListApi.kickGroupMember(groupId, member.userId))}>
                        내보내기
                      </Button>
                    )}
                  </Box>
                </Collapse>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
