import "./Footer.css";

export default function Footer() {
  return (
    <footer className="global-footer">
      <p>
        17104 경기도 용인시 기흥구 덕영대로 1732, 경희대학교 국제캠퍼스 학생회관
        405호
      </p>
      <p className="sponsor">
        <a href="https://khu.ac.kr/">
          <img src="https://khlug.org/images/khu.png" />
          경희대학교
        </a>
        <a href="https://khlug.org/">
          <img src="https://khlug.org/images/favicon.gif" />
          쿠러그
        </a>
      </p>
    </footer>
  );
}
