import { useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { Bell, Menu } from "lucide-react";
import { useUnreadNotificationCount } from "../../hooks/notification/useUnreadNotificationCount";
import { useIsManager } from "../../hooks/user/useIsManager";
import { NotificationDropdown } from "./NotificationDropdown";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import styles from "./style.module.css";

export default function NavigationBar() {
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
      <div className={styles.navContainer}>
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
