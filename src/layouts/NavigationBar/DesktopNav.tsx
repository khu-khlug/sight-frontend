import { menuItems, type MenuItem, type SubMenuItem } from "./menuData";
import styles from "./style.module.css";

type Props = {
  isManager: boolean;
};

function SubNavItem({ item }: { item: SubMenuItem }) {
  if (item.isDivider) {
    return <hr />;
  }
  return <a href={item.href}>{item.label}</a>;
}

function NavItem({ item }: { item: MenuItem }) {
  const isActive = item.requiresManager;

  return (
    <div className={styles.navItem}>
      <a
        href={item.href}
        className={`${styles.navLink} ${isActive ? styles.active : ""}`}
      >
        {item.label}
      </a>
      <div className={styles.subNav}>
        {item.subItems.map((subItem, index) => (
          <SubNavItem key={subItem.href || index} item={subItem} />
        ))}
      </div>
    </div>
  );
}

export function DesktopNav({ isManager }: Props) {
  const visibleItems = menuItems.filter(
    (item) => !item.requiresManager || isManager
  );

  return (
    <>
      {visibleItems.map((item) => (
        <NavItem key={item.label} item={item} />
      ))}
    </>
  );
}
