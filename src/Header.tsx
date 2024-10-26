import "./Header.css";

export default function Header() {
  return (
    <header className="global-header">
      <div>로고!</div>
      <div>
        <a className="nav-link">소개</a>
        <a className="nav-link">공지</a>
        <a className="nav-link">포럼</a>
        <a className="nav-link">그룹</a>
        <a className="nav-link">회원</a>
        <a className="nav-link">LAB</a>
        <a className="nav-link active">운영</a>
      </div>
    </header>
  );
}
