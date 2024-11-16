import KhlugIcon from "../KhlugIcon";

import "./style.css";

type Props = {
  label: string;
};

export default function Location({ label }: Props) {
  return (
    <div className="location">
      <KhlugIcon />
      <span>{label}</span>
    </div>
  );
}
