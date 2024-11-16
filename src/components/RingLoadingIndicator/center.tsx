import RingLoadingIndicator from ".";
import { cn } from "../../util/cn";

import "./style.css";

type Props = {
  className?: string;
};

export default function CenterRingLoadingIndicator({ className }: Props) {
  return (
    <div className={cn("center-ring-loading-indicator__wrapper", className)}>
      <RingLoadingIndicator />
    </div>
  );
}
