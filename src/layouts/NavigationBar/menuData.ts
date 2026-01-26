export type MenuItem = {
  label: string;
  href: string;
  subItems: SubMenuItem[];
  requiresManager?: boolean;
};

export type SubMenuItem = {
  label: string;
  href: string;
  isDivider?: boolean;
};

export const menuItems: MenuItem[] = [
  {
    label: "소개",
    href: "https://khlug.org/about",
    subItems: [
      { label: "쿠러그", href: "https://khlug.org/about" },
      { label: "활동소개", href: "https://khlug.org/activity" },
      { label: "타임라인", href: "https://khlug.org/timeline" },
      { label: "Hello 블로그", href: "https://hello.khlug.org/" },
      { label: "인스타그램", href: "https://instagram.com/khu_khlug" },
      { label: "이메일", href: "mailto:we_are@khlug.org" },
    ],
  },
  {
    label: "공지",
    href: "https://khlug.org/documents",
    subItems: [
      { label: "문서고", href: "https://khlug.org/documents" },
      { label: "장부", href: "https://app.khlug.org/finance" },
      { label: "회칙", href: "https://khlug.org/rule" },
    ],
  },
  {
    label: "포럼",
    href: "https://khlug.org/talk",
    subItems: [
      { label: "담소", href: "https://khlug.org/talk" },
      { label: "사진첩", href: "https://khlug.org/album" },
      { label: "일정", href: "https://khlug.org/schedule" },
    ],
  },
  {
    label: "그룹",
    href: "https://khlug.org/group",
    subItems: [
      { label: "내 그룹", href: "https://khlug.org/group" },
      { label: "연구 그룹", href: "https://khlug.org/group/research" },
      { label: "공식 그룹", href: "https://khlug.org/group/program" },
      { label: "", href: "", isDivider: true },
      { label: "진행 그룹", href: "https://khlug.org/group/progress" },
      { label: "성공 그룹", href: "https://khlug.org/group/success" },
      { label: "", href: "", isDivider: true },
      { label: "세미나", href: "https://khlug.org/seminar" },
      { label: "포트폴리오", href: "https://khlug.org/portfolio" },
    ],
  },
  {
    label: "회원",
    href: "https://khlug.org/my",
    subItems: [
      { label: "내 정보", href: "https://khlug.org/my" },
      { label: "인포21 인증", href: "https://khlug.org/member/khuis" },
      { label: "실적", href: "https://khlug.org/achievement" },
      { label: "회원 명단", href: "https://khlug.org/member" },
    ],
  },
  {
    label: "LAB",
    href: "https://khlug.org/lab",
    subItems: [
      { label: "지원 신청", href: "https://khlug.org/support" },
      { label: "", href: "", isDivider: true },
      { label: "library", href: "https://library.khlug.org" },
    ],
  },
  {
    label: "운영",
    href: "#",
    requiresManager: true,
    subItems: [
      { label: "가입 신청", href: "https://khlug.org/apply" },
      { label: "회원 관리", href: "https://khlug.org/manage/member" },
      { label: "회비 납부", href: "https://khlug.org/manage/fee" },
      { label: "세미나 대상", href: "https://khlug.org/manage/seminar" },
      { label: "경험치 지급", href: "https://khlug.org/manage/exp" },
      { label: "출석 체크", href: "https://khlug.org/manage/attendance" },
      { label: "문자 발송", href: "https://khlug.org/manage/sms" },
      { label: "Slack 참여자", href: "https://khlug.org/manage/slack" },
      {
        label: "그룹 매칭 관리",
        href: "https://app.khlug.org/manage/group-matching",
      },
      { label: "", href: "", isDivider: true },
      { label: "사이트봇", href: "https://khlug.org/manage/sightbot" },
      { label: "infraBlue", href: "https://app.khlug.org/manage/infra-blue" },
      { label: "", href: "", isDivider: true },
      { label: "Hello 블로그", href: "https://khlug.org/manage/blog" },
      { label: "", href: "", isDivider: true },
      { label: "교류 단체", href: "https://khlug.org/manage/united" },
      { label: "관심 분야", href: "https://khlug.org/manage/interest" },
      { label: "타임라인", href: "https://khlug.org/manage/timeline" },
      { label: "회칙 목록", href: "https://khlug.org/manage/rule" },
      { label: "페이지", href: "https://khlug.org/manage/page" },
    ],
  },
];
