import { useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { Bell, Menu } from "lucide-react";
import { useUnreadNotificationCount } from "../../hooks/notification/useUnreadNotificationCount";
import { useIsManager } from "../../hooks/user/useIsManager";
import { cn } from "../../util/cn";
import { NotificationDropdown } from "./NotificationDropdown";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import styles from "./style.module.css";

type Props = {
  /** true이면 최대 너비 제한 없이 로고와 메뉴를 양 끝에 배치한다. */
  wide?: boolean;
  /** 내비게이션 컨테이너의 상하 패딩(px). */
  paddingY?: number;
};

export default function NavigationBar({ wide = false, paddingY }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const { isManager } = useIsManager();
  const { count: unreadCount } = useUnreadNotificationCount();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setNotificationVisible(false);
  };

  const toggleNotification = () => {
    setNotificationVisible(!notificationVisible);
    setMenuVisible(false);
  };

  return (
    <nav className={styles.navigationBar}>
      <div
        className={cn(styles.navContainer, wide && styles.wideNavContainer)}
        style={paddingY === undefined ? undefined : { paddingBlock: paddingY }}
      >
        <a href="https://app.khlug.org">
          <img
            src="https://cdn.khlug.org/images/khlug-long-logo.png"
            alt="KHLUG Logo"
            className={styles.logo}
          />
        </a>

        <div className={styles.desktopMenu}>
          <DesktopNav isManager={isManager} />

          <div className={styles.notificationWrapper}>
            <IconButton
              aria-label="알림"
              onClick={toggleNotification}
              variant="ghost"
              size="md"
              className={styles.notificationButton}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.notificationBadge} />}
            </IconButton>
            {notificationVisible && <NotificationDropdown />}
          </div>
        </div>

        <div className={styles.mobileActions}>
          <div className={styles.notificationWrapper}>
            <IconButton
              aria-label="알림"
              onClick={toggleNotification}
              variant="ghost"
              size="sm"
              className={styles.notificationButton}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.notificationBadge} />}
            </IconButton>
            {notificationVisible && <NotificationDropdown />}
          </div>

          <IconButton
            aria-label="메뉴"
            onClick={toggleMenu}
            variant="ghost"
            size="sm"
          >
            <Menu size={24} />
          </IconButton>
        </div>
      </div>

      {menuVisible && <MobileNav isManager={isManager} />}
    </nav>
  );
}
