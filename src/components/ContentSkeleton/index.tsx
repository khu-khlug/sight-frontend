import styles from "./style.module.css";

export default function ContentSkeleton({ shimmer = true }: { shimmer?: boolean }) {
  return (
    <div className={`${styles.loading} ${shimmer ? styles.shimmer : ""}`} role="status" aria-label="불러오는 중">
      <div className={styles.box} style={{ width: "38%", height: 24 }} />
      <div className={styles.box} style={{ width: "80%", height: 16 }} />
      <div className={styles.box} style={{ width: "65%", height: 16 }} />
      <div className={styles.box} style={{ width: "100%", height: 120 }} />
      <div className={styles.box} style={{ width: "75%", height: 16 }} />
    </div>
  );
}
