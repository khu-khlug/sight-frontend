import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import DoorLockContainer from "../../features/door-lock/DoorLockContainer";
import { openRelay } from "../../api/public/doorLock";
import "../../features/door-lock/doorLock.css";
import styles from "./style.module.css";

const BYPASS_TAP_COUNT = 6;
const BYPASS_TAP_WINDOW_MS = 5000;

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
  const logoTapTimestamps = useRef<number[]>([]);

  // 도입 초기 인증 오류 대비용 임시 우회 — 시스템 안정화되면 제거.
  // 로고를 5초 안에 6번 연속 탭하면 인증 없이 바로 릴레이를 연다.
  const handleLogoClick = () => {
    setIsDark((prev) => !prev);

    const now = Date.now();
    const recentTaps = logoTapTimestamps.current.filter(
      (t) => now - t < BYPASS_TAP_WINDOW_MS,
    );
    recentTaps.push(now);

    if (recentTaps.length >= BYPASS_TAP_COUNT) {
      openRelay("bypass-logo-tap");
      toast.info("우회로 문을 열었습니다", { containerId: "door-lock" });
      logoTapTimestamps.current = [];
    } else {
      logoTapTimestamps.current = recentTaps;
    }
  };

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
          onClick={handleLogoClick}
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
