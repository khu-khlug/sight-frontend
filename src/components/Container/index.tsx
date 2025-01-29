import { cn } from "../../util/cn";
import "./style.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function Container({ children, className }: Props) {
  return <div className={cn("container", className)}>{children}</div>;
}
