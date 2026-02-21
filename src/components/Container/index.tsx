import { cn } from "../../util/cn";
import "./style.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
  noMargin?: boolean;
};

export default function Container({ children, className, noMargin }: Props) {
  return (
    <div className={cn("container", noMargin && "no-margin", className)}>
      {children}
    </div>
  );
}
