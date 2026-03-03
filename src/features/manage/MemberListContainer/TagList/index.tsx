import styles from "./style.module.css";

type Props = {
  redTags: string[];
  normalTags: string[];
};

export default function TagList({ redTags, normalTags }: Props) {
  if (redTags.length === 0 && normalTags.length === 0) {
    return <span className={styles["empty"]}>태그가 없습니다</span>;
  }

  return (
    <div className={styles["tag-list"]}>
      {redTags.map((tag) => (
        <span key={`red-${tag}`} className={`${styles["tag"]} ${styles["red"]}`}>
          {tag}
        </span>
      ))}
      {normalTags.map((tag) => (
        <span key={tag} className={styles["tag"]}>
          {tag}
        </span>
      ))}
    </div>
  );
}
