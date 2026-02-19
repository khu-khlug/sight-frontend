import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";

import { cn } from "../../util/cn";
import { useIsManager } from "../../hooks/user/useIsManager";
import { menuItems } from "../NavigationBar/menuData";

import "./style.css";

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isManager } = useIsManager();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <header className="global-header">
      <a href="https://khlug.org">
        <img
          src="https://cdn.khlug.org/images/khlug-long-logo.png"
          alt="KHLUG Logo"
          style={{ height: "40px" }}
        />
      </a>
      <button className="global-header__bars-button" onClick={toggleMenu}>
        <FontAwesomeIcon icon={faBars} />
      </button>
      <div className={cn("menu", { show: menuVisible })}>
        {menuItems
          .filter((item) => !item.requiresManager || isManager)
          .map((item) => (
            <div className="nav-container" key={item.label}>
              <a
                href={item.href}
                className={cn("nav-link", { active: item.requiresManager })}
              >
                {item.label}
              </a>
              <div className="sub-nav">
                {item.subItems.map((subItem, index) =>
                  subItem.isDivider ? (
                    <hr key={index} />
                  ) : (
                    <a href={subItem.href} key={subItem.label}>
                      {subItem.label}
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
      </div>
    </header>
  );
}
