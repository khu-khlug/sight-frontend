# sight-frontend

경희대학교 중앙 IT 동아리 쿠러그의 프론트엔드 어플리케이션 저장소입니다.

## Prerequisites

- Node.js (버전은 [.nvmrc](.nvmrc) 참고)

## Installation

```sh
$ git clone https://github.com/khu-khlug/sight-frontend.git
$ yarn
```

## Run

```sh
$ yarn run dev
```

## Build

```sh
$ yarn run build
```

## 디렉토리 구조

```
sight-frontend/
├── public/
│   └── ...
├── src/
│   ├── api/               # API 호출과 관련된 로직
│   ├── components/        # 공통 UI 컴포넌트
│   ├── features/          # 페이지별 주요 기능을 담당하는 모듈
|   ├── hooks/             # 리액트 훅이 정의된 파일
│   ├── layouts/           # 레이아웃 관련 컴포넌트
│   ├── pages/             # 라우팅되는 주요 페이지들
│   ├── util/              # 공통으로 사용되는 유틸리티 함수
│   ├── App.tsx            # 라우트가 정의된 파일
│   ├── main.tsx           # 리액트 엔트리포인트
│   └── ...
└── package.json
```

개발 중에 위 디렉토리 구조 외 다른 디렉토리가 존재하는 걸 발견하시면, PR을 통해 수정해주세요!
