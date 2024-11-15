import { cn } from "../../util/cn";
import "./style.css";

type Props = {
  type?: "normal" | "error";
  children?: React.ReactNode;
};

export default function Container({ type = "normal", children }: Props) {
  return <div className={cn("container", { [type]: !!type })}>{children}</div>;
}
