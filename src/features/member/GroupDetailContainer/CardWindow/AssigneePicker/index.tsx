import { Box, Popover, Portal, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { GroupMemberListApi } from "../../../../../api/public/group/GroupMemberListApi";
import styles from "./style.module.css";

type Props = {
  groupId: number;
  onSelect: (userId: number | null) => void;
  ariaLabel: string;
  triggerClassName: string;
  children: ReactNode;
};

export default function AssigneePicker({ groupId, onSelect, ariaLabel, triggerClassName, children }: Props) {
  const [open, setOpen] = useState(false);
  const membersQuery = useQuery({
    queryKey: ["group-detail", groupId, "members"],
    queryFn: () => GroupMemberListApi.listGroupMembers(groupId),
    enabled: open,
  });
  const members = membersQuery.data ?? [];

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-start" }}
    >
      <Popover.Trigger asChild>
        <Box as="button" className={triggerClassName} aria-label={ariaLabel}>
          {children}
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={styles.content}>
            <Box
              as="button"
              className={styles.memberItem}
              color="gray.400"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              담당자 없음
            </Box>
            {membersQuery.isPending ? (
              <Text fontSize="xs" color="gray.400" p={2}>불러오는 중...</Text>
            ) : members.length === 0 ? (
              <Text fontSize="xs" color="gray.400" p={2}>멤버가 없습니다.</Text>
            ) : (
              members.map((member) => (
                <Box
                  key={member.userId}
                  as="button"
                  className={styles.memberItem}
                  onClick={() => {
                    onSelect(member.userId);
                    setOpen(false);
                  }}
                >
                  {member.name}
                </Box>
              ))
            )}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
