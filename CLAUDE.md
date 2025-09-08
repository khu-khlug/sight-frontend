# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

경희대학교 중앙 IT 동아리 쿠러그(KHLUG)의 React + TypeScript 프론트엔드 애플리케이션입니다. Vite로 빌드되며, Yarn을 패키지 매니저로 사용하고, 회원 관리, 디스코드 연동, 도어락 관리 기능을 포함합니다.

## 개발 명령어

- **개발 서버**: `yarn dev` (Vite 개발 모드)
- **빌드**: `yarn build` (TypeScript 검사 후 Vite 프로덕션 빌드)
- **린트**: `yarn lint` (ESLint 실행)
- **미리보기**: `yarn preview` (프로덕션 빌드 미리보기)

## 아키텍처

### 주요 기술 스택
- **React 18** + TypeScript
- **Vite** 빌드 도구 (SWC 플러그인 사용)
- **React Router v6** 라우팅 (future flags 활성화)
- **TanStack Query** 서버 상태 관리
- **Axios** API 호출
- **React Modal** 모달 다이얼로그
- **FontAwesome**, **Lucide React** 아이콘
- **dayjs** 날짜 처리 (UTC/timezone 플러그인)

### 디렉토리 구조
```
src/
├── api/               # 도메인별로 구성된 API 레이어
│   ├── client/        # 클라이언트 관련 API 호출
│   ├── manage/        # 관리 API 호출 (user.ts, doorLockPassword.ts)
│   └── public/        # 공개 API 호출
├── components/        # 재사용 가능한 UI 컴포넌트 (CollegeIcon, KhlugIcon 등)
├── features/          # 기능별 컨테이너와 로직
│   ├── manage/        # 관리 기능 (MemberListContainer, DoorLockManagementContainer)
│   └── member/        # 회원 기능 (DiscordIntegrationContainer)
├── layouts/           # 레이아웃 컴포넌트
├── pages/             # 라우트 레벨 페이지 컴포넌트
│   ├── manage/        # 관리 페이지 (infra-blue, member-v2)
│   └── member/        # 회원 페이지 (integrate-discord)
├── util/              # 유틸리티 함수들
│   ├── cn.ts          # 클래스명 유틸리티
│   ├── date.ts        # 날짜 유틸리티
│   ├── extractErrorMessage.ts # 에러 처리
│   ├── types.ts       # 공통 타입
│   └── validator.ts   # 검증 유틸리티
├── App.tsx            # 라우터 설정
├── main.tsx           # 애플리케이션 진입점
└── constant.ts        # 애플리케이션 상수
```

### 주요 아키텍처 패턴

1. **기능별 구조**: 복잡한 기능들은 `features/`에서 자체 컨테이너와 모달로 구성
2. **API 레이어 분리**: API 호출은 `src/api/`에서 도메인별로 구성
3. **컨테이너 패턴**: 기능 컨테이너(예: `MemberListContainer`)가 비즈니스 로직과 상태를 캡슐화
4. **모달 조합**: 복잡한 플로우는 전용 모달 컴포넌트 사용 (예: `SwitchManagerModal`, `RemoveMemberModal`)

### 상태 관리
- **React 내장 상태 관리**: useState, useReducer 등 React 자체 상태 관리 활용
- **TanStack Query**: 서버 상태 관리 (main.tsx에서 QueryClient 설정)
- **React Router**: 네비게이션 상태
- **컴포넌트 로컬 상태**: UI 인터랙션

### 스타일링 & UI
- CSS 모듈 또는 표준 CSS 사용 (index.css)
- React 컴포넌트를 통한 FontAwesome 아이콘 통합
- 추가 아이콘을 위한 Lucide React
- React Modal (#root에 앱 엘리먼트 설정)

### TypeScript 설정
- 엄격한 TypeScript 설정 활성화
- ES2020 타겟, bundler 모듈 해상도
- 사용하지 않는 로컬 변수 및 매개변수 검사 활성화
- noEmit 모드 (Vite에서 처리)

## 개발 가이드라인

### API 연동
- API 호출은 `src/api/`에서 도메인별로 구성
- 데이터 페칭과 캐싱에 TanStack Query 사용
- 에러 처리는 `extractErrorMessage` 유틸리티 사용

### 컴포넌트 구성
- 재사용 가능한 컴포넌트는 `src/components/`에 위치
- 기능별 컴포넌트는 해당 기능 디렉토리 내에 유지
- 복잡한 기능은 컨테이너 패턴 사용

### 라우팅
- `App.tsx`에서 React Router v6를 사용하여 라우트 정의
- 향후 React Router 기능을 위한 future flags 활성화
- 페이지 컴포넌트는 `src/pages/`에서 도메인별로 구성

### 날짜 처리
- main.tsx에서 설정된 UTC 및 timezone 플러그인과 함께 dayjs 사용
- `src/util/date.ts`에서 날짜 유틸리티 사용

### 모달
- 적절한 접근성 설정으로 React Modal 사용
- 기능별 모달은 해당 컨테이너와 함께 위치
- 모달 컴포넌트는 기존 명명 규칙을 따라야 함