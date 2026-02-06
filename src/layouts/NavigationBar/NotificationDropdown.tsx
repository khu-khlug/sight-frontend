import { Box, Text, VStack, Spinner, Badge } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useNotifications } from "../../hooks/notification/useNotifications";
import { useReadNotifications } from "../../hooks/notification/useReadNotifications";
import type { NotificationDto } from "../../api/public/notification";
import styles from "./style.module.css";

type NotificationItemProps = {
  notification: NotificationDto;
  onRead: (notificationId: string) => void;
  onNavigate: (url: string) => void;
};

const NotificationItem = ({ notification, onRead, onNavigate }: NotificationItemProps) => {
  const isUnread = notification.readAt === null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return "blue";
      case "GROUP":
        return "purple";
      default:
        return "gray";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return "시스템";
      case "GROUP":
        return "그룹";
      default:
        return category;
    }
  };

  const handleClick = () => {
    // 읽음 처리
    if (isUnread) {
      onRead(notification.id);
    }

    // URL이 있으면 해당 URL로 이동
    if (notification.url) {
      onNavigate(notification.url);
    }
  };

  const relativeTimeStr = dayjs(notification.createdAt).fromNow();

  return (
    <Box
      className={styles.notificationItem}
      data-read={!isUnread}
      onClick={handleClick}
    >
      <Box className={styles.notificationHeader}>
        <Badge colorPalette={getCategoryColor(notification.category)} size="sm">
          {getCategoryLabel(notification.category)}
        </Badge>
        <Box display="flex" alignItems="center" gap="8px">
          <Text fontSize="xs" color="gray.500">
            {relativeTimeStr}
          </Text>
          {isUnread && <Box className={styles.unreadDot} />}
        </Box>
      </Box>
      <Text className={styles.notificationTitle}>{notification.title}</Text>
      <Text className={styles.notificationContent}>{notification.content}</Text>
    </Box>
  );
};

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useNotifications();
  const { mutate: readNotifications } = useReadNotifications();

  const handleRead = (notificationId: string) => {
    readNotifications([notificationId]);
  };

  const handleNavigate = (url: string) => {
    if (url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      navigate(url);
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.notificationDropdown}>
        <Box className={styles.dropdownLoading}>
          <Spinner size="sm" />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box className={styles.notificationDropdown}>
        <Box className={styles.emptyNotification}>
          <Text color="red.500">알림을 불러오는데 실패했습니다</Text>
        </Box>
      </Box>
    );
  }

  if (!data || data.notifications.length === 0) {
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
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={handleRead}
            onNavigate={handleNavigate}
          />
        ))}
      </VStack>
    </Box>
  );
};
