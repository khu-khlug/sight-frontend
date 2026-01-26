import { Box, Text, VStack, Spinner, Badge } from "@chakra-ui/react";
import { useNotifications } from "../../hooks/notification/useNotifications";
import type { NotificationDto } from "../../api/public/notification";
import styles from "./style.module.css";

const NotificationItem = ({ notification }: { notification: NotificationDto }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "COMMENT":
        return "blue";
      case "LIKE":
        return "pink";
      case "SCHEDULE":
        return "green";
      case "GROUP":
        return "purple";
      default:
        return "gray";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "COMMENT":
        return "댓글";
      case "LIKE":
        return "좋아요";
      case "SCHEDULE":
        return "일정";
      case "GROUP":
        return "그룹";
      default:
        return type;
    }
  };

  return (
    <Box
      className={styles.notificationItem}
      data-read={notification.isRead}
    >
      <Box className={styles.notificationHeader}>
        <Badge colorPalette={getTypeColor(notification.type)} size="sm">
          {getTypeLabel(notification.type)}
        </Badge>
        {!notification.isRead && (
          <Box className={styles.unreadDot} />
        )}
      </Box>
      <Text className={styles.notificationTitle}>{notification.title}</Text>
      <Text className={styles.notificationContent}>{notification.content}</Text>
    </Box>
  );
};

export const NotificationDropdown = () => {
  const { data, isLoading } = useNotifications(false);

  if (isLoading) {
    return (
      <Box className={styles.notificationDropdown}>
        <Box className={styles.dropdownLoading}>
          <Spinner size="sm" />
        </Box>
      </Box>
    );
  }

  if (!data || data.count === 0) {
    return (
      <Box className={styles.notificationDropdown}>
        <Box className={styles.emptyNotification}>
          <Text>새로운 알림이 없습니다</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.notificationDropdown}>
      <Box className={styles.dropdownHeader}>
        <Text className={styles.dropdownTitle}>알림</Text>
        <Text className={styles.dropdownCount}>{data.count}개</Text>
      </Box>
      <VStack className={styles.notificationList} gap={0}>
        {data.notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </VStack>
    </Box>
  );
};
