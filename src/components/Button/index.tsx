import { ButtonHTMLAttributes } from "react";
import { cn } from "../../util/cn";

import styles from "./style.module.css";

type Variant = "primary" | "neutral";

type Props = {
  children?: React.ReactNode;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  variant?: Variant;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  className,
  type,
  variant = "primary",
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type={type}
      className={cn(styles["component-button"], styles[variant], className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
