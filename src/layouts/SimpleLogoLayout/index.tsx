import styles from "./style.module.css";

type Props = {
  children?: React.ReactNode;
};

export default function SimpleLogoLayout({ children }: Props) {
  return (
    <div>
      <header className={styles["logo-header"]}>
        <img
          src="https://cdn.khlug.org/images/khlug-long-logo.png"
          alt="Logo"
        />
      </header>
      {children}
    </div>
  );
}
