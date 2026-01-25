import { menuItems, type MenuItem, type SubMenuItem } from "./menuData";
import styles from "./style.module.css";

type Props = {
  isManager: boolean;
};

function MobileSubNavItem({ item }: { item: SubMenuItem }) {
  if (item.isDivider) {
    return <hr />;
  }
  return <a href={item.href}>{item.label}</a>;
}

function MobileNavItem({ item }: { item: MenuItem }) {
  const isActive = item.requiresManager;

  return (
    <div className={styles.mobileNavItem}>
      <a
        href={item.href}
        className={`${styles.mobileNavLink} ${isActive ? styles.active : ""}`}
      >
        {item.label}
      </a>
      <div className={styles.mobileSubNav}>
        {item.subItems.map((subItem, index) => (
          <MobileSubNavItem key={subItem.href || index} item={subItem} />
        ))}
      </div>
    </div>
  );
}

export function MobileNav({ isManager }: Props) {
  const visibleItems = menuItems.filter(
    (item) => !item.requiresManager || isManager
  );

  return (
    <div className={styles.mobileMenu}>
      {visibleItems.map((item) => (
        <MobileNavItem key={item.label} item={item} />
      ))}
    </div>
  );
}
