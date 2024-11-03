import { ButtonHTMLAttributes } from "react";

import "./style.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: () => void;
};

export default function Button({ children, className, type, onClick }: Props) {
  return (
    <button
      type={type}
      className={`component-button ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
