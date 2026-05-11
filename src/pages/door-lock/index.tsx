import { type ReactNode } from "react";
import DoorLockContainer from "../../features/door-lock/DoorLockContainer";
import styles from "./style.module.css";

type Props = {
  headerRight?: ReactNode;
};

export default function DoorLockPage({ headerRight }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img
          src="https://cdn.khlug.org/images/khlug-long-logo.png"
          alt="KHLUG Logo"
          className={styles.logo}
        />
        {headerRight && <div>{headerRight}</div>}
      </header>
      <main className={styles.main}>
        <DoorLockContainer />
      </main>
    </div>
  );
}
