import { ButtonHTMLAttributes } from "react";
import { cn } from "../../util/cn";

import "./style.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  className,
  type,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type={type}
      className={cn("component-button", className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
