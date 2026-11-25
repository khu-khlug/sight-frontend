import "./style.css";

type Props = {
  // 기본은 style.css의 30px(기존 호출부 그대로) — 다른 아이콘과 나란히 쓸 때(예: FileWindow
  // 헤더)만 크기를 맞춰 줄인다.
  size?: number;
};

export default function KhlugIcon({ size }: Props) {
  // style.css의 margin-bottom:-8px는 기본 30px 크기를 인라인 텍스트 베이스라인에 맞추려는
  // 보정값이다 — size를 커스텀으로 쓰는 쪽(예: FileWindow의 flex 중앙정렬)에서는 이 보정이
  // 오히려 중앙선을 깨뜨리므로 0으로 상쇄한다.
  return <i className="khlug-icon" style={size ? { width: size, height: size, marginBottom: 0 } : undefined}></i>;
}
