import { cn } from "../../util/cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons/faCircleExclamation";

import "./style.css";

type Props = {
  type?: "normal" | "error";
  children?: React.ReactNode;
};

export default function Callout({ type = "normal", children }: Props) {
  return (
    <div className={cn("callout", { [type]: !!type })}>
      <FontAwesomeIcon
        icon={faCircleExclamation}
        className="callout__exclamation-icon"
      />
      {children}
    </div>
  );
}
