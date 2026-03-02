import KhlugIcon from "../KhlugIcon";

import "./style.css";

type Props = {
  label: string;
};

/**
 * @deprecated 해당 컴포넌트는 `SightLayout`을 활용할 때 사용합니다.
 *             `MainLayout`을 사용해서 구현하도록 수정해주시고 해당 컴포넌트를 제거해주세요.
 */
export default function Location({ label }: Props) {
  return (
    <div className="location">
      <KhlugIcon />
      <span>{label}</span>
    </div>
  );
}
