import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";

import { cn } from "../../util/cn";
import { useIsManager } from "../../hooks/user/useIsManager";

import "./style.css";

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isManager } = useIsManager();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <header className="global-header">
      <img
        src="https://cdn.khlug.org/images/khlug-long-logo.png"
        alt="KHLUG Logo"
        style={{ height: "40px" }}
      />
      <button className="global-header__bars-button" onClick={toggleMenu}>
        <FontAwesomeIcon icon={faBars} />
      </button>
      <div className={cn("menu", { show: menuVisible })}>
        <div className="nav-container">
          <a href="https://khlug.org/about" className="nav-link">
            소개
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/about">쿠러그</a>
            <a href="https://khlug.org/activity">활동소개</a>
            <a href="https://khlug.org/timeline">타임라인</a>
            <a href="https://hello.khlug.org/">Hello 블로그</a>
            <a href="https://instagram.com/khu_khlug">인스타그램</a>
            <a href="mailto:we_are@khlug.org">이메일</a>
          </div>
        </div>
        <div className="nav-container">
          <a href="https://khlug.org/documents" className="nav-link">
            공지
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/documents">문서고</a>
            <a href="https://app.khlug.org/finance">장부</a>
            <a href="https://khlug.org/rule">회칙</a>
          </div>
        </div>
        <div className="nav-container">
          <a href="https://khlug.org/talk" className="nav-link">
            포럼
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/talk">담소</a>
            <a href="https://khlug.org/album">사진첩</a>
            <a href="https://khlug.org/archive">아카이브</a>
            <a href="https://khlug.org/schedule">일정</a>
          </div>
        </div>
        <div className="nav-container">
          <a href="https://khlug.org/group" className="nav-link">
            그룹
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/group">내 그룹</a>
            <a href="https://khlug.org/group/research">연구 그룹</a>
            <a href="https://khlug.org/group/program">공식 그룹</a>
            <hr />
            <a href="https://khlug.org/group/progress">진행 그룹</a>
            <a href="https://khlug.org/group/success">성공 그룹</a>
            <hr />
            <a href="https://khlug.org/seminar">세미나</a>
            <a href="https://khlug.org/portfolio">포트폴리오</a>
          </div>
        </div>
        <div className="nav-container">
          <a href="https://khlug.org/my" className="nav-link">
            회원
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/my">내 정보</a>
            <a href="https://khlug.org/member/khuis">인포21 인증</a>
            <a href="https://khlug.org/achievement">실적</a>
            <a href="https://khlug.org/member">회원 명단</a>
          </div>
        </div>
        <div className="nav-container">
          <a href="https://khlug.org/lab" className="nav-link">
            LAB
          </a>
          <div className="sub-nav">
            <a href="https://khlug.org/support">지원 신청</a>
            <hr />
            <a href="https://library.khlug.org">library</a>
          </div>
        </div>
        {isManager && (
          <div className="nav-container">
            <a href="#" className="nav-link active">
              운영
            </a>
            <div className="sub-nav">
              <a href="https://khlug.org/apply">가입 신청</a>
              <a href="https://khlug.org/manage/member">회원 관리</a>
              <a href="https://khlug.org/manage/fee">회비 납부</a>
              <a href="https://khlug.org/manage/seminar">세미나 대상</a>
              <a href="https://khlug.org/manage/exp">경험치 지급</a>
              <a href="https://khlug.org/manage/attendance">출석 체크</a>
              <a href="https://khlug.org/manage/sms">문자 발송</a>
              <a href="https://khlug.org/manage/slack">Slack 참여자</a>
              <a href="https://khlug.org/manage/slack">그룹 매칭 관리</a>
              <hr />
              <a href="https://khlug.org/manage/sightbot">사이트봇</a>
              <a href="https://app.khlug.org/manage/infra-blue">infraBlue</a>
              <hr />
              <a href="https://khlug.org/manage/blog">Hello 블로그</a>
              <hr />
              <a href="https://khlug.org/manage/united">교류 단체</a>
              <a href="https://khlug.org/manage/interest">관심 분야</a>
              <a href="https://khlug.org/manage/timeline">타임라인</a>
              <a href="https://khlug.org/manage/rule">회칙 목록</a>
              <a href="https://khlug.org/manage/page">페이지</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
