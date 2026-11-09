import { calcDateInterval, formatDate } from "../../util/date";

type Props = {
  value: string;
  withSeconds?: boolean;
  format?: string;
};

/*
 * "yyyy. mm. dd. hh:mm[:ss] (n일 전|그끄제|그제|어제|오늘)". 날짜·시각과 상대일을 각각 nowrap
 * span으로 묶는다 — 이 컴포넌트를 쓰는 쪽에서 흔히 wordBreak="break-all"을 걸어두는데, 그러면
 * 아무 데서나 끊겨서 "yyyy. mm." 같은 중간이 잘릴 수 있다. 각 덩어리를 통째로 묶으면 그 사이
 * 공백에서만 줄바꿈된다. `format`을 넘기면 날짜·시각 부분의 구분자를 원하는 대로 바꿀 수 있다.
 */
export default function RelativeDateTime({ value, withSeconds = false, format }: Props) {
  const date = new Date(value);
  const resolvedFormat = format ?? (withSeconds ? "YYYY. MM. DD. HH:mm:ss" : "YYYY. MM. DD. HH:mm");
  return (
    <>
      <span style={{ whiteSpace: "nowrap" }}>{formatDate(date, resolvedFormat)}</span>{" "}
      <span style={{ whiteSpace: "nowrap" }}>({calcDateInterval(date)})</span>
    </>
  );
}
