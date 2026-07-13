import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import DoorLockContainer from "../../features/door-lock/DoorLockContainer";
import "../../features/door-lock/doorLock.css";
import styles from "./style.module.css";

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={styles.clock}>
      {`${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${"일월화수목금토"[now.getDay()]}요일 ${now.getHours()}시 ${String(now.getMinutes()).padStart(2, "0")}분`}
    </span>
  );
}

export default function DoorLockPage() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? `${styles.page} door-lock-dark` : styles.page}>
      <header className={styles.header}>
        <img
          src={
            isDark
              ? "/logo/logo-dark.png"
              : "https://cdn.khlug.org/images/khlug-long-logo.png"
          }
          alt="KHLUG Logo"
          className={styles.logo}
          onClick={() => setIsDark((prev) => !prev)}
          style={{ cursor: "pointer", opacity: 0.95 }}
        />
        <Clock />
      </header>
      <main className={styles.main}>
        <DoorLockContainer />
      </main>
      <ToastContainer
        containerId="door-lock"
        theme={isDark ? "dark" : "light"}
      />
    </div>
  );
}
